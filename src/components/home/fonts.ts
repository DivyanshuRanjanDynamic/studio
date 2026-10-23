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
});

export const instrumentSerif = localFont({
  src: [
    { path: './fonts/instrument-serif-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/instrument-serif-italic-latin.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--lp-font-serif',
  display: 'swap',
});

export const landingFontVars = `${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`;
