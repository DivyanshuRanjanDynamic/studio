'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PartItem {
  id: string;
  name: string;
  image: string;
}

interface CurvedPartsFlowProps {
  products?: Array<{
    id: string;
    name: string;
    images?: Array<string | { urls?: { product?: string; thumb?: string } }>;
  }>;
}

function extractImage(
  img: string | { urls?: { product?: string; thumb?: string } }
): string | null {
  if (typeof img === 'string') return img;
  return img?.urls?.product || img?.urls?.thumb || null;
}

export function CurvedPartsFlow({ products }: CurvedPartsFlowProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build parts list from real products
  const parts: PartItem[] = (() => {
    if (products && products.length > 0) {
      const mapped = products
        .filter((p) => p.images && p.images.length > 0)
        .slice(0, 10)
        .map((p) => {
          const imgSrc = extractImage(p.images![0]);
          return imgSrc ? { id: p.id, name: p.name, image: imgSrc } : null;
        })
        .filter(Boolean) as PartItem[];
      if (mapped.length >= 4) return mapped;
    }
    return [];
  })();

  if (!mounted || parts.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const loopParts = [...parts, ...parts];

  // Predefined vertical offsets to create a wave pattern (in px)
  const waveOffsets = [12, -18, 28, -8, 20, -24, 10, -14, 24, -20];
  // Predefined scale variations
  const scaleValues = [0.95, 1.05, 1.1, 0.98, 1.08, 0.92, 1.02, 1.12, 0.96, 1.06];

  return (
    <div className="relative w-full overflow-hidden py-4 md:py-8">
      {/* Scrolling parts row */}
      <div
        className="flex items-center gap-6 sm:gap-8 md:gap-10 animate-marquee-parts"
        style={{ width: 'max-content' }}
      >
        {loopParts.map((part, i) => {
          const idx = i % parts.length;
          const yOffset = waveOffsets[idx % waveOffsets.length];
          const scale = scaleValues[idx % scaleValues.length];

          return (
            <div
              key={`${part.id}-${i}`}
              className="shrink-0 transition-transform duration-700 ease-out hover:scale-110 hover:z-10"
              style={{
                transform: `translateY(${yOffset}px) scale(${scale})`,
              }}
            >
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-md overflow-hidden">
                <Image
                  src={part.image}
                  alt={part.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 160px, 176px"
                  unoptimized
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge fade gradients */}
      <div className="absolute inset-y-0 left-0 w-20 md:w-32 bg-gradient-to-r from-lp-bg to-transparent pointer-events-none z-20" />
      <div className="absolute inset-y-0 right-0 w-20 md:w-32 bg-gradient-to-l from-lp-bg to-transparent pointer-events-none z-20" />
    </div>
  );
}
