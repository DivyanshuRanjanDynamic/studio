'use client';

import React from 'react';
import { cn } from '@/utils';

// ── Industrial Keyframes ──────────────────────────────────
const KEYFRAMES = `
@keyframes conveyor-belt {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-120px); }
}

@keyframes claw-down {
  0%, 15%   { transform: translateY(0); }
  35%, 55%  { transform: translateY(12px); }
  85%, 100% { transform: translateY(0); }
}

@keyframes gripper-l {
  0%, 45%   { transform: rotate(0deg); }
  50%, 65%  { transform: rotate(-45deg); }
  75%, 100% { transform: rotate(0deg); }
}

@keyframes gripper-r {
  0%, 45%   { transform: rotate(0deg); }
  50%, 65%  { transform: rotate(45deg); }
  75%, 100% { transform: rotate(0deg); }
}

@keyframes part-fall {
  0%, 47%   { transform: translateY(0); opacity: 0; }
  48%       { opacity: 1; }
  65%, 100% { transform: translateY(52px); opacity: 0; }
}

@keyframes flap-left {
  0%, 65%   { transform: rotate(0deg); }
  85%, 100% { transform: rotate(120deg); }
}

@keyframes flap-right {
  0%, 65%   { transform: rotate(0deg); }
  85%, 100% { transform: rotate(-120deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.1); }
}

.box-loop {
  animation: conveyor-belt 2.5s linear infinite;
}

.claw-loop {
  animation: claw-down 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.gripper-l-loop {
  transform-origin: center top;
  animation: gripper-l 2.5s ease infinite;
}

.gripper-r-loop {
  transform-origin: center top;
  animation: gripper-r 2.5s ease infinite;
}

.part-loop {
  animation: part-fall 2.5s cubic-bezier(0.5, 0, 0.75, 0) infinite;
}

.flap-l-loop {
  animation: flap-left 2.5s ease-in-out infinite;
}

.flap-r-loop {
  animation: flap-right 2.5s ease-in-out infinite;
}
`;

interface MechHubLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const SIZES = {
  sm: { scale: 0.7, height: 90, width: 150 },
  md: { scale: 1.00, height: 110, width: 250 },
  lg: { scale: 1.6, height: 180, width: 420 },
};

export function MechHubLoader({
  size = 'md',
  variant = 'light',
  text = 'Processing',
  className,
  fullScreen = false,
}: MechHubLoaderProps) {
  const s = SIZES[size];
  const isDark = variant === 'dark';

  const colorMain = isDark ? '#94A3B8' : '#1E293B';
  const colorPart = '#FF8A00';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 select-none',
        fullScreen && 'fixed inset-0 z-[9999]',
        fullScreen && (isDark ? 'bg-[#0f172a]' : 'bg-white/95 backdrop-blur-sm'),
        className
      )}
    >
      <style>{KEYFRAMES}</style>

      <div
        className="relative overflow-hidden flex items-center justify-center p-4 bg-transparent"
        style={{ width: s.width, height: s.height, transform: `scale(${s.scale})` }}
      >
        {/* UPPER RAIL (Dashed Industrial Track) */}
        <div
          className="absolute top-[34px] w-full h-[25px] border-t-[1.5px] border-dashed opacity-40"
          style={{ borderColor: colorMain }}
        />

        {/* CLAW ASSEMBLY */}
        <div className="absolute top-[32px] left-[150px] -ml-[20px] z-20">
          <svg width="40" height="60" viewBox="0 0 40 60" className="claw-loop" style={{ overflow: 'visible' }}>
            {/* The Arm Armature */}
            <path d="M15 0 L25 0 M20 0 L20 22" fill="none" stroke={colorMain} strokeWidth="3" strokeLinecap="round" />

            {/* Rotating Mechanical Grippers */}
            <g transform="translate(20, 22)">
              <g className="gripper-l-loop">
                <path d="M-2 0 Q-12 0 -10 14" fill="none" stroke={colorMain} strokeWidth="3" strokeLinecap="round" />
              </g>
              <g className="gripper-r-loop">
                <path d="M2 0 Q 12 0 10 14" fill="none" stroke={colorMain} strokeWidth="3" strokeLinecap="round" />
              </g>
            </g>

            {/* Industrial Part (Orange Core) */}
            <rect
              x="15"
              y="22"
              width="10"
              height="10"
              rx="2"
              fill={colorPart}
              className="part-loop shadow-2xl"
            />
          </svg>
        </div>

        {/* LOWER CONVEYOR SURFACE (Dashed) */}
        <div
          className="absolute bottom-[32px] w-full h-[0px] border-t-[1.5px] border-dashed opacity-20"
          style={{ borderColor: colorMain }}
        />

        {/* BOXES LOOP */}
        <div className="absolute bottom-[32px] left-[30px] flex box-loop" style={{ width: '600px' }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const isFillingBox = i === 1;
            const isClosedBox = i === 0;

            return (
              <div key={i} className="relative w-[120px] h-[70px] flex flex-col items-center justify-end">
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
                  {/* High-fidelity Box Core */}
                  <path
                    d="M15 50 L55 50 L55 70 L15 70 Z"
                    fill="none"
                    stroke={colorMain}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />

                  {/* Reactive Flap Packaging (Solid Polygons) */}
                  {isClosedBox ? (
                    <g>
                      {/* Fully Closed Flaps */}
                      <path d="M15 50 L35 53 L55 50" fill={colorMain} fillOpacity="0.1" stroke={colorMain} strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="15" y1="50" x2="55" y2="50" stroke={colorMain} opacity="0.3" strokeWidth="1" />
                    </g>
                  ) : (
                    <g>
                      {/* Left Polygonal Flap */}
                      <g className={isFillingBox ? 'flap-l-loop' : ''} style={{ transformOrigin: '15px 50px' }}>
                        <path d="M15 50 L2 35 L12 32 L15 50 Z" fill={colorMain} fillOpacity="0.1" stroke={colorMain} strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                      {/* Right Polygonal Flap */}
                      <g className={isFillingBox ? 'flap-r-loop' : ''} style={{ transformOrigin: '55px 50px' }}>
                        <path d="M55 50 L68 35 L58 32 L55 50 Z" fill={colorMain} fillOpacity="0.1" stroke={colorMain} strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                    </g>
                  )}
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {text && (
        <div className="space-y-2 text-center">
          <p className={cn(
            "text-[12px] font-black uppercase tracking-[0.8em] animate-pulse transition-colors duration-500",
            isDark ? "text-slate-400" : "text-slate-900"
          )}>
            {text}
          </p>
          <div className="flex justify-center gap-2.5">
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                className="w-2 h-2 rounded-full bg-orange-500/70"
                style={{ animation: `pulse 1.5s infinite ${dot * 0.2}s`, boxShadow: '0 0 10px rgba(249, 115, 22, 0.3)' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
