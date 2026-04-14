'use client';

import { Fragment, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import Fuse from 'fuse.js';
import { useCart } from '@/context/CartContext';
import { BackToHomeBar } from '@/components/BackToHomeBar';
import {
  Search,
  Package,
  Filter,
  SlidersHorizontal,
  Store,
  Scale,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

type PriceBand = 'all' | 'under-200' | '200-500' | '500-1000' | '1000-plus';
type StockFilter = 'all' | 'in-stock' | 'low-stock';

type ShopProduct = {
  id: string;
  name: string;
  sku: string;
  specs?: string;
  categoryId: string;
  salePrice: number;
  basePrice?: number;
  inventory: number;
  isActive?: boolean;
  images?: Array<string | { urls?: { product?: string; thumb?: string } }>;
  avgRating?: number;
  reviewCount?: number;
  reviews?: Array<{ rating: number }>;
  createdAt?: string | { seconds?: number };
};

const CATEGORIES = [
  { id: 'all', label: 'All Components' },
  { id: 'bearings', label: 'Bearings' },
  { id: 'linear-motion', label: 'Linear Motion' },
  { id: 'transmission', label: 'Transmission' },
  { id: 'raw-materials', label: 'Raw Materials' },
  { id: 'fasteners', label: 'Fasteners' },
];

const SORT_OPTIONS = [
  'Popular',
  'Price: Low to High',
  'Price: High to Low',
  'Newest',
  'Inventory',
] as const;

const PRICE_BANDS: Array<{ id: PriceBand; label: string }> = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-200', label: 'Under ₹200' },
  { id: '200-500', label: '₹200 to ₹500' },
  { id: '500-1000', label: '₹500 to ₹1,000' },
  { id: '1000-plus', label: 'Above ₹1,000' },
];

const STOCK_FILTERS: Array<{ id: StockFilter; label: string }> = [
  { id: 'all', label: 'All Stock' },
  { id: 'in-stock', label: 'Ready to Dispatch' },
  { id: 'low-stock', label: 'Low Stock' },
];

function getDiscount(product: ShopProduct) {
  if (!product.basePrice || product.basePrice <= product.salePrice) return 0;
  return Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100);
}

function getRating(product: ShopProduct): number | null {
  if (typeof product.avgRating === 'number') return product.avgRating;
  if (product.reviews?.length) {
    const total = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / product.reviews.length) * 10) / 10;
  }
  return null;
}

function getReviewCount(product: ShopProduct) {
  if (typeof product.reviewCount === 'number') return product.reviewCount;
  return product.reviews?.length || 0;
}

function toSeconds(createdAt: string | { seconds?: number } | undefined): number {
  if (!createdAt) return 0;
  if (typeof createdAt === 'string') {
    const parsed = new Date(createdAt).getTime();
    return Number.isNaN(parsed) ? 0 : parsed / 1000;
  }
  return createdAt.seconds ?? 0;
}

function matchesPriceBand(price: number, band: PriceBand) {
  if (band === 'under-200') return price < 200;
  if (band === '200-500') return price >= 200 && price <= 500;
  if (band === '500-1000') return price > 500 && price <= 1000;
  if (band === '1000-plus') return price > 1000;
  return true;
}

