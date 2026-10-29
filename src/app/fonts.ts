import { Cormorant_Garamond, Instrument_Serif, Libre_Baskerville, Lora } from 'next/font/google';

// Site-wide typefaces, self-hosted at build time by next/font (no render-blocking
// request to fonts.googleapis.com). Exposed as CSS variables consumed by the
// `font-body` / `font-headline` / `font-heading` / `font-libre` Tailwind families.
// The landing page uses its own set in components/home/fonts.ts.

// None are preloaded: a root-layout preload would hit every page, including the
// landing page, which uses none of them. The browser downloads each one only on
// pages that render it, and next/font's metric-matched fallback keeps the swap
// from shifting layout.

// Default body font on every non-landing page.
export const lora = Lora({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
  preload: false,
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: false,
});

export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: false,
});

export const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
  display: 'swap',
  preload: false,
});

export const siteFontVars = `${lora.variable} ${cormorantGaramond.variable} ${instrumentSerif.variable} ${libreBaskerville.variable}`;
