import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/next';

import { CartProvider } from '@/context/CartContext';
import { QuoteCartProvider } from '@/context/QuoteCartContext';
import { QuoteCartDrawer } from '@/components/QuoteCartDrawer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mechhub.in'),
  title: 'MechHub',
  description: 'A Managed Marketplace for Custom Manufacturing Needs.',
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'YOUR_VERIFICATION_CODE_HERE', // TODO: User should replace this
  },
  icons: {
    icon: [
      { url: '/mechhub-logo-small.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior lets Next.js turn smooth scrolling off during route changes
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Instrument+Serif:ital@0;1&family=Libre+Baskerville:ital,wght@0,400..700;1,400..700&family=Lobster+Two:ital,wght@0,400;0,700;1,400;1,700&family=Lora:ital,wght@0,400..700;1,400..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
      </head>
      <body
        className="font-body antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <FirebaseClientProvider>
          <CartProvider>
            <QuoteCartProvider>
              {children}
              <QuoteCartDrawer />
              <Toaster />
            </QuoteCartProvider>
          </CartProvider>
        </FirebaseClientProvider>
        {/* Vercel Analytics only exists on Vercel. On Firebase App Hosting its script
            (/_vercel/insights/script.js) 404s and logs an error on every page. */}
        {process.env.VERCEL === '1' && <Analytics />}
        <Script
          id="json-ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'MechHub',
              url: 'https://www.mechhub.in',
              logo: 'https://www.mechhub.in/mechhub.png',
              sameAs: [
                'https://www.instagram.com/mechhub.in',
                'https://www.linkedin.com/company/mechhub',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                areaServed: 'IN',
                availableLanguage: 'en',
              },
            }),
          }}
        />
        <Script
          id="json-ld-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              url: 'https://www.mechhub.in',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.mechhub.in/shop?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <Script
          id="json-ld-breadcrumb"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://www.mechhub.in',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Shop',
                  item: 'https://www.mechhub.in/shop',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: 'Blog',
                  item: 'https://www.mechhub.in/blog',
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: 'Services',
                  item: 'https://www.mechhub.in/services',
                },
              ],
            }),
          }}
        />
        <Script
          id="json-ld-navigation"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: [
                {
                  '@type': 'SiteNavigationElement',
                  position: 1,
                  name: 'Shop',
                  url: 'https://www.mechhub.in/shop',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 2,
                  name: 'Blog',
                  url: 'https://www.mechhub.in/blog',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 3,
                  name: 'Manufacturing Services',
                  url: 'https://www.mechhub.in/services',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 4,
                  name: 'Material Catalog',
                  url: 'https://www.mechhub.in/materials',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 5,
                  name: 'About Us',
                  url: 'https://www.mechhub.in/about',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 6,
                  name: 'Contact',
                  url: 'https://www.mechhub.in/contact',
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
