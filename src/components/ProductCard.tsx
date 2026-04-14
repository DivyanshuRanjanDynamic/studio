'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Scale, Star, Truck, BadgePercent } from 'lucide-react';
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

  const avgRating =
    typeof product.avgRating === 'number'
      ? product.avgRating
      : product.reviews?.length
        ? Math.round(
            (product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
              product.reviews.length) *
              10
          ) / 10
        : null;
  const reviewCount = product.reviewCount || product.reviews?.length || 0;
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
      <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-[0_16px_35px_rgba(15,23,42,0.10)] sm:rounded-[28px] sm:hover:-translate-y-1 sm:hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
        <div className="relative border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white p-2.5 sm:p-4">
          <div className="absolute left-2.5 top-2.5 z-20 flex max-w-[70%] flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:max-w-[80%] sm:gap-2">
            <Badge className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2F5FA7] shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.18em]">
              {product.categoryId?.replace('-', ' ')}
            </Badge>
            {discount > 0 && (
              <Badge className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-700 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.18em]">
                <BadgePercent className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {discount}% off
              </Badge>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompare(product);
            }}
            className={`absolute right-2.5 top-2.5 z-20 hidden h-7 w-7 items-center justify-center rounded-full border transition sm:right-4 sm:top-4 sm:flex sm:h-10 sm:w-10 ${
              isComparing
                ? 'border-[#2F5FA7] bg-[#2F5FA7] text-white'
                : 'border-slate-200 bg-white text-slate-500 hover:border-[#2F5FA7] hover:text-[#2F5FA7]'
            }`}
            aria-label="Compare component"
          >
            <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          <Link
            href={`/shop/${product.id}`}
            className="relative mt-8 block aspect-[4/3] overflow-hidden rounded-xl bg-white sm:mt-12 sm:rounded-2xl"
            onMouseEnter={() => {
              if (productImages.length > 1) setCurrentImgIdx(1);
            }}
            onMouseLeave={() => setCurrentImgIdx(0)}
          >
            <Image
              src={productImages[currentImgIdx] || productImages[0]}
              alt={product.name}
              fill
              className={`object-contain p-2.5 transition duration-500 group-hover:scale-105 sm:p-4 ${
                isOutOfStock ? 'opacity-55 grayscale' : ''
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
              onError={(e: any) => {
                e.target.src = '/mechhub.png';
              }}
            />
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35">
                <Badge className="rounded-full border-none bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  Out of stock
                </Badge>
              </div>
            )}
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3 sm:gap-3">
            <p className="max-w-[65%] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.18em]">
              {product.sku}
            </p>
            {avgRating === null ? (
              <p className="hidden text-[11px] font-bold text-slate-500 sm:block">No reviews yet</p>
            ) : (
              <div className="hidden items-center gap-1 text-[11px] font-bold text-slate-600 sm:flex">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{avgRating}</span>
                <span className="text-slate-400">({reviewCount})</span>
              </div>
            )}
          </div>

          <Link href={`/shop/${product.id}`} className="block min-w-0">
            <h3 className="line-clamp-2 min-h-[40px] break-words text-[15px] font-bold leading-5 text-slate-900 transition-colors group-hover:text-[#2F5FA7] sm:min-h-[52px] sm:text-base sm:leading-6">
              {product.name}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-[32px] break-words text-xs leading-4 text-slate-600 sm:mt-2 sm:min-h-[40px] sm:text-sm sm:leading-5">
              {product.specs || 'Industrial-grade component with verified procurement support.'}
            </p>
          </Link>

          <div className="mt-3 flex items-end justify-between gap-2 sm:mt-4 sm:gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-2xl font-black leading-none tracking-tight text-slate-950 sm:text-3xl">
                  ₹{product.salePrice?.toLocaleString('en-IN')}
                </span>
                {basePrice > product.salePrice && (
                  <span className="text-xs font-semibold text-slate-400 line-through sm:text-sm">
                    ₹{basePrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-700 sm:mt-1 sm:text-xs">
                {discount > 0 ? `You save ₹${(basePrice - product.salePrice).toLocaleString('en-IN')}` : 'Best listed price'}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Stock
              </p>
              <p
                className={`mt-1 text-sm font-bold ${
                  isOutOfStock
                    ? 'text-red-600'
                    : product.inventory < 20
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                }`}
              >
                {isOutOfStock
                  ? 'Unavailable'
                  : product.inventory < 20
                    ? `${product.inventory} left`
                    : `${product.inventory}+ ready`}
              </p>
            </div>
          </div>

          <div className="mt-3 hidden rounded-2xl bg-slate-50 px-3 py-3 sm:mt-4 sm:block">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Truck className="h-4 w-4 text-[#2F5FA7]" />
                <span className="font-semibold">Delivery</span>
              </div>
              <span className="text-right text-sm font-bold text-slate-900">
                {isOutOfStock ? 'Restock in progress' : 'Dispatch in 24-48 hrs'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
            <Button
              asChild
              variant="outline"
              className="hidden h-11 min-w-0 flex-1 rounded-2xl border-slate-200 bg-white px-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-50 sm:flex"
            >
              <Link href={`/shop/${product.id}`}>
                View details
              </Link>
            </Button>

            {isOutOfStock ? (
              <Button
                className="h-9 min-w-0 w-full rounded-xl bg-[#2F5FA7] px-2 text-[10px] font-black uppercase tracking-[0.1em] text-white hover:bg-[#254b86] sm:h-11 sm:flex-1 sm:rounded-2xl sm:px-3 sm:text-[11px] sm:tracking-[0.14em]"
                onClick={handleRestockRequest}
                disabled={isRequesting || hasRequested}
              >
                {isRequesting ? 'Sending...' : hasRequested ? 'Requested' : 'Notify me'}
              </Button>
            ) : (
              <Button
                className="h-9 w-full rounded-xl bg-[#FFD814] px-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-900 hover:bg-[#f7ca00] sm:h-11 sm:flex-1 sm:rounded-2xl sm:px-3 sm:text-xs sm:tracking-[0.18em]"
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
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add to cart</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
