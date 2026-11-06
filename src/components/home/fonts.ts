import localFont from 'next/font/local';

// Landing page typefaces (latin subsets, self-hosted). Exposed as CSS variables
// consumed by the `font-lp-*` Tailwind families and components/home/landing.css.
export const geist = localFont({
  src: './fonts/geist-latin.woff2',
  weight: '300 600',
  variable: '--lp-font-sans',
  display: 'swap',
});

export const geistMono = localFont({
  src: './fonts/geist-mono-latin.woff2',
  weight: '400 500',
  variable: '--lp-font-mono',
  display: 'swap',
  // Spec sheets and hero captions use it above the fold, so it is preloaded.
});

export const instrumentSerif = localFont({
  src: [
    { path: './fonts/instrument-serif-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/instrument-serif-italic-latin.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--lp-font-serif',
  display: 'swap',
  // The italic is the accent word in every hero heading, so it is preloaded.
});

export const landingFontVars = `${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`;
