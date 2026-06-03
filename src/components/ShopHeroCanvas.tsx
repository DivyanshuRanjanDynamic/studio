'use client';

import { useEffect, useRef } from 'react';
import { ScrollReveal } from '@/components/ScrollReveal';

export function ShopHeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = 0,
      H = 0,
      t = 0;
    let raf: number;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      canvas!.width = parent.clientWidth;
      canvas!.height = parent.clientHeight;
      W = canvas!.width;
      H = canvas!.height;
    }

    function drawBearing(x: number, y: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Outer ring
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Balls
      const ballCount = 8;
      for (let i = 0; i < ballCount; i++) {
        const angle = (i * Math.PI * 2) / ballCount;
        const bx = Math.cos(angle) * radius * 0.8;
        const by = Math.sin(angle) * radius * 0.8;

        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(bx, by, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Blueprint lines
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(-radius * 1.5, 0);
      ctx.lineTo(radius * 1.5, 0);
      ctx.moveTo(0, -radius * 1.5);
      ctx.lineTo(0, radius * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }

    function drawGear(x: number, y: number, radius: number, rotation: number, teeth: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let i = 0; i < teeth * 2; i++) {
        const angle = (i * Math.PI) / teeth;
        const r = i % 2 === 0 ? radius : radius * 0.85;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Cross lines
      ctx.beginPath();
      ctx.moveTo(-radius * 0.3, 0);
      ctx.lineTo(radius * 0.3, 0);
      ctx.moveTo(0, -radius * 0.3);
      ctx.lineTo(0, radius * 0.3);
      ctx.stroke();

      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Technical Grid
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      for (let i = 0; i < H; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }

      const centerX = W * 0.5;
      const centerY = H * 0.5;

      // Draw multiple components in a layout
      drawBearing(centerX - 60, centerY - 40, 50, t * 0.5);
      drawGear(centerX + 80, centerY + 30, 60, -t * 0.3, 12);
      drawBearing(centerX + 120, centerY - 80, 30, t * 1.2);

      // Connection lines
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX - 60, centerY - 40);
      ctx.lineTo(centerX + 80, centerY + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      t += 0.01;
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <ScrollReveal variant="fade-in" duration={1200} className="w-full h-full">
      <canvas ref={ref} className="w-full h-full opacity-40" />
    </ScrollReveal>
  );
}
