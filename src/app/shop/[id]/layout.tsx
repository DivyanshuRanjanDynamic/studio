import type { Metadata } from 'next';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

type ProductImage = string | { urls?: { product?: string } };

const DESCRIPTION_MAX = 155;

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

// The product page is a client component that reads Firestore in the browser, so its
// title and description are resolved here with one server-side read.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // Always set: otherwise the page inherits the /shop listing's canonical.
  const alternates = { canonical: `/shop/${id}` };

  const { adminFirestore } = getFirebaseAdmin();
  const snap = await adminFirestore?.collection('products').doc(id).get().catch(() => null);
  const product = snap?.exists ? snap.data() : null;
  if (!product?.name) {
    return { title: 'Product | MechHub Shop', alternates };
  }

  const description = truncate(
    product.description || product.specs || `${product.name}, QC-verified and ready to dispatch within 24 hours.`,
    DESCRIPTION_MAX
  );
  const firstImage = (product.images as ProductImage[] | undefined)?.[0];
  const image = typeof firstImage === 'string' ? firstImage : firstImage?.urls?.product;

  return {
    title: `${product.name} | MechHub Shop`,
    description,
    alternates,
    // Delisted products stay reachable by link but drop out of search.
    ...(product.isActive === false && { robots: { index: false } }),
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      ...(image && { images: [{ url: image, alt: product.name }] }),
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
