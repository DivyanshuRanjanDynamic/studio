'use client';

import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/firestore/use-firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemoFirebase } from '@/firebase/provider';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { CartItem } from './CartContext';

/**
 * Keeps a signed-in user's cart in sync with users/{uid}.cart. CartProvider loads
 * this with next/dynamic only once someone is signed in, so signed-out visitors
 * never download the Firestore SDK.
 */
export default function CartCloudSync({
  uid,
  items,
  isInitialized,
  onCloudCart,
}: {
  uid: string;
  items: CartItem[];
  isInitialized: boolean;
  /** Called once, before initialization, with the saved cart (or null if none). */
  onCloudCart: (cart: CartItem[] | null) => void;
}) {
  const db = useFirestore();
  const userDocRef = useMemoFirebase(() => doc(db, 'users', uid), [db, uid]);
  const { data: userData } = useDoc(userDocRef);

  // Load from Firestore only ONCE on initialization
  useEffect(() => {
    if (userData && !isInitialized) {
      onCloudCart(Array.isArray(userData.cart) ? userData.cart : null);
    }
  }, [userData, isInitialized, onCloudCart]);

  // Sync with Firestore ONLY after initialization to prevent overwriting cloud with empty local state too early
  useEffect(() => {
    if (isInitialized) {
      setDocumentNonBlocking(doc(db, 'users', uid), { cart: items }, { merge: true });
    }
  }, [items, uid, db, isInitialized]);

  return null;
}
