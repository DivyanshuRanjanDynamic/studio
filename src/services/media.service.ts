import type * as admin from 'firebase-admin';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, S3_REGION } from '@/lib/s3-client';
import { logger } from '@/utils/logger';

export interface ImageUploadMetadata {
  productId: string;
  productName: string;
  sku: string;
  type: string; // 'main', 'angle', 'detail'
}

export interface ImageMetadata {
  id: string;
  type: string;
  urls: {
    thumb: string;
    product: string;
    zoom: string;
  };
  createdAt: string;
}

export class MediaService {
  private s3: S3Client;
  private firestore: admin.firestore.Firestore;
  private bucketName: string;

  constructor(adminFirestore: admin.firestore.Firestore) {
    this.s3 = s3Client;
    this.firestore = adminFirestore;
    this.bucketName = S3_BUCKET;
  }

  /**
   * SEO-friendly name generator with slugification
   */
  private generateSeoFileName(
    productName: string,
    sku: string,
    type: string,
    size: string
  ): string {
    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `${slug}-${sku}-${type}-${size}.webp`;
  }

  /**
   * Production-grade image processing pipeline
   */
  async processAndUploadProductImage(
    buffer: Buffer,
    metadata: ImageUploadMetadata
  ): Promise<ImageMetadata> {
    const sizes = [
      { name: 'thumb', width: 300 },
      { name: 'product', width: 800 },
      { name: 'zoom', width: 1600 },
    ];

    const slug = metadata.productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const imageId = Math.random().toString(36).substring(2, 9);

    const uploadPromises = sizes.map(async (size) => {
      const fileName = `${imageId}-${metadata.type}-${size.name}.webp`;
      const storagePath = `products/${slug}/${fileName}`;

      logger.info({
        event: 'media_processing',
        size: size.name,
        path: storagePath,
        bucket: this.bucketName,
      });

      const sharp = require('sharp');
      const optimizedBuffer = await sharp(buffer)
        .resize(size.width, size.width, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      // S3 Upload
      try {
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: storagePath,
            Body: optimizedBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );
      } catch (err: any) {
        logger.error({
          event: 'media_upload_failed',
          path: storagePath,
          error: err.message,
          code: err.code,
        });

        throw err;
      }

      return {
        size: size.name,
        url: `https://${this.bucketName}.s3.${S3_REGION}.amazonaws.com/${storagePath}`,
      };
    });

    const urls = await Promise.all(uploadPromises);

    const result: ImageMetadata = {
      id: imageId,
      type: metadata.type,
      urls: urls.reduce((acc: any, curr) => {
        acc[curr.size] = curr.url;
        return acc;
      }, {}),
      createdAt: new Date().toISOString(),
    };

    // Sync to Firestore immediately
    await this.firestore
      .collection('products')
      .doc(metadata.productId)
      .update({
        images: (require('firebase-admin') as any).firestore.FieldValue.arrayUnion(result),
        updatedAt: new Date().toISOString(),
      });

    return result;
  }

  /**
   * Cleanup assets from S3 and metadata
   */
  async deleteProductImage(
    productId: string,
    imageId: string,
    urls: Record<string, string>
  ): Promise<void> {
    // 1. Delete all size variants from S3
    const deletePromises = Object.values(urls).map(async (url) => {
      try {
        // Extract file path from S3 URL
        // Format: https://${bucket}.s3.${region}.amazonaws.com/${path}
        const urlParts = url.split('.amazonaws.com/');
        const storagePath = urlParts[1];

        if (storagePath) {
          await this.s3.send(
            new DeleteObjectCommand({
              Bucket: this.bucketName,
              Key: storagePath,
            })
          );
        }
      } catch (err: any) {
        logger.warn({
          event: 'media_delete_failed',
          url: url,
          error: err.message,
        });
      }
    });

    await Promise.all(deletePromises);

    // 2. Remove from Firestore
    const productRef = this.firestore.collection('products').doc(productId);
    const productDoc = await productRef.get();
    if (productDoc.exists) {
      const currentImages = productDoc.data()?.images || [];
      const updatedImages = currentImages.filter((img: any) => img.id !== imageId);
      await productRef.update({
        images: updatedImages,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Complete product purge: S3 assets + Firestore document
   */
  async deleteAllProductAssets(productId: string): Promise<void> {
    const productRef = this.firestore.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    const data = productDoc.data();
    const images = data?.images || [];

    logger.info({
      event: 'media_purge_start',
      productId,
      imageCount: images.length,
    });

    // 1. Delete all images from S3
    const allDeletePromises: Promise<any>[] = [];

    for (const image of images) {
      if (image.urls) {
        const variantPromises = Object.values(image.urls).map(async (url: any) => {
          try {
            const urlParts = url.split('.amazonaws.com/');
            const storagePath = urlParts[1];
            if (storagePath) {
              await this.s3.send(
                new DeleteObjectCommand({
                  Bucket: this.bucketName,
                  Key: storagePath,
                })
              );
            }
          } catch (err: any) {
            logger.warn({
              event: 'media_purge_delete_failed',
              url: url,
              error: err.message,
            });
          }
        });
        allDeletePromises.push(...variantPromises);
      }
    }

    await Promise.all(allDeletePromises);

    // 2. Delete Firestore document
    await productRef.delete();

    logger.info({
      event: 'media_purge_complete',
      productId,
    });
  }
}
