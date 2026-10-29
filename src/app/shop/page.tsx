'use client';

import { Fragment, Suspense, useCallback, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { V2Shell } from '@/components/V2Shell';
import Fuse from 'fuse.js';
import { useCart } from '@/context/CartContext';
import { Reveal, Tag } from '@/components/home/primitives';
import {
  Search,
  Package,
  Filter,
  SlidersHorizontal,
  Store,
  Scale,
  X,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import { useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
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
import { landingFontVars } from '@/components/home/fonts';
import { cn } from '@/utils';
import { CurvedPartsFlow } from '@/components/CurvedPartsFlow';

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
  popularityScore?: number;
  popularity?: number;
  salesCount?: number;
  ordersCount?: number;
  views?: number;
  clicks?: number;
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

function getPopularityScore(product: ShopProduct): number {
  if (typeof product.popularityScore === 'number') return product.popularityScore;
  if (typeof product.popularity === 'number') return product.popularity;

  let score = 0;
  if (typeof product.salesCount === 'number') score += product.salesCount * 100;
  if (typeof product.ordersCount === 'number') score += product.ordersCount * 80;
  if (typeof product.views === 'number') score += product.views * 2;
  if (typeof product.clicks === 'number') score += product.clicks * 5;

  const rating = getRating(product);
  const reviewCount = getReviewCount(product);
  if (rating !== null) {
    score += rating * Math.max(reviewCount, 1) * 50;
  }

  const discount = getDiscount(product);
  const nameHash = product.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const deterministicFallback = (nameHash % 100) + discount * 10 + (product.inventory % 7) * 5;

  return score + deterministicFallback;
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

const TRUST_ITEMS = [
  'QC-Verified Components',
  'ISO 9001 Certified',
  'Same-Day Dispatch',
  'Bulk Pricing Available',
  'Industry-Grade Materials',
  'Precision Engineered',
  'GST Invoice Included',
  'Pan-India Delivery',
];

/**
 * Reads the URL query in its own Suspense boundary. useSearchParams() suspends during
 * static prerendering, so keeping it out of ShopPage lets the page shell prerender.
 */
function ShopSearchParams({ onChange }: { onChange: (params: ReadonlyURLSearchParams) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => onChange(searchParams), [searchParams, onChange]);
  return null;
}

export default function ShopPage() {
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>('Popular');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [compareList, setCompareList] = useState<ShopProduct[]>([]);
  const { addItem } = useCart();

  const productsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  const { data: products, isLoading, error } = useCollection(productsRef);

  // Applies ?category / ?q / ?sort from the URL (see ShopSearchParams below).
  const applySearchParams = useCallback((searchParams: ReadonlyURLSearchParams) => {
    const categoryFromParams = searchParams.get('category');
    const queryFromParams = searchParams.get('q');
    const sortFromParams = searchParams.get('sort') || searchParams.get('sortBy');

    if (categoryFromParams && CATEGORIES.some((category) => category.id === categoryFromParams)) {
      setSelectedCategory(categoryFromParams);
    } else {
      setSelectedCategory('all');
    }

    if (queryFromParams) {
      setSearchQuery(queryFromParams);
      setDebouncedSearchQuery(queryFromParams);
    }

    if (sortFromParams) {
      const matched = SORT_OPTIONS.find(
        (opt) =>
          opt.toLowerCase() === sortFromParams.toLowerCase() ||
          opt.toLowerCase().replace(/[^a-z0-9]/g, '') === sortFromParams.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (matched) {
        setSortBy(matched);
      }
    }
  }, []);

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
        const scoreA = getPopularityScore(a);
        const scoreB = getPopularityScore(b);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.name.localeCompare(b.name);
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

  return (
    <V2Shell noFooter>
      <Suspense fallback={null}>
        <ShopSearchParams onChange={applySearchParams} />
      </Suspense>
      {/* Hero */}
      <section className="border-b border-lp-border bg-lp-bg">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20 text-center">
          <Reveal>
            <p className="lp-label-mono text-lp-primary mb-4">MechHub Component Registry</p>
          </Reveal>
          <Reveal>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-lp-fg leading-[1.1]">
              Components for every <span className="font-lp-serif italic text-lp-primary">build.</span>
            </h1>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-lp-muted-fg leading-relaxed">
              Precision-engineered industrial parts. QC-verified, competitively priced, and ready to dispatch within 24 hours.
            </p>
          </Reveal>

          {/* Stats row */}
          <Reveal>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-medium text-lp-fg tracking-tight">{allProducts.length}+</p>
                <p className="lp-label-mono text-lp-muted-fg mt-1">Components</p>
              </div>
              <div className="w-px h-8 bg-lp-border hidden sm:block" />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-medium text-lp-fg tracking-tight">{CATEGORIES.length - 1}</p>
                <p className="lp-label-mono text-lp-muted-fg mt-1">Categories</p>
              </div>
              <div className="w-px h-8 bg-lp-border hidden sm:block" />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-medium text-lp-fg tracking-tight">24hr</p>
                <p className="lp-label-mono text-lp-muted-fg mt-1">Dispatch</p>
              </div>
              <div className="w-px h-8 bg-lp-border hidden sm:block" />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-medium text-lp-fg tracking-tight">ISO</p>
                <p className="lp-label-mono text-lp-muted-fg mt-1">Certified</p>
              </div>
            </div>
          </Reveal>

        </div>

        {/* Trust marquee */}
        <div className="border-t border-lp-border overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap py-3">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
              <span key={i} className="mx-6 lp-label-mono text-lp-muted-fg/60 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-lp-primary/40" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Search + Categories + Sort */}
        <div className="sticky top-[72px] z-30 mb-6 rounded-sm border border-lp-border bg-lp-card/95 p-3 backdrop-blur">
          {/* Mobile */}
          <form onSubmit={(e) => { e.preventDefault(); setDebouncedSearchQuery(searchQuery.trim()); }} className="flex items-center gap-2 lg:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lp-muted-fg/40" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                className="h-10 w-full rounded-sm border border-lp-border bg-lp-bg pl-10 pr-3 text-sm text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:outline-none focus:ring-1 focus:ring-lp-primary/10"
              />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <button className="h-10 shrink-0 rounded-sm border border-lp-border bg-lp-bg px-3 lp-label-mono text-lp-fg hover:border-lp-primary transition-colors flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 rounded-sm bg-lp-primary px-1.5 py-0.5 text-[9px] font-bold text-lp-primary-fg">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>

              <SheetContent side="bottom" className={cn("lp-root max-h-[82vh] overflow-y-auto rounded-t-sm border-lp-border bg-lp-bg p-0", landingFontVars)}>
                <div className="sticky top-0 z-10 border-b border-lp-border bg-lp-bg/95 px-5 py-4 backdrop-blur">
                  <SheetHeader className="space-y-1 text-left">
                    <SheetTitle className="text-lg font-medium tracking-tight text-lp-fg">
                      Filters
                    </SheetTitle>
                    <SheetDescription className="text-sm text-lp-muted-fg">
                      Sort by price or pick categories.
                    </SheetDescription>
                  </SheetHeader>
                </div>

                <div className="space-y-6 px-5 py-5">
                  <section>
                    <h3 className="lp-label-mono text-lp-muted-fg mb-3">Sort</h3>
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])
                      }
                      className="h-10 w-full rounded-sm border border-lp-border bg-lp-card px-3 text-sm text-lp-fg outline-none focus:border-lp-primary"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </section>

                  <section>
                    <h3 className="lp-label-mono text-lp-muted-fg mb-3">Category</h3>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`rounded-sm border px-3 py-2 lp-label-mono transition ${selectedCategory === category.id
                            ? 'border-lp-primary bg-lp-primary text-lp-primary-fg'
                            : 'border-lp-border bg-lp-card text-lp-fg hover:border-lp-primary'
                            }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="lp-label-mono text-lp-muted-fg mb-3">Price</h3>
                    <div className="space-y-2">
                      {PRICE_BANDS.map((band) => (
                        <button
                          key={band.id}
                          onClick={() => setPriceBand(band.id)}
                          className={`w-full rounded-sm border px-4 py-2.5 text-left text-sm transition ${priceBand === band.id
                            ? 'border-lp-primary bg-lp-primary/5 text-lp-primary'
                            : 'border-lp-border text-lp-fg hover:border-lp-primary/40'
                            }`}
                        >
                          {band.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="lp-label-mono text-lp-muted-fg mb-3">Availability</h3>
                    <div className="space-y-2">
                      {STOCK_FILTERS.map((stock) => (
                        <button
                          key={stock.id}
                          onClick={() => setStockFilter(stock.id)}
                          className={`w-full rounded-sm border px-4 py-2.5 text-left text-sm transition ${stockFilter === stock.id
                            ? 'border-lp-primary bg-lp-primary/5 text-lp-primary'
                            : 'border-lp-border text-lp-fg hover:border-lp-primary/40'
                            }`}
                        >
                          {stock.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={clearAllFilters}
                      className="h-10 rounded-sm border border-lp-border lp-label-mono text-lp-fg hover:bg-lp-accent transition-colors"
                    >
                      Clear
                    </button>
                    <SheetClose asChild>
                      <button className="h-10 rounded-sm bg-lp-primary text-lp-primary-fg lp-label-mono hover:bg-lp-primary/90 transition-colors">
                        View {filteredProducts.length}
                      </button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </form>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <form onSubmit={(e) => { e.preventDefault(); setDebouncedSearchQuery(searchQuery.trim()); }} className="relative w-72 xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lp-muted-fg/40" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by SKU, part name, spec"
                className="h-10 w-full rounded-sm border border-lp-border bg-lp-bg pl-10 pr-3 text-sm text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:outline-none focus:ring-1 focus:ring-lp-primary/10"
              />
            </form>

            <div className="h-6 w-px bg-lp-border" />

            <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`shrink-0 rounded-sm border px-3 py-1.5 lp-label-mono transition ${selectedCategory === category.id
                    ? 'border-lp-primary bg-lp-primary text-lp-primary-fg'
                    : 'border-lp-border text-lp-muted-fg hover:border-lp-primary hover:text-lp-fg'
                    }`}
                >
                  {category.label}
                  <span className="ml-1.5 text-[9px] opacity-60">{categoryCounts[category.id] || 0}</span>
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-lp-border" />

            <div className="flex items-center gap-2">
              {priceBand !== 'all' && (
                <button
                  onClick={() => setPriceBand('all')}
                  className="flex items-center gap-1 rounded-sm border border-lp-primary/20 bg-lp-primary/5 px-2.5 py-1.5 lp-label-mono text-lp-primary"
                >
                  {PRICE_BANDS.find(b => b.id === priceBand)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}
              {stockFilter !== 'all' && (
                <button
                  onClick={() => setStockFilter('all')}
                  className="flex items-center gap-1 rounded-sm border border-lp-primary/20 bg-lp-primary/5 px-2.5 py-1.5 lp-label-mono text-lp-primary"
                >
                  {STOCK_FILTERS.find(s => s.id === stockFilter)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])}
                className="h-10 rounded-sm border border-lp-border bg-lp-bg px-3 pr-8 text-sm text-lp-fg outline-none focus:border-lp-primary appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Sort: {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <span className="lp-label-mono text-lp-muted-fg">
              {filteredProducts.length} results
            </span>
            <button
              onClick={clearAllFilters}
              className="lp-label-mono text-lp-primary hover:underline flex items-center gap-1"
            >
              Clear all <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Product Grid */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[380px] rounded-sm border border-lp-border bg-lp-card animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-sm border border-lp-destructive/20 bg-lp-destructive/5 px-6 py-10 text-center">
              <p className="text-lg font-medium text-lp-destructive">Unable to load products right now.</p>
              <p className="mt-2 text-sm text-lp-muted-fg">
                Please try again shortly. The catalogue connection returned an error.
              </p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="rounded-sm border border-dashed border-lp-border bg-lp-card px-6 py-16 text-center">
              <Package className="mx-auto h-10 w-10 text-lp-muted-fg/30" />
              <h3 className="mt-5 text-xl font-medium tracking-tight text-lp-fg">
                No components match these filters
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-lp-muted-fg leading-relaxed">
                Try a wider price band, reset your category, or search with a SKU fragment like
                LM8UU, 6204, or GT2.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-5 h-10 rounded-sm bg-lp-primary px-6 lp-label-mono text-lp-primary-fg hover:bg-lp-primary/90 transition-colors"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        {!isLoading && filteredProducts.length > 0 && (
          <section className="mt-16 mb-8 text-center">
            <div className="mx-auto max-w-2xl rounded-sm border border-lp-border bg-lp-card p-8 sm:p-12">
              <p className="lp-label-mono text-lp-primary mb-3">Need bulk quantities?</p>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-lp-fg">
                Get custom <span className="font-lp-serif italic">pricing</span>
              </h2>
              <p className="mt-3 text-sm text-lp-muted-fg max-w-md mx-auto">
                For orders above 100 units, contact our procurement team for volume discounts and custom delivery schedules.
              </p>
              <Link href="/quote/instant">
                <button className="mt-6 h-11 rounded-sm border border-lp-border bg-lp-bg px-6 lp-label-mono text-lp-fg hover:border-lp-primary hover:text-lp-primary transition-colors flex items-center gap-2 mx-auto">
                  Request a quote <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Compare dialog */}
      {compareList.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <button className="h-12 rounded-sm bg-lp-ink text-lp-ink-fg px-6 lp-label-mono shadow-2xl hover:bg-lp-ink/90 flex items-center gap-2 transition-colors">
                <Scale className="h-4 w-4 text-lp-primary" />
                Compare ({compareList.length})
              </button>
            </DialogTrigger>
            <DialogContent className={cn("lp-root max-w-5xl overflow-hidden border border-lp-border bg-lp-bg p-0", landingFontVars)}>
              <DialogHeader className="border-b border-lp-border px-6 py-5">
                <DialogTitle className="flex items-center gap-2 text-lg font-medium tracking-tight text-lp-fg">
                  <SlidersHorizontal className="h-4 w-4 text-lp-primary" />
                  Component <span className="font-lp-serif italic">comparison</span>
                </DialogTitle>
              </DialogHeader>

              <div className="overflow-x-auto px-6 py-6">
                <div className="grid min-w-[760px] grid-cols-[140px_repeat(3,1fr)] gap-3">
                  <div />
                  {compareList.map((product) => {
                    const image =
                      product.images?.length && typeof product.images[0] !== 'string'
                        ? product.images[0]?.urls?.thumb || product.images[0]?.urls?.product
                        : (product.images?.[0] as string | undefined);

                    return (
                      <div key={product.id} className="rounded-sm border border-lp-border bg-lp-card p-4 text-center">
                        <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-sm bg-lp-accent border border-lp-border">
                          <Image
                            src={image || '/images/placeholder-part.svg'}
                            alt={product.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <p className="mt-2 lp-label-mono text-lp-primary">
                          {product.sku}
                        </p>
                        <p className="mt-1 line-clamp-2 min-h-[36px] text-sm font-medium text-lp-fg">
                          {product.name}
                        </p>
                        <button
                          onClick={() => toggleCompare(product)}
                          className="mt-2 h-7 rounded-sm lp-label-mono text-lp-destructive hover:bg-lp-destructive/5 px-2 flex items-center gap-1 mx-auto transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </button>
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
                      <div key={`${row.label}-label`} className="rounded-sm bg-lp-accent px-3 py-2.5 lp-label-mono text-lp-muted-fg">
                        {row.label}
                      </div>
                      {compareList.map((product) => (
                        <div
                          key={`${row.label}-${product.id}`}
                          className="rounded-sm border border-lp-border bg-lp-card px-3 py-2.5 text-sm text-lp-fg"
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
    </V2Shell>
  );
}
