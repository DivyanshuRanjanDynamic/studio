'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Download,
  Trash2,
  Layers,
  Clock,
  Zap,
  Shield,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandingNav } from '@/components/LandingNav';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useInstantQuote } from '@/hooks/use-instant-quote';
import { useQuoteCart } from '@/hooks/use-quote-cart';
import type { DFMIssue, QuantityTier } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// Instant Quote Page — File Upload → Configure → Review
// ═══════════════════════════════════════════════════

type Step = 'upload' | 'configure' | 'review';

export default function InstantQuotePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks own all state (rules.md)
  const fileUpload = useFileUpload();
  const quote = useInstantQuote(fileUpload.activeGeometry);
  const cart = useQuoteCart();

  const handleContinueToConfigure = (): void => {
    if (fileUpload.files.length > 0) {
      setStep('configure');
    }
  };

  const handleGetQuote = (): void => {
    if (quote.quoteResult && !quote.hasBlockingIssues) {
      setStep('review');
    }
  };

  const handleCopyLink = (): void => {
    if (quote.quoteResult) {
      const url = `${window.location.origin}/quote/instant?ref=${quote.quoteResult.quoteRef}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToCart = (): void => {
    if (quote.quoteResult && activeFile) {
      cart.addToCart(quote.quoteResult, activeFile.fileName);
      // Optional: show a toast or message
    }
  };

  const handleProceedToCheckout = (): void => {
    if (quote.quoteResult && activeFile) {
      cart.addToCart(quote.quoteResult, activeFile.fileName);
      router.push('/checkout');
    }
  };

  const activeFile = fileUpload.files.find((f) => f.id === fileUpload.activeFileId);

  const stepIndex = step === 'upload' ? 0 : step === 'configure' ? 1 : 2;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-600 font-sans selection:bg-blue-500/10 selection:text-blue-600 relative">
      <LandingNav />
      {/* Background dot grid */}
      <div
        className="absolute inset-0 bg-white/50"
        style={{
          backgroundImage: 'radial-gradient(#2F5FA710 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        {/* ── Header + Stepper ── */}
        <div className="mb-12">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#2F5FA7] hover:text-[#1E3A66] transition-all group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Project Hub
            </Link>
          </div>
          <h1 className="text-3xl md:text-5xl uppercase tracking-tight font-bold text-slate-900 mb-4">
            Instant Quote
          </h1>
          <p className="text-blue-200 text-lg mb-8 font-medium">
            Upload your file, configure options, get a price in seconds.
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
                style={{ width: stepIndex === 0 ? '0%' : stepIndex === 1 ? '50%' : '100%' }}
              />
            </div>
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'configure', label: 'Configure' },
              { key: 'review', label: 'Review' },
            ].map((s, i) => {
              const isActive = i === stepIndex;
              const isPast = i < stepIndex;
              return (
                <div key={s.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-500 border-2 ${
                      isActive
                        ? 'bg-blue-600 border-[#2F5FA7] text-white shadow-xl scale-110'
                        : isPast
                          ? 'bg-blue-600 border-[#2F5FA7] text-white'
                          : 'bg-white border-slate-200 text-blue-100'
                    }`}
                  >
                    {isPast ? <CheckCircle size={20} /> : <span>{i + 1}</span>}
                  </div>
                  <span
                    className={`mt-3 text-[10px] font-bold uppercase tracking-[0.2em] ${isActive || isPast ? 'text-[#2F5FA7]' : 'text-blue-100'}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ STEP 1: UPLOAD ═══ */}
        {step === 'upload' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-3xl p-16 text-center bg-white transition-all cursor-pointer group shadow-2xl relative overflow-hidden ${
                fileUpload.isDragging
                  ? 'border-[#2F5FA7] bg-blue-50/50 scale-[1.02]'
                  : fileUpload.files.length > 0
                    ? 'border-[#2F5FA7]/30 hover:border-[#2F5FA7]/50'
                    : 'border-slate-200 hover:border-[#2F5FA7]/50 hover:bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                fileUpload.setDragging(true);
              }}
              onDragLeave={() => fileUpload.setDragging(false)}
              onDrop={fileUpload.handleFileDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={fileUpload.acceptedFormats}
                multiple
                onChange={fileUpload.handleFileSelect}
              />
              <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 group-hover:bg-blue-600 transition-all shadow-lg relative z-10">
                <UploadCloud className="w-12 h-12 text-[#2F5FA7] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl uppercase tracking-tight font-bold mb-3 text-slate-900 relative z-10">
                {fileUpload.files.length > 0 ? 'Add More Files' : 'Upload CAD Files'}
              </h3>
              <p className="text-blue-100 font-bold uppercase tracking-widest mb-8 text-[11px] relative z-10">
                Drag and drop or click to upload — DXF, STEP, STP, STL
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-[10px] text-[#2F5FA7] font-bold tracking-widest uppercase relative z-10">
                {['.DXF', '.STEP', '.STP', '.STL'].map((fmt) => (
                  <span
                    key={fmt}
                    className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* File list */}
            {fileUpload.files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#2F5FA7]" />
                    <span className="text-sm font-bold text-slate-900">
                      {fileUpload.files.length} {fileUpload.files.length === 1 ? 'file' : 'files'}{' '}
                      uploaded
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {fileUpload.files.map((f) => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border transition-all cursor-pointer group shadow-sm ${
                        f.id === fileUpload.activeFileId
                          ? 'border-[#2F5FA7] ring-1 ring-[#2F5FA7]/20 shadow-md'
                          : 'border-slate-100 hover:border-blue-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileUpload.setActiveFile(f.id);
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#2F5FA7]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{f.fileName}</p>
                        <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">
                          {(f.fileSizeBytes / 1024).toFixed(0)} KB ·{' '}
                          {f.geometry
                            ? `${f.geometry.boundingBox.widthMm}×${f.geometry.boundingBox.heightMm}mm`
                            : 'Processing...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.status === 'ready' && (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        )}
                        {f.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-[#2F5FA7] animate-spin" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileUpload.removeFile(f.id);
                          }}
                          className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-8 text-[11px] font-bold tracking-widest uppercase text-blue-100">
              <span className="flex items-center gap-2.5">
                <Shield size={16} className="text-emerald-500" /> NDA Protected
              </span>
              <span className="flex items-center gap-2.5">
                <Zap size={16} className="text-[#2F5FA7]" /> Instant Price
              </span>
            </div>

            <button
              onClick={handleContinueToConfigure}
              disabled={fileUpload.files.length === 0}
              className="w-full bg-blue-600 hover:bg-[#1E3A66] disabled:opacity-40 disabled:cursor-not-allowed shadow-xl text-white font-bold tracking-widest uppercase text-[11px] py-5 px-10 rounded-2xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              Configure Quote <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ═══ STEP 2: CONFIGURE ═══ */}
        {step === 'configure' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Active file indicator */}
            {activeFile && (
              <div className="flex items-center justify-between mb-8 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <FileText size={20} className="text-[#2F5FA7]" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{activeFile.fileName}</span>
                    <span className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">
                      {activeFile.geometry
                        ? `${activeFile.geometry.boundingBox.widthMm}×${activeFile.geometry.boundingBox.heightMm}mm · ${activeFile.geometry.holeCount} holes`
                        : 'Analyzing...'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#2F5FA7] hover:text-[#1E3A66] flex items-center gap-1.5 transition-colors bg-blue-50 px-4 py-2 rounded-xl border border-blue-100"
                >
                  <X size={14} /> Change File
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Configuration Selectors */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                  {/* Material */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Material
                    </label>
                    <select
                      value={quote.state.materialId}
                      onChange={(e) => quote.setMaterialId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
                    >
                      {quote.materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.alloy})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Thickness */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Thickness
                    </label>
                    <select
                      value={quote.state.thicknessMm}
                      onChange={(e) => quote.setThicknessMm(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
                    >
                      {quote.availableThicknesses.map((t) => (
                        <option key={t} value={t}>
                          {t}mm
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Finish */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Surface Finish
                    </label>
                    <select
                      value={quote.state.finishType}
                      onChange={(e) => quote.setFinishType(e.target.value as never)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
                    >
                      {quote.availableFinishes.map((f) => (
                        <option key={f.type} value={f.type}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={quote.state.quantity}
                        onChange={(e) => quote.setQuantity(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 transition-all font-bold"
                      />
                      {quote.savingsPercent > 0 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg font-bold uppercase tracking-widest flex items-center gap-1">
                          <Zap size={10} /> {quote.savingsPercent}% off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Turnaround */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Turnaround
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {quote.turnaroundOptions.map((opt) => (
                        <button
                          key={opt.type}
                          onClick={() => quote.setTurnaround(opt.type)}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border text-center ${
                            quote.state.turnaround === opt.type
                              ? 'bg-blue-600 text-white border-[#2F5FA7] shadow-lg'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#2F5FA7]/50 hover:text-[#2F5FA7]'
                          }`}
                        >
                          <span className="block">
                            {opt.days === 0 ? 'Same Day' : `${opt.days}d`}
                          </span>
                          <span
                            className={`block mt-1 ${
                              quote.state.turnaround === opt.type
                                ? 'text-blue-200'
                                : 'text-blue-100'
                            }`}
                          >
                            {opt.multiplier === 1
                              ? 'Base'
                              : opt.multiplier < 1
                                ? `−${Math.round((1 - opt.multiplier) * 100)}%`
                                : `+${Math.round((opt.multiplier - 1) * 100)}%`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* DFM Feedback */}
                {quote.dfmIssues.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> DFM Feedback
                    </h4>
                    {quote.dfmIssues.map((issue: DFMIssue, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border ${
                          issue.blocking
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {issue.blocking ? (
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p
                              className={`text-xs font-bold ${issue.blocking ? 'text-red-700' : 'text-amber-700'}`}
                            >
                              {issue.message}
                            </p>
                            <p className="text-[10px] text-blue-200 mt-1 font-medium">
                              💡 {issue.fixSuggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA buttons */}
                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-8 py-4 rounded-2xl border border-slate-200 bg-white text-blue-100 hover:text-slate-900 hover:border-slate-400 transition-all font-bold uppercase tracking-widest text-[11px]"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleGetQuote}
                    disabled={!quote.quoteResult || quote.hasBlockingIssues || quote.isCalculating}
                    className="bg-blue-600 hover:bg-[#1E3A66] disabled:opacity-40 disabled:cursor-not-allowed shadow-xl text-white font-bold tracking-widest uppercase text-[11px] py-4 px-10 rounded-2xl transition-all flex items-center gap-2 transform active:scale-95"
                  >
                    {quote.isCalculating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Calculating...
                      </>
                    ) : (
                      <>
                        Review Quote <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Live Price Sidebar */}
              <div className="space-y-6">
                {/* Live Price Display */}
                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl sticky top-28">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7] mb-6">
                    Live Price
                  </h3>

                  {quote.isCalculating ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#2F5FA7] animate-spin" />
                    </div>
                  ) : quote.quoteResult ? (
                    <div className="space-y-6">
                      <div>
                        <p className="text-4xl font-bold text-slate-900 tracking-tighter">
                          ₹{quote.quoteResult.pricePerPart.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold mt-1">
                          per part
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
                            Total ({quote.state.quantity} pcs)
                          </span>
                          <span className="text-xl font-bold text-slate-900">
                            ₹{quote.quoteResult.totalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
                          Cost Breakdown
                        </h4>
                        {[
                          ['Material', quote.quoteResult.breakdown.materialCost],
                          ['Cutting', quote.quoteResult.breakdown.cutCost],
                          ['Setup', quote.quoteResult.breakdown.setupCost],
                          ['Finish', quote.quoteResult.breakdown.finishCost],
                        ].map(([label, cost]) => (
                          <div key={label as string} className="flex justify-between text-xs">
                            <span className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">
                              {label}
                            </span>
                            <span className="text-slate-900 font-bold font-mono">
                              ₹
                              {(cost as number).toLocaleString('en-IN', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        ))}
                        <div className="h-px bg-slate-100 my-2" />
                        <div className="flex justify-between text-xs">
                          <span className="text-[#2F5FA7] font-bold uppercase tracking-widest text-[10px]">
                            Qty Discount
                          </span>
                          <span className="text-emerald-600 font-bold">
                            −
                            {Math.round((1 - quote.quoteResult.breakdown.quantityMultiplier) * 100)}
                            %
                          </span>
                        </div>
                        {quote.quoteResult.breakdown.rushMultiplier !== 1 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#2F5FA7] font-bold uppercase tracking-widest text-[10px]">
                              Rush Fee
                            </span>
                            <span className="text-amber-600 font-bold">
                              +{Math.round((quote.quoteResult.breakdown.rushMultiplier - 1) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lead time */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <Clock className="w-4 h-4 text-[#2F5FA7]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#2F5FA7]">
                          Est.{' '}
                          {quote.quoteResult.leadTimeDays === 0
                            ? 'Same Day'
                            : `${quote.quoteResult.leadTimeDays} Day${quote.quoteResult.leadTimeDays > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  ) : quote.error ? (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                      <p className="text-xs text-red-600 font-bold">{quote.error}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-100 py-12 text-center">
                      Upload a file to see live pricing
                    </p>
                  )}
                </div>

                {/* Tier Pricing Table */}
                {quote.tierPricing.length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 mb-4">
                      Tier Pricing
                    </h4>
                    <div className="space-y-2">
                      {quote.tierPricing.slice(0, 6).map((tier: QuantityTier) => (
                        <div
                          key={tier.quantity}
                          className={`flex justify-between items-center py-2 px-3 rounded-xl text-xs ${
                            tier.quantity === quote.state.quantity
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`font-bold ${tier.quantity === quote.state.quantity ? 'text-blue-100' : 'text-blue-100'} uppercase tracking-widest text-[10px]`}
                          >
                            {tier.quantity} pc{tier.quantity > 1 ? 's' : ''}
                          </span>
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-bold font-mono ${tier.quantity === quote.state.quantity ? 'text-white' : 'text-slate-900'}`}
                            >
                              ₹{tier.pricePerPart.toLocaleString('en-IN')}
                            </span>
                            {tier.savingsPercent > 0 && (
                              <span
                                className={`text-[9px] font-bold ${tier.quantity === quote.state.quantity ? 'text-blue-200' : 'text-emerald-500'}`}
                              >
                                −{tier.savingsPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: REVIEW ═══ */}
        {step === 'review' && quote.quoteResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
            {/* Main quote panel */}
            <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl overflow-hidden relative">
              {/* Header */}
              <div className="px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 bg-slate-50/30">
                <div>
                  <h2 className="text-2xl uppercase tracking-tight font-bold text-slate-900">
                    Your Quote
                  </h2>
                  <p className="text-[10px] text-blue-100 mt-1 uppercase tracking-[0.2em] font-bold">
                    Valid for 15 minutes · {activeFile?.fileName}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
                  <span className="text-[10px] text-[#2F5FA7] font-bold uppercase tracking-widest">
                    Quote Ref
                  </span>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    {quote.quoteResult.quoteRef}
                  </span>
                </div>
              </div>

              {/* Price display */}
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-10 flex flex-col justify-center bg-white">
                  <div className="mb-2">
                    <span className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 block">
                      ₹{quote.quoteResult.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-100 flex items-center gap-2 uppercase tracking-widest font-bold mt-4">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Total for{' '}
                    {quote.state.quantity} parts · ₹
                    {quote.quoteResult.pricePerPart.toLocaleString('en-IN')}/part
                  </p>
                </div>

                {/* Spec snapshot */}
                <div className="w-full md:w-96 p-10 bg-slate-50/50 flex flex-col justify-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7] mb-6">
                    Specification
                  </h4>
                  <ul className="space-y-4">
                    {[
                      [
                        'Material',
                        quote.materials.find((m) => m.id === quote.state.materialId)?.name ?? '',
                      ],
                      ['Thickness', `${quote.state.thicknessMm}mm`],
                      [
                        'Finish',
                        quote.availableFinishes.find((f) => f.type === quote.state.finishType)
                          ?.label ?? 'None',
                      ],
                      ['Quantity', `${quote.state.quantity} pcs`],
                      [
                        'Turnaround',
                        quote.turnaroundOptions.find((t) => t.type === quote.state.turnaround)
                          ?.label ?? '',
                      ],
                    ].map(([lbl, val]) => (
                      <li key={lbl} className="flex justify-between items-center">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-blue-100">
                          {lbl}
                        </span>
                        <span className="text-xs font-bold text-slate-900 text-right">{val}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-white">
                <div className="p-8 flex flex-col items-center sm:items-start group hover:bg-slate-50 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-3">
                    Per Part
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{quote.quoteResult.pricePerPart.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-8 flex flex-col items-center sm:items-start group hover:bg-slate-50 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-3">
                    Quantity
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {quote.state.quantity}{' '}
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">
                      Units
                    </span>
                  </p>
                </div>
                <div className="p-8 flex flex-col items-center sm:items-start relative overflow-hidden group hover:bg-blue-600 transition-all duration-500">
                  <div className="absolute inset-0 bg-[#2F5FA7]/5 group-hover:bg-blue-600 transition-colors" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2F5FA7] mb-3 relative z-10 group-hover:text-blue-100">
                    Lead Time
                  </p>
                  <p className="text-3xl font-bold text-slate-900 relative z-10 group-hover:text-white transition-colors">
                    {quote.quoteResult.leadTimeDays === 0
                      ? 'Same Day'
                      : quote.quoteResult.leadTimeDays}{' '}
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1 group-hover:text-blue-200">
                      {quote.quoteResult.leadTimeDays > 0 ? 'Days' : ''}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-blue-600 border border-[#2F5FA7] p-10 rounded-3xl flex flex-col xl:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
              <div
                className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative z-10">
                <p className="text-[10px] text-blue-200 uppercase tracking-[0.3em] font-bold mb-2">
                  Ready to order?
                </p>
                <p className="text-sm text-white max-w-sm uppercase tracking-widest leading-relaxed font-bold">
                  Proceed to checkout to lock this price and start manufacturing.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-end w-full xl:w-auto relative z-10">
                <button
                  onClick={handleCopyLink}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Share Quote'}
                </button>
                <button
                  onClick={() => setStep('configure')}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all"
                >
                  Edit Config
                </button>
                <button
                  onClick={handleAddToCart}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <UploadCloud size={14} /> Add to Cart ({cart.itemCount})
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  className="px-10 py-4 rounded-2xl bg-white text-[#2F5FA7] font-bold uppercase tracking-widest text-[10px] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-3"
                >
                  Proceed to Checkout <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom select arrow styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-select {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394A3B8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 1rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
          }
        `,
        }}
      />
    </div>
  );
}
