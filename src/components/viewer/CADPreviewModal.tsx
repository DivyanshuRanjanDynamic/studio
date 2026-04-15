'use client';

import { useState, useRef, useEffect } from 'react';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
   RotateCcw,
   Home,
   Box,
   Scaling,
   ZoomIn,
   ZoomOut,
   X,
   Loader2,
   Layers
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { STLViewer, STLViewerHandle } from './STLViewer';
import { ConversionResult } from '@/types/viewer';
import { detectDesignPattern } from '@/utils/design-patterns';

interface CADPreviewModalProps {
   isOpen: boolean;
   onClose: () => void;
   stlBuffer: ArrayBuffer | null;
   result: ConversionResult | null;
   fileName?: string;
   isConverting?: boolean;
}

/**
 * Premium 3D CAD Preview Modal
 * Features 'CAD Intelligence' for automatic 2D/3D mode detection.
 */
export function CADPreviewModal({
   isOpen,
   onClose,
   stlBuffer,
   result,
   fileName,
   isConverting
}: CADPreviewModalProps) {
   const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
   const [supportsBoth, setSupportsBoth] = useState(false);
   const viewerRef = useRef<STLViewerHandle>(null);

   // CAD Intelligence: Auto-detect design pattern on load
   useEffect(() => {
      if (result?.boundingBox) {
         const analysis = detectDesignPattern(result.boundingBox);
         setViewMode(analysis.recommendedMode);
         setSupportsBoth(analysis.supportsBoth);
      }
   }, [result]);

   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="max-w-[95vw] w-[1400px] h-[85vh] p-0 overflow-hidden bg-white border-0 shadow-2xl">
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 h-14 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                     <Box className="w-4 h-4 text-[#2F5FA7]" />
                  </div>
                  <div>
                     <DialogTitle className="text-xs font-black uppercase tracking-widest text-slate-900 leading-none mb-1">
                        Design Preview
                     </DialogTitle>
                     <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[300px]">
                        {fileName || 'CAD Geometry'}
                     </DialogDescription>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full mr-4">
                     <div className={`w-1.5 h-1.5 rounded-full ${result?.boundingBox ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        {result?.boundingBox ? 'Geometric Analysis Active' : 'Analyzing geometry...'}
                     </span>
                  </div>

                  <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                     onClick={onClose}
                  >
                     <X className="w-4 h-4" />
                  </Button>
               </div>
            </div>

            {/* ── Interaction Area ─────────────────────────────────────────────── */}
            <div className="relative w-full h-full pt-14 flex overflow-hidden">

               {/* Main Viewer Canvas */}
               <div className="flex-1 bg-slate-50 relative flex items-center justify-center">
                  {isConverting || !stlBuffer ? (
                     <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                        <div className="relative">
                           <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                           <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-[#2F5FA7] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                           <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-slate-200 animate-pulse" />
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                              {isConverting ? 'Processing Geometry' : 'Initializing Viewer'}
                           </p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              Preparing industrial-grade 3D model...
                           </p>
                        </div>
                     </div>
                  ) : (
                     <>
                        <STLViewer
                           ref={viewerRef}
                           buffer={stlBuffer}
                           className="w-full h-full"
                           initialMode={viewMode}
                        />

                        {/* SendCutSend Style Floating Toggle */}
                        {supportsBoth && (
                           <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
                              <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-full p-1.5 flex items-center gap-1">
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 px-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === '3D' ? 'bg-[#2F5FA7] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                    onClick={() => setViewMode('3D')}
                                 >
                                    3D View
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 px-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === '2D' ? 'bg-[#2F5FA7] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                    onClick={() => setViewMode('2D')}
                                 >
                                    2D Profile
                                 </Button>
                                 <div className="w-px h-5 bg-slate-200 mx-1" />
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 flex items-center gap-2"
                                 >
                                    <Layers className="w-3.5 h-3.5" />
                                    Tools
                                 </Button>
                              </div>
                           </div>
                        )}

                        {/* Dynamic View Indicator (ViewCube Placeholder) */}
                        <div className="absolute top-6 right-6 w-20 h-20 bg-white/40 border border-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-sm">
                           <div className="w-12 h-12 border-2 border-dashed border-slate-400/40 rounded-lg rotate-12 flex items-center justify-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                 {viewMode === '2D' ? 'Profile' : 'Perspective'}
                              </span>
                           </div>
                        </div>

                        {/* Footer Interaction Overlay */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl p-3 px-6 min-w-[550px] z-20">
                           <div className="flex items-center gap-4 pr-6 border-r border-slate-100">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dimensions</span>
                                 <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap">
                                    {result?.boundingBox?.x ?? 0} × {result?.boundingBox?.y ?? 0} × {result?.boundingBox?.z ?? 0} mm
                                 </span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mesh</span>
                                 <span className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap">
                                    {result?.triangleCount ?? 0} Facets
                                 </span>
                              </div>
                           </div>

                           <div className="flex items-center gap-2 pr-6 border-r border-slate-100">
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-10 w-10 rounded-2xl bg-blue-50 text-[#2F5FA7] hover:bg-blue-100 shadow-sm border border-blue-100/50"
                                 title="Reset View"
                                 onClick={() => viewerRef.current?.resetView()}
                              >
                                 <Home className="w-5 h-5" />
                              </Button>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-10 w-10 rounded-2xl hover:bg-slate-100 text-slate-600 border border-transparent hover:border-slate-200"
                                 title="Auto Fit"
                                 onClick={() => viewerRef.current?.resetView()}
                              >
                                 <Scaling className="w-5 h-5" />
                              </Button>
                           </div>

                           <div className="flex-1 flex items-center gap-4 min-w-[150px]">
                              <ZoomOut className="w-4 h-4 text-slate-400" />
                              <Slider
                                 defaultValue={[0.5]}
                                 max={1}
                                 step={0.01}
                                 onValueChange={(vals) => viewerRef.current?.setZoom(vals[0])}
                                 className="flex-1"
                              />
                              <ZoomIn className="w-4 h-4 text-slate-400" />
                           </div>
                        </div>
                     </>
                  )}
               </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 h-14 items-center justify-end px-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 hidden sm:flex">
               <Button
                  className="h-9 px-8 tracking-[0.2em] uppercase text-[10px] font-black bg-[#2F5FA7] hover:bg-[#1E3A66] text-white shadow-xl shadow-blue-500/20 border-none rounded-xl"
                  onClick={onClose}
               >
                  Close Viewer
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
