'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { V2Shell } from '@/components/V2Shell';
import { useCart } from '@/context/CartContext';
import {
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Package,
  ArrowLeft,
  CheckCircle2,
  Info,
  Warehouse,
  Home,
  ChevronLeft,
  ChevronRight,
  Star,
  StarHalf,
  Plus,
  Minus,
  Zap,
  Check,
  Download,
  FileText,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Reveal } from '@/components/home/primitives';

interface Review {
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface FAQ {
  q: string;
  a: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const db = useFirestore();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'products', id);
  }, [db, id]);

  const { data: product, isLoading, error } = useDoc(productRef);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPast(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading || !productRef) {
    return (
      <div className="lp-root min-h-screen bg-lp-bg text-lp-fg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lp-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="lp-root min-h-screen bg-lp-bg text-lp-fg flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-sm bg-lp-accent flex items-center justify-center mb-5 border border-lp-border">
          <Package className="w-7 h-7 text-lp-muted-fg/40" />
        </div>
        <h1 className="text-xl font-medium mb-2 text-lp-fg">Product Not Found</h1>
        <p className="text-sm text-lp-muted-fg mb-6 max-w-md text-center">
          The component you are looking for does not exist in our registry or has been removed.
        </p>
        <Link href="/shop">
          <button className="h-10 rounded-sm border border-lp-border px-6 lp-label-mono text-lp-fg hover:border-lp-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to catalogue
          </button>
        </Link>
      </div>
    );
  }

  const reviews = (product.reviews as Review[]) || [];
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
      : 4.5;

  const placeholders = [
    'https://images.unsplash.com/photo-1594819047050-99def0f34101?q=80&w=800',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800',
  ];

  const productImages =
    product.images?.length > 0
      ? product.images.map((img: any) => (typeof img === 'string' ? img : img.urls.product))
      : placeholders;

  const thumbImages =
    product.images?.length > 0
      ? product.images.map((img: any) => (typeof img === 'string' ? img : img.urls.thumb))
      : placeholders;

  const discount =
    product.basePrice > product.salePrice
      ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
      : 0;

  return (
    <V2Shell noFooter>
      {/* Breadcrumbs */}
      <div className="border-b border-lp-border bg-lp-bg py-3">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-2 lp-label-mono text-lp-muted-fg">
            <Link href="/" className="hover:text-lp-primary transition-colors flex items-center gap-1">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-lp-primary transition-colors">
              Shop
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/shop?category=${product.categoryId}`}
              className="hover:text-lp-primary transition-colors capitalize"
            >
              {product.categoryId.replace('-', ' ')}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-lp-fg truncate max-w-[150px]">{product.name}</span>
          </div>
        </div>
      </div>

      <PrintableDatasheet product={product} productImages={productImages} />

      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-7 space-y-3 lg:sticky lg:top-24">
            <div className="aspect-square bg-lp-accent rounded-sm border border-lp-border flex items-center justify-center relative overflow-hidden group">
              <Image
                src={productImages[activeImage]}
                alt={product.name}
                fill
                priority
                className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="lp-label-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> QC Verified
                </span>
                {discount > 0 && (
                  <span className="lp-label-mono bg-lp-primary/10 text-lp-primary border border-lp-primary/20 px-2.5 py-1 rounded-sm">
                    -{discount}% off
                  </span>
                )}
              </div>

              {/* Nav arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImage((prev) => (prev - 1 + productImages.length) % productImages.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-sm bg-lp-bg/90 border border-lp-border flex items-center justify-center text-lp-muted-fg hover:text-lp-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImage((prev) => (prev + 1) % productImages.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-sm bg-lp-bg/90 border border-lp-border flex items-center justify-center text-lp-muted-fg hover:text-lp-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1 h-16 md:h-20">
              {productImages.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-14 h-14 md:w-18 md:h-18 rounded-sm overflow-hidden border transition-all shrink-0 ${activeImage === idx
                    ? 'border-lp-primary'
                    : 'border-lp-border hover:border-lp-primary/40 opacity-60 hover:opacity-100'
                    }`}
                >
                  <Image
                    src={thumbImages[idx]}
                    alt={`${product.name} thumb ${idx}`}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="lp-label-mono text-lp-primary">
                  SKU: {product.sku}
                </span>
                {product.inventory < 50 && product.inventory > 0 && (
                  <span className="lp-label-mono text-amber-600">Low stock</span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-medium text-lp-fg leading-tight tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.floor(avgRating) ? 'fill-current' : 'text-lp-border'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-lp-fg">{avgRating}</span>
                <span className="text-lp-border">|</span>
                <span className="text-xs text-lp-muted-fg">
                  {reviews.length || 124} reviews
                </span>
              </div>

              {product.description && (
                <p className="text-sm text-lp-muted-fg leading-relaxed max-w-lg">
                  {product.description}
                </p>
              )}

              {/* Specs row */}
              <div className="pt-4 border-t border-lp-border grid grid-cols-3 gap-4">
                <div>
                  <p className="lp-label-mono text-lp-muted-fg">Tolerance</p>
                  <p className="text-sm font-medium text-lp-fg font-lp-mono mt-1">
                    {product.technicalSpecs?.Tolerance || '±0.05mm'}
                  </p>
                </div>
                <div>
                  <p className="lp-label-mono text-lp-muted-fg">Material</p>
                  <p className="text-sm font-medium text-lp-fg font-lp-mono mt-1 truncate">
                    {product.technicalSpecs?.Material || 'POM / Al'}
                  </p>
                </div>
                <div>
                  <p className="lp-label-mono text-lp-muted-fg">Inventory</p>
                  <p className={`text-sm font-medium font-lp-mono mt-1 ${product.inventory > 0 ? 'text-emerald-600' : 'text-lp-destructive'}`}>
                    {product.inventory} units
                  </p>
                </div>
              </div>
            </section>

            {/* Pricing block */}
            <section className="p-5 md:p-6 rounded-sm bg-lp-card border border-lp-border">
              <div className="space-y-5">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-medium text-lp-fg tracking-tight">
                      ₹{(product.salePrice * quantity).toLocaleString()}
                    </span>
                    {product.basePrice > product.salePrice && (
                      <span className="text-base text-lp-muted-fg line-through">
                        ₹{(product.basePrice * quantity).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="lp-label-mono text-lp-muted-fg/60 mt-1">
                    Excl. GST 18%
                  </p>
                  {product.basePrice > product.salePrice && (
                    <p className="lp-label-mono text-emerald-600 mt-1">
                      Save ₹{((product.basePrice - product.salePrice) * quantity).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Quantity + CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center bg-lp-accent border border-lp-border rounded-sm overflow-hidden h-10 shrink-0">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-full flex items-center justify-center hover:bg-lp-border/50 text-lp-muted-fg transition-colors border-r border-lp-border"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center text-sm font-medium text-lp-fg font-lp-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= product.inventory}
                      className={`w-10 h-full flex items-center justify-center hover:bg-lp-border/50 text-lp-muted-fg transition-colors border-l border-lp-border ${quantity >= product.inventory ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    className="flex-1 h-11 bg-lp-primary text-lp-primary-fg rounded-sm lp-label-mono hover:bg-lp-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={product.inventory <= 0}
                    onClick={() =>
                      addItem({
                        id: product.id,
                        name: product.name,
                        salePrice: product.salePrice,
                        basePrice: product.basePrice || product.salePrice,
                        sku: product.sku,
                        image: productImages[0],
                        inventory: product.inventory,
                        quantity: quantity,
                      })
                    }
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {product.inventory > 0 ? 'Add to procurement' : 'Out of stock'}
                  </button>
                </div>

                <button
                  className="w-full h-11 bg-lp-ink text-lp-ink-fg rounded-sm lp-label-mono hover:bg-lp-ink/90 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={product.inventory <= 0}
                  onClick={() => {
                    addItem({
                      id: product.id,
                      name: product.name,
                      salePrice: product.salePrice,
                      basePrice: product.basePrice || product.salePrice,
                      sku: product.sku,
                      image: productImages[0],
                      inventory: product.inventory,
                      quantity: quantity,
                    });
                    router.push('/checkout');
                  }}
                >
                  Commence strategic buy
                </button>
              </div>
            </section>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, title: 'Express Logistics', desc: 'Dispatch in 24h' },
                { icon: ShieldCheck, title: 'Auth Guarantee', desc: '100% Genuine' },
                { icon: RotateCcw, title: '7-Day Return', desc: 'Quality Assurance' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-sm bg-lp-card border border-lp-border flex flex-col gap-2"
                >
                  <item.icon className="w-4 h-4 text-lp-primary" />
                  <div>
                    <p className="lp-label-mono text-lp-fg">{item.title}</p>
                    <p className="text-[10px] text-lp-muted-fg mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-lp-fg flex items-center gap-2">
                <Zap className="w-4 h-4 text-lp-primary" /> Key features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {((product.features as string[]) || ['Precision Engineered', 'Industrial Grade', 'QC Certified', 'Standard Dimensions']).map((f: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 rounded-sm bg-lp-card border border-lp-border"
                  >
                    <Check className="w-3 h-3 text-lp-primary shrink-0" />
                    <span className="text-xs text-lp-muted-fg">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lower content */}
        <div className="mt-16 space-y-16">
          {/* Technical Specifications */}
          <section id="specifications" className="scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-medium text-lp-fg">
                  Technical <span className="font-lp-serif italic text-lp-primary">specifications</span>
                </h2>
                <p className="text-sm text-lp-muted-fg mt-1">
                  Precise engineering data for industrial integration.
                </p>
              </div>
              <button
                className="h-9 rounded-sm border border-lp-border px-4 lp-label-mono text-lp-fg hover:border-lp-primary transition-colors flex items-center gap-2"
                onClick={() => window.print()}
              >
                <Download className="w-3.5 h-3.5" /> Download datasheet
              </button>
            </div>

            <div className="rounded-sm border border-lp-border overflow-hidden bg-lp-card">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-lp-border">
                <div className="divide-y divide-lp-border">
                  {Object.entries(product.technicalSpecs || {})
                    .slice(0, Math.ceil(Object.entries(product.technicalSpecs || {}).length / 2))
                    .map(([label, value]) => (
                      <div key={label} className="grid grid-cols-2 p-4 hover:bg-lp-accent/50 transition-colors gap-2">
                        <span className="lp-label-mono text-lp-muted-fg">{label}</span>
                        <span className="text-sm text-lp-fg font-lp-mono">{value as string}</span>
                      </div>
                    ))}
                  {!product.technicalSpecs && (
                    <div className="grid grid-cols-2 p-4 gap-2">
                      <span className="lp-label-mono text-lp-muted-fg">Part code</span>
                      <span className="text-sm text-lp-fg font-lp-mono">{product.sku}</span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-lp-border">
                  {Object.entries(product.technicalSpecs || {})
                    .slice(Math.ceil(Object.entries(product.technicalSpecs || {}).length / 2))
                    .map(([label, value]) => (
                      <div key={label} className="grid grid-cols-2 p-4 hover:bg-lp-accent/50 transition-colors gap-2">
                        <span className="lp-label-mono text-lp-muted-fg">{label}</span>
                        <span className="text-sm text-lp-fg font-lp-mono">{value as string}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* Applications & Compatibility */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-medium text-lp-fg">
                  Ideal <span className="font-lp-serif italic text-lp-primary">applications</span>
                </h3>
                <p className="text-sm text-lp-muted-fg mt-1">
                  Where this component excels in efficiency and reliability.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {((product.applications as string[]) || ['3D Printing', 'CNC Machinery', 'Robotics', 'Automation']).map((app: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-3 rounded-sm bg-lp-card border border-lp-border hover:border-lp-primary/40 transition-colors"
                  >
                    <Package className="w-4 h-4 text-lp-muted-fg" />
                    <span className="text-sm text-lp-fg">{app}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-medium text-lp-fg">
                  System <span className="font-lp-serif italic text-lp-primary">compatibility</span>
                </h3>
                <p className="text-sm text-lp-muted-fg mt-1">
                  Matching industrial standards and hardware ecosystems.
                </p>
              </div>
              <div className="space-y-2">
                {((product.compatibility as string[]) || ['Standard Shaft Assemblies', 'Standard Mounting Brackets']).map((comp: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-sm border border-lp-border bg-lp-card"
                  >
                    <span className="text-sm text-lp-fg">{comp}</span>
                    <span className="lp-label-mono text-emerald-600">Verified</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* FAQ */}
          <section id="faq" className="max-w-3xl mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium text-lp-fg">
                Parts procurement <span className="font-lp-serif italic text-lp-primary">FAQ</span>
              </h2>
              <p className="text-sm text-lp-muted-fg mt-1">
                Technical answers for procurement officers and engineers.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {((product.faqs as FAQ[]) || [
                { q: 'What is the dispatch time?', a: 'Standard dispatch time is within 24-48 business hours from order verification for in-stock items.' },
                { q: 'Do you provide bulk discounts?', a: 'Yes, for quantities above 100 units, please contact our relationship manager for a commercial quote.' },
                { q: 'Is this component compatible with SolidWorks/Fusion 360?', a: 'Yes, our components follow standard industrial sizing. You can download the datasheet for precise dimensions.' },
                { q: 'What material grades are used?', a: 'We specify the material grade in the Specifications section above. All materials are source-verified.' },
                { q: 'Can I request custom modifications?', a: 'Custom modifications are available through our Partner Fabrication Program for volume orders.' },
                { q: 'What is the return policy for precision parts?', a: 'We accept returns within 7 days for unopened items in original packaging.' },
                { q: 'Do you ship internationally?', a: 'Currently, we provide end-to-end logistics within the region. Contact our logistics desk for international inquiries.' },
              ]).map((faq: FAQ, idx: number) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border border-lp-border bg-lp-card rounded-sm px-5"
                >
                  <AccordionTrigger className="text-sm font-medium text-lp-fg hover:text-lp-primary hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-lp-muted-fg leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Reviews */}
          <section id="reviews" className="rounded-sm border border-lp-border bg-lp-card p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-3">
                <h2 className="text-2xl font-medium text-lp-fg">
                  Customer <span className="font-lp-serif italic text-lp-primary">intelligence</span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-medium text-lp-fg tracking-tight">{avgRating}</span>
                  <div>
                    <div className="flex items-center text-amber-500 mb-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(avgRating) ? 'fill-current' : 'text-lp-border'}`}
                        />
                      ))}
                    </div>
                    <p className="lp-label-mono text-lp-muted-fg">
                      {reviews.length || 124} verified reviews
                    </p>
                  </div>
                </div>
              </div>
              <button className="h-10 rounded-sm bg-lp-primary text-lp-primary-fg px-6 lp-label-mono hover:bg-lp-primary/90 transition-colors">
                Submit field report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {((product.reviews as Review[]) || []).map((review: Review, idx: number) => (
                <div
                  key={idx}
                  className="p-5 rounded-sm bg-lp-bg border border-lp-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-sm bg-lp-accent border border-lp-border flex items-center justify-center lp-label-mono text-lp-primary">
                        {review.userName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-lp-fg">
                          {review.userName || 'Verified User'}
                        </p>
                        <div className="flex items-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 ${i < (review.rating || 5) ? 'fill-current' : 'text-lp-border'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="lp-label-mono text-lp-muted-fg/60">
                      {review.createdAt || 'Recent'}
                    </span>
                  </div>
                  <p className="text-sm text-lp-muted-fg leading-relaxed italic">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Sticky bottom bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-lp-ink/95 backdrop-blur-xl border-t border-lp-border/10 transition-all duration-500 transform ${scrolledPast ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-sm bg-lp-ink/60 border border-lp-border/10 overflow-hidden hidden sm:flex items-center justify-center shrink-0">
              <img src={productImages[0]} className="w-full h-full object-cover opacity-50" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-lp-ink-fg truncate">{product.name}</h4>
              <p className="lp-label-mono text-lp-primary/70">{product.sku}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-lg font-medium text-lp-ink-fg tracking-tight">
                ₹{product.salePrice.toLocaleString()}
              </span>
              <span className="lp-label-mono text-emerald-400">
                {product.inventory} in stock
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="h-9 px-4 rounded-sm border border-lp-border/20 bg-lp-ink-fg/5 text-lp-ink-fg lp-label-mono hover:bg-lp-ink-fg/10 transition-colors hidden sm:flex items-center gap-1.5"
                onClick={() =>
                  addItem({
                    id: product.id,
                    name: product.name,
                    salePrice: product.salePrice,
                    basePrice: product.basePrice || product.salePrice,
                    sku: product.sku,
                    image: productImages[0],
                    inventory: product.inventory,
                    quantity: 1,
                  })
                }
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <button
                className="h-9 px-5 rounded-sm bg-lp-primary text-lp-primary-fg lp-label-mono hover:bg-lp-primary/90 transition-colors"
                onClick={() => {
                  addItem({
                    id: product.id,
                    name: product.name,
                    salePrice: product.salePrice,
                    basePrice: product.basePrice || product.salePrice,
                    sku: product.sku,
                    image: productImages[0],
                    inventory: product.inventory,
                    quantity: 1,
                  });
                  router.push('/checkout');
                }}
              >
                Buy now
              </button>
            </div>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}

function PrintableDatasheet({ product, productImages }: { product: any; productImages: string[] }) {
  return (
    <div className="print-only bg-white text-black p-12 font-sans min-h-[297mm] w-[210mm] mx-auto hidden print:block">
      <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Cpu className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">MECHHUB</span>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500">
            PRECISION INDUSTRIAL MARKETPLACE
          </p>
        </div>
        <div className="text-right space-y-1">
          <h1 className="text-xl font-black uppercase">Technical Datasheet</h1>
          <p className="text-[10px] font-medium text-zinc-400">
            Generated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-[10px] font-bold text-zinc-800 tracking-widest">
            REF: {product.sku || 'MH-AUTO-GEN'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12 mb-12">
        <div className="col-span-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
          <div className="flex gap-4">
            <div className="px-3 py-1 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-wider border border-zinc-200">
              Category: {product.categoryId?.replace('-', ' ')}
            </div>
            <div className="px-3 py-1 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-wider border border-zinc-200">
              Origin: Verified MechMaster Fabricated
            </div>
          </div>
          <p className="text-sm leading-relaxed text-zinc-600">
            {product.description || 'High-precision industrial component manufactured to strict ISO standards.'}
          </p>
        </div>
        <div className="col-span-4 aspect-square bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-center p-4 relative overflow-hidden">
          <Image
            src={productImages[0] || 'https://images.unsplash.com/photo-1594819047050-99def0f34101?q=80&w=800'}
            alt={product.name}
            fill
            className="object-contain grayscale"
            sizes="200px"
          />
        </div>
      </div>

      <div className="space-y-4 mb-12">
        <h3 className="text-sm font-black uppercase tracking-widest border-l-4 border-black pl-3 py-1 bg-zinc-50">
          Technical Specifications
        </h3>
        <div className="grid grid-cols-1 border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-200">
          {Object.entries(product.technicalSpecs || {}).map(([label, value]) => (
            <div key={label} className="grid grid-cols-2 text-sm">
              <div className="p-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-200">{label}</div>
              <div className="p-4 font-mono text-zinc-900">{value as string}</div>
            </div>
          ))}
          {!product.technicalSpecs && (
            <div className="grid grid-cols-2 text-sm">
              <div className="p-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-200">SKU / Identifier</div>
              <div className="p-4 font-mono text-zinc-900">{product.sku}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-12">
        {[
          { title: 'Quality Control', value: '100% Inspected' },
          { title: 'Certification', value: 'ISO 9001:2015' },
          { title: 'IP Protection', value: 'NDA Covered' },
        ].map((item) => (
          <div key={item.title} className="p-4 border border-zinc-100 rounded-xl bg-zinc-50/50">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{item.title}</p>
            <p className="text-xs font-bold text-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-zinc-200 pt-8 pb-4 opacity-50">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-bold">MECHHUB INDUSTRIAL AUTOMATION</p>
            <p className="text-[8px] text-zinc-500">
              &copy; {new Date().getFullYear()} MechHub Inc. All rights reserved.
            </p>
          </div>
          <div className="text-[8px] text-right font-mono">
            VERIFIED_E_SIGNATURE: MS-{Math.random().toString(36).substring(7).toUpperCase()}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