export default function ShopPage() {
  const db = useFirestore();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>('Popular');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [compareList, setCompareList] = useState<ShopProduct[]>([]);
  const [heroCarouselApi, setHeroCarouselApi] = useState<CarouselApi>();
  const [heroCarouselIndex, setHeroCarouselIndex] = useState(0);
  const { addItem } = useCart();

  const productsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  const { data: products, isLoading, error } = useCollection(productsRef);

  useEffect(() => {
    const categoryFromParams = searchParams.get('category');
    if (categoryFromParams && CATEGORIES.some((category) => category.id === categoryFromParams)) {
      setSelectedCategory(categoryFromParams);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const allProducts = useMemo(() => {
    return ((products as ShopProduct[] | undefined) || []).filter((product) => product.isActive !== false);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in-stock' && product.inventory > 0) ||
        (stockFilter === 'low-stock' && product.inventory > 0 && product.inventory < 20);
      const matchesPrice = matchesPriceBand(product.salePrice, priceBand);
      return matchesCategory && matchesStock && matchesPrice;
    });

    if (debouncedSearchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['name', 'sku', 'specs', 'categoryId'],
        threshold: 0.32,
      });
      result = fuse.search(debouncedSearchQuery.trim()).map((entry) => entry.item);
    }

    const sorted = [...result];
    if (sortBy === 'Price: Low to High') sorted.sort((a, b) => a.salePrice - b.salePrice);
    if (sortBy === 'Price: High to Low') sorted.sort((a, b) => b.salePrice - a.salePrice);
    if (sortBy === 'Inventory') sorted.sort((a, b) => b.inventory - a.inventory);
    if (sortBy === 'Newest') {
      sorted.sort((a, b) => {
        return toSeconds(b.createdAt) - toSeconds(a.createdAt);
      });
    }
    if (sortBy === 'Popular') {
      sorted.sort((a, b) => {
        const aRating = getRating(a);
        const bRating = getRating(b);
        if (aRating === null && bRating === null) return 0;
        if (aRating === null) return 1;
        if (bRating === null) return -1;
        const aScore = aRating * Math.max(getReviewCount(a), 1);
        const bScore = bRating * Math.max(getReviewCount(b), 1);
        return bScore - aScore;
      });
    }

    return sorted;
  }, [allProducts, selectedCategory, stockFilter, priceBand, debouncedSearchQuery, sortBy]);

  const categoryCounts = useMemo(() => {
    return CATEGORIES.reduce<Record<string, number>>((acc, category) => {
      if (category.id === 'all') {
        acc[category.id] = allProducts.length;
        return acc;
      }
      acc[category.id] = allProducts.filter((product) => product.categoryId === category.id).length;
      return acc;
    }, {});
  }, [allProducts]);

  const heroCarouselItems = useMemo(() => {
    if (allProducts.length === 0) return [];
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(shuffled.length, 8));
  }, [allProducts]);

  const pricingSummary = useMemo(() => {
    if (filteredProducts.length === 0) return { min: 0, max: 0, avg: 0 };
    const prices = filteredProducts.map((product) => product.salePrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    return { min, max, avg };
  }, [filteredProducts]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (selectedCategory !== 'all') total += 1;
    if (priceBand !== 'all') total += 1;
    if (stockFilter !== 'all') total += 1;
    return total;
  }, [selectedCategory, priceBand, stockFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategory('all');
    setPriceBand('all');
    setStockFilter('all');
    setSortBy('Popular');
  };

  const toggleCompare = (product: ShopProduct) => {
    setCompareList((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) return prev.filter((item) => item.id !== product.id);
      if (prev.length >= 3) return prev;
      return [...prev, product];
    });
  };

  useEffect(() => {
    if (!heroCarouselApi) return;
    const onSelect = () => {
      setHeroCarouselIndex(heroCarouselApi.selectedScrollSnap());
    };
    onSelect();
    heroCarouselApi.on('select', onSelect);
    heroCarouselApi.on('reInit', onSelect);
    return () => {
      heroCarouselApi.off('select', onSelect);
      heroCarouselApi.off('reInit', onSelect);
    };
  }, [heroCarouselApi]);

  useEffect(() => {
    if (!heroCarouselApi || heroCarouselItems.length <= 1) return;
    const autoplay = window.setInterval(() => {
      heroCarouselApi.scrollNext();
    }, 4200);
    return () => window.clearInterval(autoplay);
  }, [heroCarouselApi, heroCarouselItems.length]);

  const getProductImage = (product: ShopProduct) => {
    if (!product.images?.length) return '/images/placeholder-part.svg';
    if (typeof product.images[0] === 'string') {
      return product.images[0] || '/images/placeholder-part.svg';
    }
    return product.images[0]?.urls?.product || product.images[0]?.urls?.thumb || '/images/placeholder-part.svg';
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-900 selection:bg-blue-500/20">
      <LandingNav />

      <section className="border-b border-slate-200 bg-white pt-0">
        <BackToHomeBar className="pt-1 md:pt-2 pb-2" />
        <div className="container mx-auto px-4 pb-6 md:pb-8">
          <div className="mb-4 hidden flex-wrap items-center gap-2 md:flex">
            <Badge className="border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2F5FA7]">
              <Store className="mr-1.5 h-3 w-3" />
              MechHub Registry
            </Badge>
            <Badge className="border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              <CheckCircle2 className="mr-1.5 h-3 w-3" />
              Verified Supply
            </Badge>
          </div>

          {heroCarouselItems.length > 0 ? (
            <div className="relative hidden overflow-hidden rounded-[30px] border border-blue-200/60 bg-gradient-to-r from-[#123A74] via-[#1E4B90] to-[#2F5FA7] shadow-[0_24px_60px_rgba(24,58,110,0.30)] md:block">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[40%] bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_55%)]" />
              <Carousel
                setApi={setHeroCarouselApi}
                opts={{ align: 'start', loop: true }}
                className="w-full"
              >
                <CarouselContent className="-ml-0">
                  {heroCarouselItems.map((product) => (
                    <CarouselItem key={product.id} className="pl-0">
                      <div className="grid min-h-[240px] items-center gap-6 p-6 md:min-h-[290px] md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-14">
                        <div className="space-y-3 text-white">
                          <p className="inline-flex rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-50">
                            Random Pick In Shop
                          </p>
                          <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
                            {product.name}
                          </h1>
                          <div className="max-w-xl rounded-2xl border border-blue-200/55 bg-[#0B2F63]/70 px-4 py-3 shadow-[0_10px_30px_rgba(5,20,45,0.35)] backdrop-blur-sm">
                            <div className="mb-2 h-1.5 w-16 rounded-full bg-[#F4B400]" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
                              Specification
                            </p>
                            <p className="mt-1 text-lg font-black text-white">
                              {product.specs || product.sku}
                            </p>
                          </div>
                          <Link href={`/shop/${product.id}`}>
                            <Button className="mt-2 h-11 rounded-full bg-[#F4B400] px-6 text-sm font-black text-[#1A2B0F] hover:bg-[#F9C83A]">
                              View Product
                            </Button>
                          </Link>
                        </div>

                        <div className="relative mx-auto h-[180px] w-full max-w-[380px] overflow-hidden md:h-[230px]">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            fill
                            className="object-contain p-2 md:p-4 drop-shadow-[0_18px_28px_rgba(0,0,0,0.25)]"
                            sizes="(max-width: 1024px) 80vw, 30vw"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {heroCarouselItems.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3 top-1/2 h-10 w-10 -translate-y-1/2 border-white/35 bg-white/12 text-white hover:bg-white/20 disabled:opacity-35 md:left-5" />
                    <CarouselNext className="right-3 top-1/2 h-10 w-10 -translate-y-1/2 border-white/35 bg-white/12 text-white hover:bg-white/20 disabled:opacity-35 md:right-5" />
                  </>
                )}
              </Carousel>

              {heroCarouselItems.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                  {heroCarouselItems.map((item, index) => (
                    <button
                      key={`${item.id}-dot`}
                      onClick={() => heroCarouselApi?.scrollTo(index)}
                      aria-label={`Go to product ${index + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        heroCarouselIndex === index
                          ? 'w-8 bg-white'
                          : 'w-2.5 bg-blue-100/45 hover:bg-blue-100/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden rounded-[30px] border border-emerald-200 bg-gradient-to-r from-emerald-100 to-green-100 p-6 md:block">
              <p className="text-sm font-semibold text-emerald-900">
                Loading featured shop picks...
              </p>
            </div>
          )}
        </div>
      </section>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="sticky top-[72px] z-30 mb-6 rounded-[28px] border border-slate-200 bg-white/95 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#2F5FA7]"
              />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 shrink-0 rounded-2xl border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-[#2F5FA7] hover:text-[#2F5FA7]"
                >
                  <Filter className="mr-1.5 h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-[#2F5FA7] px-1.5 py-0.5 text-[10px] font-black text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto rounded-t-3xl border-slate-200 bg-white p-0">
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
                  <SheetHeader className="space-y-1 text-left">
                    <SheetTitle className="text-lg font-black tracking-tight text-slate-900">
                      Filters
                    </SheetTitle>
                    <SheetDescription className="text-sm text-slate-500">
                      Sort by price or pick tags like Bearings and Linear Motion.
                    </SheetDescription>
                  </SheetHeader>
                </div>

                <div className="space-y-6 px-5 py-5">
                  <section>
                    <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Sort
                    </h3>
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#2F5FA7]"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </section>

                  <section>
                    <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                            selectedCategory === category.id
                              ? 'border-[#2F5FA7] bg-[#2F5FA7] text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-[#2F5FA7] hover:text-[#2F5FA7]'
                          }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Price
                    </h3>
                    <div className="space-y-2">
                      {PRICE_BANDS.map((band) => (
                        <button
                          key={band.id}
                          onClick={() => setPriceBand(band.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            priceBand === band.id
                              ? 'border-[#2F5FA7] bg-blue-50 text-[#2F5FA7]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {band.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Availability
                    </h3>
                    <div className="space-y-2">
                      {STOCK_FILTERS.map((stock) => (
                        <button
                          key={stock.id}
                          onClick={() => setStockFilter(stock.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            stockFilter === stock.id
                              ? 'border-[#2F5FA7] bg-blue-50 text-[#2F5FA7]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {stock.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="h-11 rounded-2xl border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </Button>
                    <SheetClose asChild>
                      <Button className="h-11 rounded-2xl bg-[#2F5FA7] text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-[#1F447D]">
                        View {filteredProducts.length}
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden flex-col gap-3 lg:flex xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by SKU, part name, spec or category"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#2F5FA7]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:w-auto xl:items-center">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])}
                className="h-12 min-w-[190px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#2F5FA7]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Sort: {option}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                      selectedCategory === category.id
                        ? 'border-[#2F5FA7] bg-[#2F5FA7] text-white shadow-lg shadow-blue-900/15'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#2F5FA7] hover:text-[#2F5FA7]'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-[168px] lg:block">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Browse Filters
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">
                  Narrow your search
                </h2>
              </div>
              <div className="rounded-xl bg-blue-50 p-2 text-[#2F5FA7]">
                <Filter className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-6 py-5">
              <section>
                <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Category
                </h3>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        selectedCategory === category.id
                          ? 'border-[#2F5FA7] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-800">{category.label}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm">
                        {categoryCounts[category.id] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Price
                </h3>
                <div className="space-y-2">
                  {PRICE_BANDS.map((band) => (
                    <button
                      key={band.id}
                      onClick={() => setPriceBand(band.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        priceBand === band.id
                          ? 'border-[#2F5FA7] bg-blue-50 text-[#2F5FA7]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Availability
                </h3>
                <div className="space-y-2">
                  {STOCK_FILTERS.map((stock) => (
                    <button
                      key={stock.id}
                      onClick={() => setStockFilter(stock.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        stockFilter === stock.id
                          ? 'border-[#2F5FA7] bg-blue-50 text-[#2F5FA7]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {stock.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Result Snapshot
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Min price</p>
                  <p className="mt-1 text-lg font-black text-slate-900">₹{pricingSummary.min}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Average</p>
                  <p className="mt-1 text-lg font-black text-slate-900">₹{pricingSummary.avg}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="mt-4 h-11 w-full rounded-2xl text-xs font-black uppercase tracking-[0.18em] text-slate-600 hover:bg-white"
              >
                Clear filters
              </Button>
            </div>
          </aside>

          <section className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[420px] rounded-[28px] border border-slate-200 bg-white animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-10 text-center">
                <p className="text-lg font-bold text-red-700">Unable to load products right now.</p>
                <p className="mt-2 text-sm text-red-600">
                  Please try again shortly. The catalogue connection returned an error.
                </p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isComparing={!!compareList.find((item) => item.id === product.id)}
                    toggleCompare={toggleCompare}
                    addItem={addItem}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <Package className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-900">
                  No components match these filters
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                  Try a wider price band, reset your category, or search with a SKU fragment like
                  `LM8UU`, `6204`, or `GT2`.
                </p>
                <Button
                  onClick={clearAllFilters}
                  className="mt-6 rounded-2xl bg-[#2F5FA7] px-6 text-sm font-bold hover:bg-[#1F447D]"
                >
                  Reset filters
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      {compareList.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl bg-slate-950 px-6 text-white shadow-2xl hover:bg-slate-900">
                <Scale className="mr-2 h-5 w-5 text-cyan-300" />
                Compare ({compareList.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl overflow-hidden border border-slate-200 bg-white p-0">
              <DialogHeader className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
                  <SlidersHorizontal className="h-5 w-5 text-[#2F5FA7]" />
                  Component Comparison
                </DialogTitle>
              </DialogHeader>

              <div className="overflow-x-auto px-6 py-6">
                <div className="grid min-w-[760px] grid-cols-[140px_repeat(3,1fr)] gap-4">
                  <div />
                  {compareList.map((product) => {
                    const image =
                      product.images?.length && typeof product.images[0] !== 'string'
                        ? product.images[0]?.urls?.thumb || product.images[0]?.urls?.product
                        : (product.images?.[0] as string | undefined);

                    return (
                      <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                        <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-2xl bg-white shadow-sm">
                          <Image
                            src={image || '/images/placeholder-part.svg'}
                            alt={product.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[#2F5FA7]">
                          {product.sku}
                        </p>
                        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm font-bold text-slate-900">
                          {product.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCompare(product)}
                          className="mt-3 h-8 rounded-full text-xs font-bold uppercase tracking-[0.18em] text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    );
                  })}

                  {[
                    {
                      label: 'Specs',
                      value: (product: ShopProduct) =>
                        product.specs || 'Standard industrial component',
                    },
                    {
                      label: 'Category',
                      value: (product: ShopProduct) => product.categoryId.replace('-', ' '),
                    },
                    {
                      label: 'Stock',
                      value: (product: ShopProduct) => `${product.inventory} units`,
                    },
                    {
                      label: 'Rating',
                      value: (product: ShopProduct) => {
                        const rating = getRating(product);
                        return rating === null ? 'No reviews yet' : `${rating} / 5`;
                      },
                    },
                    {
                      label: 'Price',
                      value: (product: ShopProduct) =>
                        `₹${product.salePrice.toLocaleString('en-IN')}`,
                    },
                    {
                      label: 'Discount',
                      value: (product: ShopProduct) => `${getDiscount(product)}%`,
                    },
                  ].map((row) => (
                    <Fragment key={row.label}>
                      <div key={`${row.label}-label`} className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        {row.label}
                      </div>
                      {compareList.map((product) => (
                        <div
                          key={`${row.label}-${product.id}`}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                        >
                          {row.value(product)}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Footer />
    </div>
  );
}
