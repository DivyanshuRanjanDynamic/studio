'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FlatPattern, FlatPatternBendLine } from '@/types/viewer';
import {
  CornerUpRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Crosshair,
} from 'lucide-react';

interface FlatPatternViewerProps {
  flatPattern: FlatPattern;
  className?: string;
  hoveredBendIndex?: number;
  onBendHover?: (index: number | undefined) => void;
  showBendLines?: boolean;
}

export function FlatPatternViewer({
  flatPattern,
  className = '',
  hoveredBendIndex,
  onBendHover,
  showBendLines = true,
}: FlatPatternViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [internalHovered, setInternalHovered] = useState<number | undefined>(undefined);
  const [bendsVisible, setBendsVisible] = useState(true);

  const activeHovered = hoveredBendIndex !== undefined ? hoveredBendIndex : internalHovered;

  // ── Zoom Controls ──
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.3, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.3, 0.2));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ── Mouse Wheel Zoom ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.2, Math.min(8, z * delta)));
  }, []);

  // ── Pan (drag) ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // ── Build SVG with interactive bend lines ──
  const svgContent = useMemo(() => {
    if (!flatPattern?.svg) return '';

    // If we don't need to overlay interactive bend lines, return base SVG
    if (!showBendLines || !bendsVisible) {
      // Strip existing bend lines from SVG (they're baked in by the server)
      // and return the outline only
      return flatPattern.svg
        .replace(/<line[^>]*data-angle[^>]*\/>/g, '')
        .replace(/<\/svg>/, '</svg>');
    }

    return flatPattern.svg;
  }, [flatPattern, showBendLines, bendsVisible]);

  // ── Bend Summary Stats ──
  const bendStats = useMemo(() => {
    const lines = flatPattern?.bendLines || [];
    const upCount = lines.filter((l) => l.direction === 'UP').length;
    const downCount = lines.filter((l) => l.direction === 'DOWN').length;
    const angles = lines.map((l) => l.angle);
    const minAngle = angles.length > 0 ? Math.min(...angles) : 0;
    const maxAngle = angles.length > 0 ? Math.max(...angles) : 0;
    return { total: lines.length, upCount, downCount, minAngle, maxAngle };
  }, [flatPattern]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#0f172a] rounded-xl overflow-hidden group select-none ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* ── SVG Render Layer ── */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* ── Hover Overlays (rendered outside SVG for crisp React-controlled tooltips) ── */}
      {showBendLines && bendsVisible && flatPattern?.bendLines?.map((line, idx) => {
        const isHovered = activeHovered === idx;
        if (!isHovered) return null;

        // Map SVG coordinates to screen position (approximate center of line)
        const vb = flatPattern.viewBox;
        const cx = ((line.x1 + line.x2) / 2 - vb.minX) / vb.width;
        const cy = ((line.y1 + line.y2) / 2 - vb.minY) / vb.height;

        return (
          <div
            key={idx}
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${cx * 100}%`,
              top: `${cy * 100}%`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) translate(-50%, -120%)`,
            }}
          >
            <div className="bg-slate-900/92 border border-slate-700 px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-mono font-semibold text-white">{line.angle.toFixed(1)}°</span>
                <span className={`${line.direction === 'UP' ? 'text-blue-400' : 'text-orange-400'} font-medium`}>
                  {line.direction}
                </span>
                <span className="font-mono text-slate-400">R{line.radius.toFixed(1)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Interactive Bend Line Hit Targets ── */}
      {showBendLines && bendsVisible && flatPattern?.bendLines?.map((line, idx) => {
        const vb = flatPattern.viewBox;
        // Normalized positions [0, 1]
        const x1n = (line.x1 - vb.minX) / vb.width;
        const y1n = (line.y1 - vb.minY) / vb.height;
        const x2n = (line.x2 - vb.minX) / vb.width;
        const y2n = (line.y2 - vb.minY) / vb.height;

        const cxn = (x1n + x2n) / 2;
        const cyn = (y1n + y2n) / 2;
        const length = Math.sqrt((x2n - x1n) ** 2 + (y2n - y1n) ** 2);
        const angle = Math.atan2(y2n - y1n, x2n - x1n) * (180 / Math.PI);

        return (
          <div
            key={`hit-${idx}`}
            className="absolute z-20"
            style={{
              left: `${cxn * 100}%`,
              top: `${cyn * 100}%`,
              width: `${length * 100}%`,
              height: '16px',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) translate(-50%, -50%) rotate(${angle}deg)`,
              transformOrigin: 'center center',
              cursor: 'help',
            }}
            onMouseEnter={() => {
              setInternalHovered(idx);
              onBendHover?.(idx);
            }}
            onMouseLeave={() => {
              setInternalHovered(undefined);
              onBendHover?.(undefined);
            }}
          />
        );
      })}

      {/* ── Top-Left: Badge ── */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-[#2F5FA7] border px-3 py-1.5 rounded-lg border-[#2F5FA7] shadow-lg shadow-blue-500/20">
          <p className="text-[10px] font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            2D Flat Pattern
          </p>
        </div>
      </div>

      {/* ── Bottom-Left: Bend Summary ── */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 px-3 py-2 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500 rounded-full" />
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                UP: {bendStats.upCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-orange-500 rounded-full border-dashed" style={{
                borderTop: '2px dashed #F97316',
                height: 0,
                width: 16,
                backgroundColor: 'transparent'
              }} />
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">
                DOWN: {bendStats.downCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Zoom Controls ── */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-10">
        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="px-3 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border-b border-slate-700/50"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="px-3 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border-b border-slate-700/50"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border-b border-slate-700/50"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBendsVisible((v) => !v)}
            className="px-3 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {bendsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Bottom-Right: Zoom Level ── */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/30 px-2.5 py-1 rounded-lg">
          <span className="text-[9px] font-mono font-bold text-slate-500">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
