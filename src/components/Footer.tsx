'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const { toast } = useToast();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleWIPClick = (e: React.MouseEvent, feature: string) => {
    e.preventDefault();
    toast({
      title: 'Coming Soon!',
      description: `We're currently working on the ${feature}. Check back soon for updates!`,
    });
  };

  return (
    <footer className="bg-[#1E3A66] border-t border-white/[0.06] relative overflow-hidden">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />

      <div className="border-b border-white/[0.05] py-10 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-8 md:gap-6 text-center lg:text-left">
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Ready to build your next part?
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href={user ? '/login' : '/login?tab=register&redirect=/dashboard'}
                className="w-full sm:w-auto"
              >
                <Button
                  className="w-full h-11 px-7 text-sm font-bold bg-white text-[#1E3A66] hover:bg-blue-50 rounded-full shadow-lg transition-all"
                  suppressHydrationWarning
                >
                  Upload Your Design <ArrowRight className="ml-1.5 w-3.5 h-3.5 inline" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => router.push('/#services')}
                className="w-full sm:w-auto h-11 px-6 text-sm border border-white/20 text-white hover:bg-white/10 rounded-full font-bold"
                suppressHydrationWarning
              >
                View Services
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main link grid */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 lg:gap-16">
          {/* Brand column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group">
              <Logo size={40} />
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">
                MechHub
              </span>
            </Link>
            <p className="text-blue-100/70 text-sm md:text-base leading-relaxed mb-8 max-w-sm font-medium">
              Real Parts . Real Engineers . Real Deadlines
            </p>
            {/* Mini trust badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2.5">
              {['NDA Signed', 'ISO-Ready', 'QC Inspected', 'On-Time Delivery'].map((b) => (
                <span
                  key={b}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10 text-white/50 bg-white/5"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 mb-5">
              Company
            </h4>
            <ul className="space-y-3 mb-6">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Contact', href: '/contact' },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-blue-100/60 hover:text-white transition-colors font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h5 className="pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 mb-3">
              Resources
            </h5>
            <ul className="space-y-3">
              {[
                { label: 'Blog', href: '/blog' },
                { label: 'Guides', href: null },
                { label: 'Documentation', href: null },
              ].map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    <Link
                      href={l.href}
                      className="text-sm text-blue-100/60 hover:text-white transition-colors font-medium"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleWIPClick(e, l.label)}
                      className="text-sm text-blue-100/60 hover:text-white transition-colors font-medium"
                    >
                      {l.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Terms of Service', href: '/terms-of-service' },
                { label: 'Refund Policy', href: '/refund-policy' },
                { label: 'NDA Policy', href: '/nda-policy' },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-blue-100/60 hover:text-white transition-colors font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.05] py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
            <span className="text-white/40 text-[11px] uppercase tracking-wider font-bold">
              © {currentYear || new Date().getFullYear()} MechHub. All rights reserved.
            </span>
            <span className="hidden md:inline text-white/10">·</span>
            <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">
              A Unit of Synchubb Innovations Pvt Ltd
            </span>
          </div>

          <div className="flex items-center gap-3">
            {[
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/company/mechhub-in/',
                path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
              },
              {
                label: 'Instagram',
                href: 'https://www.instagram.com/mechhub.in/',
                path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z',
              },
            ].map((s) => (
              <Link
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={s.path} />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
