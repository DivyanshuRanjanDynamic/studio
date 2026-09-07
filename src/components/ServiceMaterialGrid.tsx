'use client';

import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, X, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { CATEGORIES, MATERIALS } from '@/lib/data/materials';

interface ServiceMaterialGridProps {
  serviceName: string; // e.g. "Sheet Cutting", "CNC Milling/Turning", "3D Printing"
  title?: string;
  subtitle?: string;
}

function MaterialSwatch({ mat, overrideColor }: { mat: any; overrideColor?: string }) {
  const isMetal = ['aluminum', 'steel', 'stainless'].includes(mat.category);
  const isWood = mat.category === 'woods';
  const isPlastic = mat.category === 'plastics' || mat.category === '3d_printing';
  const isComposite = mat.category === 'composites';

  let style: React.CSSProperties = {
    backgroundColor: overrideColor || mat.colors?.base || '#CBD5E1',
  };

  if (overrideColor) {
    style.backgroundImage =
      'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)';
  } else if (isMetal) {
    style.backgroundImage = `linear-gradient(145deg, ${mat.colors?.base || '#C0C7CF'} 0%, ${mat.colors?.alt || '#A8B0B8'} 100%)`;
  } else if (isComposite) {
    style.backgroundImage = `
      repeating-linear-gradient(45deg, ${mat.colors?.base} 0px, ${mat.colors?.base} 2px, ${mat.colors?.pattern} 2px, ${mat.colors?.pattern} 4px),
      repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)
    `;
  } else if (isWood) {
    style.backgroundImage = `
      linear-gradient(to right, ${mat.colors?.base}, ${mat.colors?.alt || mat.colors?.base}),
      repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 4px)
    `;
  } else if (mat.name === 'Acrylic') {
    style.backdropFilter = 'blur(8px)';
    style.border = '1px solid rgba(255,255,255,0.3)';
    style.backgroundImage = `linear-gradient(135deg, ${mat.colors?.base}, rgba(255,255,255,0.1))`;
  } else if (mat.name === 'PETG') {
    style.backgroundImage = `linear-gradient(135deg, ${mat.colors?.base}, ${mat.colors?.translucent || mat.colors?.base})`;
  } else if (isPlastic) {
    style.backgroundImage = `linear-gradient(145deg, ${mat.colors?.base}, ${mat.colors?.alt || mat.colors?.base})`;
  }

  return (
    <div
      className="w-14 h-14 rounded-xl relative overflow-hidden shadow-inner border border-slate-200/50 group-hover:scale-105 transition-transform duration-500"
      style={style}
    >
      {isMetal && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}
      {isWood && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")',
          }}
        />
      )}
      {isComposite && <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />}
      <div
        className="absolute inset-0 bg-black/5"
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/5 blur-[4px]" />
    </div>
  );
}

export function ServiceMaterialGrid({
  serviceName,
  title = 'Supported Substrates',
  subtitle = 'We stock a comprehensive range of materials for this service. Filter by category to find your specific requirement.',
}: ServiceMaterialGridProps) {
  const router = useRouter();
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedCoating, setSelectedCoating] = useState<string | undefined>(undefined);

  // Filter materials that support this specific service
  const serviceMaterials = useMemo(() => {
    return MATERIALS.filter((mat) => mat.processes.includes(serviceName));
  }, [serviceName]);

  // Available categories for THIS service
  const availableCategories = useMemo(() => {
    const cats = new Set(['ALL']);
    serviceMaterials.forEach((m) => cats.add(m.category.toUpperCase()));
    return CATEGORIES.filter((c) => cats.has(c.replace(' ', '_').toUpperCase()));
  }, [serviceMaterials]);

  const filteredMaterials = useMemo(() => {
    return serviceMaterials
      .filter((mat) => {
        const matchCategory =
          activeFilter === 'ALL' ||
          mat.category.toUpperCase() === activeFilter.replace(' ', '_').toUpperCase();
        const matchSearch = mat.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [serviceMaterials, activeFilter, searchQuery]);

  const handleQuoteClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">
            {title}
          </h2>
          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="max-w-md mx-auto relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-100" />
          <input
            type="text"
            placeholder="Search materials..."
            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none text-slate-700 font-medium whitespace-nowrap overflow-hidden"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`
                px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 border
                ${
                  activeFilter === cat
                    ? 'bg-[#1e40af] text-white shadow-xl shadow-blue-200 border-[#1e40af]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-[#1e40af]'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.name}
              onClick={() => setSelectedMaterial(mat)}
              className="group bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:border-blue-400/50 hover:bg-white hover:shadow-2xl hover:-translate-y-1 active:scale-95 animate-in fade-in zoom-in-95 duration-200"
            >
              <MaterialSwatch mat={mat} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-slate-900 mb-1 truncate uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                  {mat.name}
                </div>
                <div className="text-[10px] font-bold text-blue-200 truncate opacity-80">
                  {mat.thicknesses}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 text-blue-100 group-hover:text-white" />
              </div>
            </div>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-blue-200 font-bold uppercase tracking-widest">
              No materials found for this search
            </p>
          </div>
        )}
      </div>

      {selectedMaterial && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
            onClick={() => {
              setSelectedMaterial(null);
              setSelectedCoating(undefined);
            }}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-10">
                <button
                  onClick={() => {
                    setSelectedMaterial(null);
                    setSelectedCoating(undefined);
                  }}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6 text-blue-100" />
                </button>
                <div
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 text-slate-700`}
                >
                  {selectedMaterial.category}
                </div>
              </div>

              <div className="flex items-center gap-6 mb-12">
                <div className="w-24 h-24 relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <MaterialSwatch mat={selectedMaterial} overrideColor={selectedCoating} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight mb-2">
                    {selectedMaterial.name}
                  </h3>
                  <div className="flex items-center gap-2 text-blue-600 font-mono text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" /> In Stock & Verified
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {selectedMaterial.notes && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <h4 className="text-[10px] font-black text-[#2F5FA7] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      PROCESS NOTES
                    </h4>
                    <p className="text-xs font-bold text-[#1E3A66] leading-relaxed">
                      {selectedMaterial.notes}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-black text-blue-100 uppercase tracking-[0.2em] mb-4">
                    SPECIFICATIONS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { l: 'Thickness', v: selectedMaterial.thicknesses },
                      { l: 'Lead Time', v: '3-5 Days' },
                      { l: 'Sourcing', v: 'Industrial' },
                      { l: 'Quality', v: 'Verified' },
                    ].map((p) => (
                      <div
                        key={p.l}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
                      >
                        <div className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mb-1">
                          {p.l}
                        </div>
                        <div className="text-xs font-bold text-slate-700">{p.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black text-blue-100 uppercase tracking-[0.2em] mb-4">
                    COMPATIBILITY
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaterial.processes.map((proc: string) => (
                      <div
                        key={proc}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {proc}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10">
                  <Button
                    onClick={handleQuoteClick}
                    className="w-full h-16 bg-blue-600 hover:bg-[#1E3A66] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 group"
                  >
                    Get Quote with this Material{' '}
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
