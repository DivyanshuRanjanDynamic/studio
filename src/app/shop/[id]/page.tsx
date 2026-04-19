'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
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

  // Sticky CTA logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setScrolledPast(true);
      } else {
        setScrolledPast(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading || !productRef) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2F5FA7]"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100">
          <Package className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-slate-500 mb-8 max-w-md text-center">
          The component you are looking for does not exist in our registry or has been removed.
        </p>
        <Link href="/shop">
          <Button
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 gap-2 h-12 px-8 text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalogue
          </Button>
        </Link>
      </div>
    );
  }

  const reviews = (product.reviews as Review[]) || [];
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
      : 4.5; // Placeholder for products without reviews yet

  const placeholders = [
    'https://images.unsplash.com/photo-1594819047050-99def0f34101?q=80&w=800',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800',
  ];

  // Handle both legacy (string array) and new (ImageMetadata array) formats
  const productImages =
    product.images?.length > 0
      ? product.images.map((img: any) => (typeof img === 'string' ? img : img.urls.product))
      : placeholders;

  const thumbImages =
    product.images?.length > 0
      ? product.images.map((img: any) => (typeof img === 'string' ? img : img.urls.thumb))
      : placeholders;

  const zoomImage = product.images?.[activeImage]?.urls?.zoom || productImages[activeImage];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-500/30">
      <LandingNav />

      {/* Breadcrumbs */}
      <div className="bg-white/50 border-b border-slate-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link
              href="/"
              className="hover:text-[#2F5FA7] flex items-center gap-1 transition-colors"
            >
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-[#2F5FA7] transition-colors">
              Shop
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/shop?category=${product.categoryId}`}
              className="hover:text-[#2F5FA7] transition-colors capitalize"
            >
              {product.categoryId.replace('-', ' ')}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 truncate max-w-[150px]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Hidden Printable Datasheet */}
      <PrintableDatasheet product={product} productImages={productImages} />

      <main className="container mx-auto px-4 py-8 md:py-12 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Product Image & Gallery */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6 lg:sticky lg:top-24">
            <div className="aspect-square bg-slate-50 rounded-[2rem] border border-slate-200 flex items-center justify-center relative overflow-hidden group shadow-2xl">
              <Image
                src={productImages[activeImage]}
                alt={product.name}
                fill
                priority
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />

              {/* Tags */}
              <div className="absolute top-6 left-6 flex flex-col gap-3">
                <Badge className="bg-white/90 backdrop-blur-md text-emerald-600 border-emerald-100 px-3 py-1.5 font-black text-[10px] uppercase tracking-wider shadow-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> QC Verified
                </Badge>
                <Badge className="bg-white/90 backdrop-blur-md text-[#2F5FA7] border-blue-100 px-3 py-1.5 font-black text-[10px] uppercase tracking-wider shadow-xl">
                  <Zap className="w-3.5 h-3.5 mr-2" /> Tier-1 Supply
                </Badge>
              </div>

              {/* Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImage(
                        (prev) => (prev - 1 + productImages.length) % productImages.length
                      );
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#2F5FA7] hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100 z-10 shadow-2xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImage((prev) => (prev + 1) % productImages.length);
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#2F5FA7] hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100 z-10 shadow-2xl"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Row */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x h-24 md:h-28">
              {productImages.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] overflow-hidden border-2 transition-all shrink-0 snap-start shadow-sm ${activeImage === idx
                    ? 'border-[#2F5FA7] shadow-[0_0_20px_rgba(47,95,167,0.2)] scale-95'
                    : 'border-slate-200 hover:border-blue-200 grayscale-[0.5] hover:grayscale-0'
                    }`}
                >
                  <Image
                    src={thumbImages[idx]}
                    alt={`${product.name} thumb ${idx}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info & Buy Box */}
          <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8">
            <section className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-100 text-[#2F5FA7] font-mono text-[8px] md:text-[9px] tracking-widest uppercase px-2 py-0 bg-blue-50/30"
                >
                  SKU: {product.sku}
                </Badge>
                {product.inventory < 50 && (
                  <Badge className="bg-orange-50 text-orange-600 border-orange-100 text-[8px] md:text-[9px] uppercase font-bold px-2 py-0">
                    Low Stock
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.floor(avgRating) ? 'fill-current' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-600">{avgRating}</span>
                <span className="text-slate-200">|</span>
                <span className="text-xs font-medium text-slate-500 underline underline-offset-4 cursor-pointer hover:text-[#2F5FA7] transition-colors">
                  {reviews.length || 124} Reviews
                </span>
              </div>

              <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                {product.description}
              </p>

              {/* Technical Highlights (Migrated from Listing) */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                      Tolerance
                    </div>
                    <div className="text-sm font-bold text-slate-800 font-mono">
                      {product.technicalSpecs?.Tolerance || '±0.05mm'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                      Inventory
                    </div>
                    <div className="text-sm font-bold text-emerald-600">
                      {product.inventory} Units
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                    Material Grade
                  </div>
                  <div className="text-sm font-bold text-[#2F5FA7] uppercase tracking-tight line-clamp-1">
                    {product.technicalSpecs?.Material || '6061-T6 Aluminum / POM'}
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Block */}
            {/* Pricing Block */}
            <section className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white border border-slate-100 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />

              <div className="space-y-6 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-baseline flex-wrap gap-2 sm:gap-4">
                    <span className="text-3xl md:text-6xl font-bold text-slate-900 font-mono tracking-tighter">
                      ₹{(product.salePrice * quantity).toLocaleString()}
                    </span>
                    {product.basePrice > product.salePrice && (
                      <div className="flex flex-col">
                        <span className="text-base md:text-lg text-slate-400 line-through font-mono opacity-50 decoration-1">
                          ₹{(product.basePrice * quantity).toLocaleString()}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                          You Save ₹
                          {((product.basePrice - product.salePrice) * quantity).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium pl-0.5 italic">
                    Excl. GST (18%) & Standard ISO Packaging
                  </p>
                </div>

                <div className="pt-2 md:pt-4 space-y-5 md:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl overflow-hidden h-10 md:h-10 w-26 md:w-26">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 md:w-14 h-full flex items-center justify-center hover:bg-white text-slate-400 hover:text-[#2F5FA7] transition-colors border-r border-slate-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-14 md:w-20 text-center text-sm md:text-base font-bold font-mono text-slate-800">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= product.inventory}
                        className={`w-12 md:w-14 h-full flex items-center justify-center hover:bg-white text-slate-400 hover:text-[#2F5FA7] transition-colors border-l border-slate-100 ${quantity >= product.inventory ? 'opacity-20 cursor-not-allowed' : ''}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-left sm:text-right px-1">
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-1">
                        Availability
                      </p>
                      <div className="flex items-center sm:justify-end gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${product.inventory > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}
                        />
                        <span className="text-xs font-bold text-slate-600">
                          {product.inventory} Units In Reserve
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full h-14 md:h-16 bg-[#2F5FA7] hover:bg-[#1E3A66] text-white font-bold rounded-xl md:rounded-2xl gap-3 shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <ShoppingCart className="w-5 h-5" />{' '}
                      {product.inventory > 0 ? 'Add to Procurement' : 'Out of Stock'}
                    </Button>
                    <Button
                      className="w-full h-14 md:h-16 bg-slate-900 text-white hover:bg-slate-800 rounded-xl md:rounded-2xl font-black transition-all active:scale-[0.98] text-sm md:text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Commence Strategic Buy
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Trust Signals Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              {[
                { icon: Truck, title: 'Express Logistics', desc: 'Dispatch in 24h' },
                { icon: ShieldCheck, title: 'Auth Guarantee', desc: '100% Genuine' },
                { icon: RotateCcw, title: '7-Day Return', desc: 'Quality Assurance' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3 shadow-sm"
                >
                  <item.icon className="w-5 h-5 text-[#2F5FA7] shrink-0" />
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">{item.title}</h5>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Highlights Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Zap className="w-5 h-5 text-[#2F5FA7]" /> Key Feature Highlights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {((product.features as string[]) || []).map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#2F5FA7]" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{f}</span>
                  </div>
                ))}
                {(!product.features || product.features.length === 0) && (
                  <>
                    {[
                      'Precision Engineered',
                      'Industrial Grade',
                      'QC Certified',
                      'Standard Dimensions',
                    ].map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#2F5FA7]" />
                        </div>
                        <span className="text-xs font-medium text-slate-500">{f}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Content Sections */}
        <div className="mt-24 space-y-24">
          {/* Detailed Specifications */}
          <section id="specifications" className="scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Technical Specifications</h2>
                <p className="text-slate-500 text-sm">
                  Precise engineering data for professional industrial integration.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-200 text-xs gap-2 rounded-xl h-10 px-6 hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-700"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4" /> Download Datasheet (PDF)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-100 rounded-2xl md:rounded-[2rem] overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {Object.entries(product.technicalSpecs || {})
                  .slice(0, Math.ceil(Object.entries(product.technicalSpecs || {}).length / 2))
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-1 sm:grid-cols-2 p-4 md:p-6 hover:bg-slate-50 transition-colors gap-1 sm:gap-4"
                    >
                      <span className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="text-sm md:text-sm text-slate-800 font-bold font-mono break-all sm:break-normal">
                        {value as string}
                      </span>
                    </div>
                  ))}
                {!product.technicalSpecs && (
                  <div className="grid grid-cols-2 p-4 md:p-6 gap-4">
                    <span className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider">
                      Part Code
                    </span>
                    <span className="text-xs md:text-sm text-slate-800 font-bold font-mono">
                      {product.sku}
                    </span>
                  </div>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {Object.entries(product.technicalSpecs || {})
                  .slice(Math.ceil(Object.entries(product.technicalSpecs || {}).length / 2))
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-1 sm:grid-cols-2 p-4 md:p-6 hover:bg-slate-50 transition-colors gap-1 sm:gap-4"
                    >
                      <span className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="text-sm md:text-sm text-slate-800 font-bold font-mono break-all sm:break-normal">
                        {value as string}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          {/* Applications & Compatibility */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">Ideal Applications</h3>
                <p className="text-slate-500 text-sm">
                  Where this component excels in efficiency and reliability.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(
                  (product.applications as string[]) || [
                    '3D Printing',
                    'CNC Machinery',
                    'Robotics',
                    'Automation',
                  ]
                ).map((app, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white border border-slate-100 shadow-lg group hover:border-blue-200 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <Package className="w-4 h-4 text-slate-400 group-hover:text-[#2F5FA7]" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{app}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">System Compatibility</h3>
                <p className="text-slate-500 text-sm">
                  Matching industrial standards and hardware ecosystems.
                </p>
              </div>
              <div className="space-y-4">
                {(
                  (product.compatibility as string[]) || [
                    'Standard Shaft Assemblies',
                    'Standard Mounting Brackets',
                  ]
                ).map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm"
                  >
                    <span className="text-sm font-medium text-slate-500">{comp}</span>
                    <Badge
                      variant="outline"
                      className="text-emerald-600 font-bold text-[10px] uppercase border-emerald-100 bg-emerald-50"
                    >
                      Verified
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* FAQ Section */}
          <section id="faq" className="max-w-4xl mx-auto w-full">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold text-slate-900">Parts Procurement FAQ</h2>
              <p className="text-slate-500 text-sm">
                Technical answers for procurement officers and engineers.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {(
                (product.faqs as FAQ[]) || [
                  {
                    q: 'What is the dispatch time?',
                    a: 'Standard dispatch time is within 24-48 business hours from order verification for in-stock items. Custom fabrications will have specific lead times.',
                  },
                  {
                    q: 'Do you provide bulk discounts?',
                    a: 'Yes, for quantities above 100 units, please contact our relationship manager for a commercial quote.',
                  },
                  {
                    q: 'Is this component compatible with SolidWorks/Fusion 360?',
                    a: 'Yes, our components follow standard industrial sizing. You can download the datasheet for precise dimensions to aid your CAD modeling.',
                  },
                  {
                    q: 'What material grades are used?',
                    a: "We specify the material grade (like 6061-T6 Aluminum or POM) in the 'Specifications' section above. All materials are source-verified.",
                  },
                  {
                    q: 'Can I request custom modifications?',
                    a: 'Custom modifications (drilling, anodizing, etc.) are available through our Partner Fabrication Program for volume orders.',
                  },
                  {
                    q: 'What is the return policy for precision parts?',
                    a: "We accept returns within 7 days for unopened items in original packaging. Precision components must be in 'as-dispatched' condition to pass QC.",
                  },
                  {
                    q: 'Do you ship internationally?',
                    a: 'Currently, we provide end-to-end logistics within the region. For international inquiries, please contact our logistics desk for shipping estimates.',
                  },
                ]
              ).map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border border-slate-100 bg-white rounded-2xl px-6 shadow-sm"
                >
                  <AccordionTrigger className="text-sm font-bold text-slate-800 hover:text-[#2F5FA7] hover:no-underline py-6">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-500 leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Reviews Section */}
          <section
            id="reviews"
            className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-12 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Customer Intelligence</h2>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold text-slate-900 font-mono tracking-tighter">
                    {avgRating}
                  </div>
                  <div>
                    <div className="flex items-center text-amber-500 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(avgRating) ? 'fill-current' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {reviews.length || 124} Verified Reviews
                    </p>
                  </div>
                </div>
              </div>
              <Button className="bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl px-8 h-12 shadow-lg shadow-blue-900/10">
                Submit Field Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {((product.reviews as Review[]) || []).map((review, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-[#2F5FA7] shadow-sm">
                        {review.userName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {review.userName || 'Verified User'}
                        </p>
                        <div className="flex items-center text-amber-500 scale-75 -ml-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? 'fill-current' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {review.createdAt || 'Recent'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Sticky Procurement Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 transition-all duration-500 transform ${scrolledPast ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 overflow-hidden hidden sm:flex items-center justify-center shrink-0">
              <img src={productImages[0]} className="w-full h-full object-cover opacity-40" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
              <p className="text-[10px] font-mono text-cyan-500/70 uppercase truncate">
                {product.sku}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xl font-bold text-white font-mono">
                ₹{product.salePrice.toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-tighter">
                In Stock: {product.inventory}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-10 sm:h-11 px-4 sm:px-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold hidden sm:flex"
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
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />{' '}
                <span className="hidden xs:inline">Add</span>
              </Button>
              <Button
                size="sm"
                className="h-10 sm:h-11 px-6 sm:px-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 text-xs sm:text-sm"
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
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal Component for Printable Datasheet
function PrintableDatasheet({ product, productImages }: { product: any; productImages: string[] }) {
  return (
    <div className="print-only bg-white text-black p-12 font-sans min-h-[297mm] w-[210mm] mx-auto hidden print:block">
      {/* Header / Branding */}
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

      {/* Product Summary */}
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
            {product.description ||
              'High-precision industrial component manufactured to strict ISO standards. This datasheet provides technical specifications for design integration and procurement validation.'}
          </p>
        </div>
        <div className="col-span-4 aspect-square bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-center p-4 relative overflow-hidden">
          <Image
            src={
              productImages[0] ||
              'https://images.unsplash.com/photo-1594819047050-99def0f34101?q=80&w=800'
            }
            alt={product.name}
            fill
            className="object-contain grayscale"
            sizes="200px"
          />
        </div>
      </div>

      {/* Detailed Specs Table */}
      <div className="space-y-4 mb-12">
        <h3 className="text-sm font-black uppercase tracking-widest border-l-4 border-black pl-3 py-1 bg-zinc-50">
          Technical Specifications
        </h3>
        <div className="grid grid-cols-1 border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-200">
          {Object.entries(product.technicalSpecs || {}).map(([label, value]) => (
            <div key={label} className="grid grid-cols-2 text-sm">
              <div className="p-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-200">
                {label}
              </div>
              <div className="p-4 font-mono text-zinc-900">{value as string}</div>
            </div>
          ))}
          {!product.technicalSpecs && (
            <div className="grid grid-cols-2 text-sm">
              <div className="p-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-200">
                SKU / Identifier
              </div>
              <div className="p-4 font-mono text-zinc-900">{product.sku}</div>
            </div>
          )}
        </div>
      </div>

      {/* Compliance & Quality */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        {[
          { title: 'Quality Control', value: '100% Inspected' },
          { title: 'Certification', value: 'ISO 9001:2015' },
          { title: 'IP Protection', value: 'NDA Covered' },
        ].map((item) => (
          <div key={item.title} className="p-4 border border-zinc-100 rounded-xl bg-zinc-50/50">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              {item.title}
            </p>
            <p className="text-xs font-bold text-black">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Footer / Legal */}
      <div className="mt-auto border-t border-zinc-200 pt-8 pb-4 opacity-50">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-bold">MECHHUB INDUSTRIAL AUTOMATION</p>
            <p className="text-[8px] text-zinc-500">
              © {new Date().getFullYear()} MechHub Inc. All rights reserved. Precision data subject
              to variation ±0.05mm unless specified.
            </p>
          </div>
          <div className="text-[8px] text-right font-mono">
            VERIFIED_E_SIGNATURE: MS-{Math.random().toString(36).substring(7).toUpperCase()}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          @page {
            margin: 20mm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
