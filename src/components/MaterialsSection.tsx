'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  ArrowRight,
  ChevronRight,
  Info,
  ShieldCheck,
  Filter,
  Check,
  Box,
  Layers,
  Printer,
  Shield,
  Component,
  Sparkles,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/provider';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

// --- DATA ---
import { CATEGORIES, MATERIALS } from '@/lib/data/materials';

// High quality 3D Isometric SVG Swatches for Materials
function MaterialSwatch({ mat, overrideColor }: { mat: any; overrideColor?: string }) {
  const name = mat.name.toLowerCase();

  // If real thumbnail exists, display image
  if (mat.thumb && mat.thumb.startsWith('/') && !overrideColor) {
    return (
      <div className="w-full h-full rounded-xl relative overflow-hidden shadow-sm border border-slate-200 bg-white">
        <Image src={mat.thumb} alt={mat.name} fill className="object-cover" />
      </div>
    );
  }

  // Render 3D SVG Isometric graphics based on material name & category
  return (
    <div className="w-full h-full rounded-xl relative overflow-hidden shadow-inner border border-slate-200/80 bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
      <svg className="w-full h-full p-1" viewBox="0 0 100 80" fill="none">
        <defs>
          {/* Metal Gradients */}
          <linearGradient id="aluminumGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="aluminumShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="steelGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="stainlessGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E2E8F0" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Plastic & 3D Printing Gradients */}
          <linearGradient id="acrylicGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="absGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="tpuGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="petgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F0FDFA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#CCFBF1" stopOpacity="0.7" />
          </linearGradient>

          {/* Wood Gradients */}
          <linearGradient id="balsaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="mdfGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Composite Patterns */}
          <pattern id="carbonPattern" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#1E293B" />
            <rect x="3" width="3" height="3" fill="#0F172A" />
            <rect y="3" width="3" height="3" fill="#0F172A" />
            <rect x="3" y="3" width="3" height="3" fill="#334155" />
          </pattern>
        </defs>

        {/* 3D Stack / Block Shapes */}
        {name.includes('aluminum') && (
          <g>
            {/* Sheet Stack 1 */}
            <path d="M20 52 L50 67 L80 52 L50 37 Z" fill="url(#aluminumGrad)" stroke="#64748B" strokeWidth="0.5" />
            <path d="M20 52 L50 67 L50 72 L20 57 Z" fill="#94A3B8" />
            <path d="M50 67 L80 52 L80 57 L50 72 Z" fill="#64748B" />
            {/* Sheet Stack 2 */}
            <path d="M20 38 L50 53 L80 38 L50 23 Z" fill="url(#aluminumGrad)" stroke="#FFFFFF" strokeWidth="0.5" />
            <path d="M20 38 L50 53 L50 43 L20 28 Z" fill="#CBD5E1" />
            <path d="M50 53 L80 38 L80 43 L50 58 Z" fill="#94A3B8" />
            {/* Top Shine */}
            <path d="M30 33 L50 43 L70 33 L50 23 Z" fill="url(#aluminumShine)" opacity="0.6" />
          </g>
        )}

        {name.includes('steel') && !name.includes('stainless') && (
          <g>
            <path d="M20 50 L50 65 L80 50 L50 35 Z" fill="url(#steelGrad)" />
            <path d="M20 50 L50 65 L50 70 L20 55 Z" fill="#475569" />
            <path d="M50 65 L80 50 L80 55 L50 70 Z" fill="#334155" />
            <path d="M20 38 L50 53 L80 38 L50 23 Z" fill="url(#steelGrad)" stroke="#94A3B8" strokeWidth="0.5" />
            <path d="M20 38 L50 53 L50 43 L20 28 Z" fill="#64748B" />
            <path d="M50 53 L80 38 L80 43 L50 58 Z" fill="#475569" />
          </g>
        )}

        {name.includes('stainless') && (
          <g>
            <path d="M20 50 L50 65 L80 50 L50 35 Z" fill="url(#stainlessGrad)" />
            <path d="M20 50 L50 65 L50 70 L20 55 Z" fill="#94A3B8" />
            <path d="M50 65 L80 50 L80 55 L50 70 Z" fill="#64748B" />
            <path d="M20 36 L50 51 L80 36 L50 21 Z" fill="url(#stainlessGrad)" stroke="#FFFFFF" strokeWidth="0.8" />
            <path d="M20 36 L50 51 L50 41 L20 26 Z" fill="#CBD5E1" />
            <path d="M50 51 L80 36 L80 41 L50 56 Z" fill="#94A3B8" />
          </g>
        )}

        {name.includes('carbon') && (
          <g>
            <path d="M20 48 L50 63 L80 48 L50 33 Z" fill="url(#carbonPattern)" stroke="#475569" strokeWidth="0.5" />
            <path d="M20 48 L50 63 L50 55 L20 40 Z" fill="#0F172A" />
            <path d="M50 63 L80 48 L80 55 L50 70 Z" fill="#1E293B" />
          </g>
        )}

        {name.includes('acrylic') && (
          <g>
            <path d="M20 48 L50 63 L80 48 L50 33 Z" fill="url(#acrylicGrad)" stroke="#FFFFFF" strokeWidth="1" />
            <path d="M20 48 L50 63 L50 58 L20 43 Z" fill="#38BDF8" opacity="0.6" />
            <path d="M50 63 L80 48 L80 53 L50 68 Z" fill="#0284C7" opacity="0.6" />
          </g>
        )}

        {(name.includes('balsa') || name.includes('mdf') || name.includes('plywood')) && (
          <g>
            <path d="M20 48 L50 63 L80 48 L50 33 Z" fill={name.includes('balsa') ? "url(#balsaGrad)" : "url(#mdfGrad)"} stroke="#D97706" strokeWidth="0.5" />
            <path d="M20 48 L50 63 L50 58 L20 43 Z" fill="#B45309" />
            <path d="M50 63 L80 48 L80 53 L50 68 Z" fill="#78350F" />
            {name.includes('plywood') && (
              <>
                <line x1="20" y1="46" x2="50" y2="61" stroke="#FDE68A" strokeWidth="1" />
                <line x1="50" y1="61" x2="80" y2="46" stroke="#FEF3C7" strokeWidth="1" />
              </>
            )}
          </g>
        )}

        {(name.includes('abs') || name.includes('asa') || name.includes('pla') || name.includes('petg') || name.includes('tpu')) && (
          <g>
            <path
              d="M20 48 L50 63 L80 48 L50 33 Z"
              fill={
                name.includes('tpu')
                  ? 'url(#tpuGrad)'
                  : name.includes('petg')
                    ? 'url(#petgGrad)'
                    : 'url(#absGrad)'
              }
              stroke="#CBD5E1"
              strokeWidth="0.5"
            />
            <path
              d="M20 48 L50 63 L50 58 L20 43 Z"
              fill={name.includes('tpu') ? '#1E293B' : '#94A3B8'}
            />
            <path
              d="M50 63 L80 48 L80 53 L50 68 Z"
              fill={name.includes('tpu') ? '#0F172A' : '#64748B'}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export function MaterialsSection() {
  const router = useRouter();
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedCoating, setSelectedCoating] = useState<string | undefined>(undefined);

  // Sidebar Filter States
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedThickness, setSelectedThickness] = useState<string>('Any');

  const handleQuoteClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleForm = (form: string) => {
    setSelectedForms((prev) =>
      prev.includes(form) ? prev.filter((f) => f !== form) : [...prev, form]
    );
  };

  const clearAllFilters = () => {
    setActiveFilter('ALL');
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedForms([]);
    setSelectedThickness('Any');
  };

  const filteredMaterials = useMemo(() => {
    return MATERIALS.filter((mat) => {
      const matchCategory =
        activeFilter === 'ALL' ||
        mat.category.toUpperCase() === activeFilter.replace(' ', '_').toUpperCase();

      const matchSearch = mat.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType =
        selectedTypes.length === 0 ||
        selectedTypes.some((t) => {
          if (t === 'Metals') return ['aluminum', 'steel', 'stainless'].includes(mat.category);
          if (t === 'Plastics') return mat.category === 'plastics';
          if (t === 'Composites') return mat.category === 'composites';
          if (t === 'Woods') return mat.category === 'woods';
          if (t === '3D Printing') return mat.category === '3d_printing';
          return true;
        });

      return matchCategory && matchSearch && matchType;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFilter, searchQuery, selectedTypes]);

  useEffect(() => {
    if (selectedMaterial) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMaterial]);

  // Helper for category badge colors matching design image
  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case '3d_printing':
      case '3d printing':
        return 'bg-[#FDF2F8] text-[#DB2777] border-[#FBCFE8]';
      case 'plastics':
        return 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]';
      case 'aluminum':
      case 'aluminium':
        return 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]';
      case 'steel':
      case 'stainless':
        return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
      case 'composites':
        return 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]';
      case 'woods':
      case 'wood':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <section
      id="materials"
      className="py-16 md:py-24 bg-[#F3F7FD] relative overflow-hidden border-t border-blue-100/60"
    >
      {/* Background subtle blueprint grid pattern */}
      <div className="absolute inset-0 blueprint-grid opacity-[0.035] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Top Centered Header */}
        <div className="text-center mb-8 md:mb-12 max-w-3xl mx-auto">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-white/90 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563EB] mb-3.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> INDUSTRIAL CATALOG
            </div>
          </ScrollReveal>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B192C] font-['Lora',serif] mt-1 mb-3.5 leading-tight tracking-tight">
            <span className="text-[#0066FF] font-sans font-black mr-2">14+</span>
            <TextReveal text="Materials in Stock" />
          </h2>

          <ScrollReveal variant="fade-up" delay={150}>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto font-normal leading-relaxed mb-6">
              Every material is stocked, cut to order, and shipped fast.
              <br className="hidden sm:inline" /> No minimums. No surprises.
            </p>
          </ScrollReveal>

          {/* Search Input Bar */}
          <ScrollReveal variant="scale-in" delay={200}>
            <div className="max-w-xl mx-auto relative shadow-xs rounded-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials..."
                className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200/90 rounded-full shadow-2xs focus:ring-2 focus:ring-[#0066FF] focus:border-[#0066FF] transition-all outline-none text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </ScrollReveal>
        </div>

        {/* Horizontal Category Pill Bar */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5">
            {[
              { label: 'All', count: MATERIALS.length, key: 'ALL', icon: Layers },
              { label: 'Aluminium', count: 2, key: 'ALUMINUM', icon: Component },
              { label: 'Steel', count: 1, key: 'STEEL', icon: Shield },
              { label: 'Stainless', count: 1, key: 'STAINLESS', icon: ShieldCheck },
              { label: 'Composites', count: 1, key: 'COMPOSITES', icon: Layers },
              { label: 'Plastics', count: 1, key: 'PLASTICS', icon: Box },
              { label: 'Woods', count: 3, key: 'WOODS', icon: Sparkles },
              { label: '3D Printing', count: 5, key: '3D_PRINTING', icon: Printer },
            ].map((item) => {
              const isActive = activeFilter === item.key;
              const IconComp = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveFilter(item.key)}
                  className={`
                    px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 border shadow-2xs
                    ${isActive
                      ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 hover:text-[#0066FF]'
                    }
                  `}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Layout: Sidebar + Cards Grid + Right Floating Accents */}
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto items-start">

          {/* Left Sidebar: "Filter by" Panel */}
          <div className="w-full lg:w-60 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs shrink-0">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0B192C] font-bold text-xs sm:text-sm">
                <Filter className="w-4 h-4 text-[#0066FF]" />
                <span>Filter by</span>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-[#0066FF] hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* Filter 1: Material Type */}
            <div className="mb-5">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2.5">
                Material Type
              </span>
              <div className="space-y-2">
                {[
                  { label: 'Metals', count: 8 },
                  { label: 'Plastics', count: 1 },
                  { label: 'Composites', count: 1 },
                  { label: 'Woods', count: 3 },
                  { label: '3D Printing', count: 5 },
                ].map((t) => {
                  const isChecked = selectedTypes.includes(t.label);
                  return (
                    <label
                      key={t.label}
                      className="flex items-center justify-between text-xs text-slate-600 font-medium cursor-pointer hover:text-slate-900 group"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleType(t.label)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                        />
                        <span>{t.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">({t.count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter 2: Form */}
            <div className="mb-5 pt-3.5 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2.5">
                Form
              </span>
              <div className="space-y-2">
                {[
                  { label: 'Sheet / Plate', count: 8 },
                  { label: 'Rod / Bar', count: 3 },
                  { label: 'Tube', count: 1 },
                  { label: 'Block', count: 2 },
                ].map((f) => {
                  const isChecked = selectedForms.includes(f.label);
                  return (
                    <label
                      key={f.label}
                      className="flex items-center justify-between text-xs text-slate-600 font-medium cursor-pointer hover:text-slate-900 group"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleForm(f.label)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                        />
                        <span>{f.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">({f.count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter 3: Thickness / Size */}
            <div className="pt-3.5 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Thickness / Size
              </span>
              <div className="relative">
                <select
                  value={selectedThickness}
                  onChange={(e) => setSelectedThickness(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 outline-none appearance-none cursor-pointer focus:border-[#0066FF]"
                >
                  <option value="Any">Any</option>
                  <option value="1mm-5mm">1mm - 5mm</option>
                  <option value="5mm-10mm">5mm - 10mm</option>
                  <option value="10mm+">10mm+</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Bottom Left 3D Gears & Annotation (Matching screenshot design) */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center text-center">
              {/* 3D Metallic Gears SVG Illustration */}
              <svg width="70" height="60" viewBox="0 0 100 80" fill="none">
                {/* Large Silver Gear */}
                <g transform="translate(35, 35)">
                  <circle cx="0" cy="0" r="22" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
                  {/* Gear teeth */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                    <rect
                      key={ang}
                      x="-3"
                      y="-26"
                      width="6"
                      height="8"
                      rx="1"
                      fill="#CBD5E1"
                      stroke="#94A3B8"
                      strokeWidth="1"
                      transform={`rotate(${ang})`}
                    />
                  ))}
                </g>
                {/* Small Blue Gear */}
                <g transform="translate(68, 50)">
                  <circle cx="0" cy="0" r="14" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1" />
                  <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
                  {[0, 60, 120, 180, 240, 300].map((ang) => (
                    <rect
                      key={ang}
                      x="-2"
                      y="-17"
                      width="4"
                      height="5"
                      rx="1"
                      fill="#93C5FD"
                      transform={`rotate(${ang})`}
                    />
                  ))}
                </g>
              </svg>

              {/* Curved Blue Sketch Arrow & Handwritten Text */}
              <div className="mt-1 relative flex flex-col items-center">
                <svg width="24" height="24" viewBox="0 0 30 30" fill="none" stroke="#0066FF" strokeWidth="1.5" className="-rotate-45">
                  <path d="M 5 25 Q 15 5 25 15" strokeDasharray="3 3" />
                  <path d="M 20 10 L 25 15 L 20 20" />
                </svg>
                <span className="font-serif italic text-[11px] text-[#0066FF] font-medium leading-tight text-center -rotate-2 max-w-[130px]">
                  Precision Materials for Real Builds
                </span>
              </div>
            </div>
          </div>

          {/* Center Column: Material Cards Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMaterials.map((mat, idx) => {
                const isPopular = mat.name === 'ABS' || mat.name === 'Aluminum 6061' || mat.name === 'Stainless Steel 304';
                const isSelectedABS = mat.name === 'ABS';

                return (
                  <ScrollReveal
                    key={mat.name}
                    variant="fade-up"
                    staggerIndex={idx}
                    staggerDelay={35}
                    className="h-full"
                  >
                    <div
                      onClick={() => {
                        const material = mat as any;
                        if (material.slug) {
                          router.push(material.slug);
                        } else {
                          setSelectedMaterial(mat);
                        }
                      }}
                      className={`
                        group bg-white rounded-xl p-3.5 shadow-2xs transition-all duration-300 relative flex flex-col justify-between h-full cursor-pointer border hover:-translate-y-0.5
                        ${isSelectedABS
                          ? 'border-2 border-[#0066FF] shadow-md shadow-blue-500/10'
                          : 'border-slate-200/90 hover:border-[#0066FF] hover:shadow-md'
                        }
                      `}
                    >
                      {/* Top Popular Badge */}
                      {isPopular && (
                        <div className="absolute top-2.5 right-2.5 bg-[#0066FF] text-white text-[8.5px] font-bold px-2 py-0.5 rounded-md shadow-2xs uppercase tracking-wider z-10">
                          Popular
                        </div>
                      )}

                      <div>
                        {/* Header: Thumbnail Block + Title & Category */}
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden border border-slate-200/80 bg-slate-50 shadow-inner group-hover:scale-105 transition-transform duration-300">
                            <MaterialSwatch mat={mat} />
                          </div>
                          <div className="flex-1 min-w-0 pr-5">
                            <h3 className="font-sans font-bold text-slate-900 text-sm group-hover:text-[#0066FF] transition-colors truncate">
                              {mat.name}
                            </h3>
                            <span
                              className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wider border ${getCategoryBadgeClass(
                                mat.category
                              )}`}
                            >
                              {mat.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Specs Text - Compact Block Mono */}
                        <p className="text-[11px] font-mono text-slate-500 mb-2.5 line-clamp-2 leading-tight">
                          {mat.thicknesses}
                        </p>
                      </div>

                      {/* Card Bottom: Process Badges & Action Arrow */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <div className="flex flex-wrap gap-1">
                          {mat.processes.slice(0, 2).map((p) => (
                            <span
                              key={p}
                              className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#EFF6FF] text-[#0066FF] rounded border border-[#DBEAFE]"
                            >
                              {p}
                            </span>
                          ))}
                        </div>

                        {/* Right Rectangular Block Arrow Button */}
                        <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#0066FF] border border-[#DBEAFE] flex items-center justify-center group-hover:bg-[#0066FF] group-hover:text-white group-hover:border-[#0066FF] transition-all shrink-0 ml-auto">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>

          {/* Right Column: Graphic Accents & Annotations (Desktop view) */}
          <div className="w-full lg:w-44 space-y-6 hidden xl:block shrink-0 pt-2">

            {/* Top Metallic Rods Graphic & Annotation */}
            <div className="text-center">
              <span className="font-serif italic text-[#0066FF] text-xs block -rotate-3 font-medium">
                High quality materials
              </span>
              <svg className="w-6 h-6 text-[#0066FF] opacity-70 mx-auto mt-0.5" viewBox="0 0 30 30" fill="none" stroke="currentColor">
                <path d="M 20 5 Q 10 15 15 25" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 10 20 L 15 25 L 20 20" strokeWidth="1.5" />
              </svg>

              {/* 3D Extruded Metal Rods Graphic */}
              <div className="mt-2 bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex items-center justify-center">
                <svg width="80" height="60" viewBox="0 0 100 70" fill="none">
                  {/* Metal Rod 1 */}
                  <path d="M20 50 L80 20 L80 10 L20 40 Z" fill="url(#aluminumGrad)" stroke="#94A3B8" strokeWidth="1" />
                  <ellipse cx="20" cy="45" rx="8" ry="5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                  {/* Metal Tube 2 */}
                  <path d="M30 60 L90 30 L90 22 L30 52 Z" fill="url(#stainlessGrad)" stroke="#64748B" strokeWidth="1" />
                  <ellipse cx="30" cy="56" rx="7" ry="4" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
                </svg>
              </div>
            </div>

            {/* Checklist Card */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2 text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0066FF] stroke-[3]" />
                <span>Stocked</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0066FF] stroke-[3]" />
                <span>Cut to order</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0066FF] stroke-[3]" />
                <span>Fast shipping</span>
              </div>
            </div>

            {/* Bottom 3D Layered Material Stack Graphic & Annotation */}
            <div className="text-center pt-1">
              {/* 3D Material Stack Graphic */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-center mb-2">
                <svg width="80" height="65" viewBox="0 0 100 80" fill="none">
                  {/* Top White Plate */}
                  <path d="M20 25 L80 25 L65 15 L5 15 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
                  <path d="M20 25 L80 25 L80 30 L20 30 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                  {/* Middle Blue Plate */}
                  <path d="M20 38 L80 38 L65 28 L5 28 Z" fill="#3B82F6" stroke="#2563EB" strokeWidth="1" />
                  <path d="M20 38 L80 38 L80 43 L20 43 Z" fill="#1D4ED8" stroke="#1E40AF" strokeWidth="1" />
                  {/* Bottom Wood Plate */}
                  <path d="M20 51 L80 51 L65 41 L5 41 Z" fill="#D97706" stroke="#B45309" strokeWidth="1" />
                  <path d="M20 51 L80 51 L80 58 L20 58 Z" fill="#92400E" stroke="#78350F" strokeWidth="1" />
                </svg>
              </div>

              {/* Handwritten Sketch Arrow & Text */}
              <svg className="w-6 h-6 text-[#0066FF] opacity-70 mx-auto mb-1 rotate-180" viewBox="0 0 30 30" fill="none" stroke="currentColor">
                <path d="M 20 5 Q 10 15 15 25" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 10 20 L 15 25 L 20 20" strokeWidth="1.5" />
              </svg>

              <p className="font-serif italic text-xs text-[#0066FF] font-medium leading-tight max-w-[140px] mx-auto">
                From metals to plastics, we got you covered.
              </p>

              {/* Bottom Right Dot Matrix & Isometric Cube Wireframe */}
              <div className="mt-4 flex flex-col items-center opacity-60">
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
                  ))}
                </div>
                <svg width="24" height="24" viewBox="0 0 30 30" fill="none" stroke="#0066FF" strokeWidth="1">
                  <path d="M15 5 L27 12 L27 24 L15 30 L3 24 L3 12 Z" />
                  <path d="M15 5 L15 30" />
                  <path d="M3 12 L15 18 L27 12" />
                </svg>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Selected Material Drawer Modal */}
      {selectedMaterial && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] animate-in fade-in duration-200"
            onClick={() => {
              setSelectedMaterial(null);
              setSelectedCoating(undefined);
            }}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-8">
                <button
                  onClick={() => {
                    setSelectedMaterial(null);
                    setSelectedCoating(undefined);
                  }}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 hover:text-slate-900" />
                </button>
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-700 bg-slate-50`}
                >
                  {selectedMaterial.category}
                </div>
              </div>

              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 shrink-0">
                  <MaterialSwatch mat={selectedMaterial} overrideColor={selectedCoating} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight mb-1.5">
                    {selectedMaterial.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[#0066FF] font-mono text-xs font-bold flex-wrap">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>IN STOCK</span>
                      <span className="opacity-40">·</span>
                      <span>SHIPS FAST</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {selectedMaterial.notes && (
                  <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-2xl">
                    <h4 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> MANUFACTURING NOTES
                    </h4>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {selectedMaterial.notes}
                    </p>
                  </div>
                )}

                {selectedMaterial.notes?.toLowerCase().includes('powder coating') && (
                  <div>
                    <h4 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-3">
                      POWDER COATING COLORS
                    </h4>
                    <div className="flex gap-2.5">
                      {[
                        { name: 'Black', hex: '#1C1C1C' },
                        { name: 'White', hex: '#F5F5F5' },
                        { name: 'Red', hex: '#C62828' },
                        { name: 'Blue', hex: '#1565C0' },
                        { name: 'Yellow', hex: '#F9A825' },
                      ].map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedCoating(color.hex)}
                          className={`w-9 h-9 rounded-full border-2 transition-all ${selectedCoating === color.hex
                              ? 'border-blue-500 scale-110 shadow-md'
                              : 'border-slate-200 hover:border-slate-300'
                            }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                      <button
                        onClick={() => setSelectedCoating(undefined)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${!selectedCoating
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        Raw
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-3">
                    PROPERTIES
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'Thickness', v: selectedMaterial.thicknesses },
                      { l: 'Machinability', v: 'High' },
                      { l: 'Corrosion', v: 'Excellent' },
                      { l: 'Strength', v: 'Industrial' },
                    ].map((p) => (
                      <div
                        key={p.l}
                        className="bg-slate-50 p-3.5 rounded-xl border border-slate-100"
                      >
                        <div className="text-[9px] font-bold text-[#0066FF] uppercase tracking-widest mb-1">
                          {p.l}
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate">{p.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-3">
                    CAPABILITIES
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaterial.processes.map((proc: string) => (
                      <div
                        key={proc}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> {proc}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={handleQuoteClick}
                    className="w-full h-14 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 group"
                  >
                    Quote with this Material{' '}
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
