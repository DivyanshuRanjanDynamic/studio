'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpRight } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: any;
  isComparing: boolean;
  toggleCompare: (product: any) => void;
  addItem: (item: any) => void;
}

export function ProductCard({ product, isComparing, toggleCompare, addItem }: ProductCardProps) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const productImages =
    product.images?.length > 0
      ? product.images.map((img: any) => (typeof img === 'string' ? img : img.urls.product))
      : ['/images/placeholder-part.svg'];

  const basePrice = product.basePrice || product.salePrice;
  const discount =
    basePrice > product.salePrice
      ? Math.round(((basePrice - product.salePrice) / basePrice) * 100)
      : 0;
  const isOutOfStock = product.inventory <= 0;
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const handleRestockRequest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db) return;

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit a restock request.',
      });
      router.push('/login?redirect=/shop');
      return;
    }

    setIsRequesting(true);
    try {
      await addDocumentNonBlocking(collection(db, 'restockRequests'), {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        userId: user.uid,
        userEmail: user.email || '',
        requestedAt: new Date().toISOString(),
        status: 'pending',
      });
      setHasRequested(true);
      toast({
        title: 'Restock request sent',
        description: 'We flagged this component for the procurement team.',
      });
    } catch (err) {
      console.error('Restock request failed:', err);
      toast({
        title: 'Request failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="group h-full min-w-0">
      <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-sm border border-lp-border bg-lp-card transition duration-300 hover:border-lp-primary/30">
        {/* Header: Category + Discount */}
        <div className="flex items-center justify-between px-3 pt-3 sm:px-4 sm:pt-4">
          <span className="lp-label-mono text-lp-muted-fg truncate">
            {product.categoryId?.replace('-', ' ')}
          </span>
          {discount > 0 && (
            <span className="lp-label-mono text-lp-primary">
              -{discount}%
            </span>
          )}
        </div>

        {/* Product Image */}
        <Link
          href={`/shop/${product.id}`}
          className="relative mx-3 mt-2 block aspect-square overflow-hidden rounded-sm bg-lp-accent/50 border border-lp-border/50 sm:mx-4 sm:mt-3"
          onMouseEnter={() => {
            if (productImages.length > 1) setCurrentImgIdx(1);
          }}
          onMouseLeave={() => setCurrentImgIdx(0)}
        >
          <Image
            src={productImages[currentImgIdx] || productImages[0]}
            alt={product.name}
            fill
            className={`object-contain p-4 transition duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'opacity-50 grayscale' : ''
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
            onError={(e: any) => {
              e.target.src = '/mechhub.png';
            }}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="lp-label-mono bg-lp-ink text-lp-ink-fg px-3 py-1.5 rounded-sm">
                Out of stock
              </span>
            </div>
          )}
          {/* Hover overlay */}
          {!isOutOfStock && (
            <div className="absolute inset-0 flex items-end justify-start p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-lp-ink/5">
              <span className="lp-label-mono text-lp-primary flex items-center gap-1">
                View details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          <Link href={`/shop/${product.id}`} className="block min-w-0">
            <h3 className="text-sm font-medium text-lp-fg leading-snug line-clamp-1 group-hover:text-lp-primary transition-colors">
              {product.name}
            </h3>
            <p className="mt-0.5 text-xs text-lp-muted-fg line-clamp-1">
              {product.specs || 'Industrial-grade component'}
            </p>
          </Link>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-medium text-lp-fg tracking-tight">
              ₹{product.salePrice?.toLocaleString('en-IN')}
            </span>
            {basePrice > product.salePrice && (
              <span className="text-xs text-lp-muted-fg line-through">
                ₹{basePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Stock + Dispatch */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={`lp-label-mono ${
              isOutOfStock
                ? 'text-lp-destructive'
                : product.inventory < 20
                  ? 'text-amber-600'
                  : 'text-emerald-600'
            }`}>
              {isOutOfStock
                ? 'Restocking'
                : `${product.inventory}+ ready`}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-lp-muted-fg">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M1 10h2l1-4h8l1 4h2M4 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="currentColor" strokeWidth="1.2"/></svg>
            <span className="lp-label-mono">
              {isOutOfStock ? 'Restock in progress' : 'Dispatch in 24-48 hrs'}
            </span>
          </div>

          {/* CTA */}
          <div className="mt-3 sm:mt-4">
            {isOutOfStock ? (
              <button
                className="w-full h-10 rounded-sm border border-lp-border lp-label-mono text-lp-fg hover:bg-lp-accent transition-colors flex items-center justify-center gap-1.5"
                onClick={handleRestockRequest}
                disabled={isRequesting || hasRequested}
              >
                {isRequesting ? 'Sending...' : hasRequested ? 'Requested' : 'Notify me'}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                className="w-full h-10 rounded-sm bg-lp-primary text-lp-primary-fg lp-label-mono hover:bg-lp-primary/90 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({
                    id: product.id,
                    name: product.name,
                    salePrice: product.salePrice,
                    basePrice,
                    sku: product.sku,
                    image: productImages[0],
                    inventory: product.inventory,
                    quantity: 1,
                  });
                  toast({
                    title: 'Added to cart',
                    description: `${product.name} is ready in your procurement list.`,
                  });
                }}
              >
                + Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
