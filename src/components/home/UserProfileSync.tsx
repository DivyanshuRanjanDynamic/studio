'use client';

import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/firestore/use-firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemoFirebase } from '@/firebase/provider';

export interface NavProfile {
  fullName?: string;
  role?: string;
}

/**
 * Subscribes to users/{uid} and reports it to HomeNav. Loaded with next/dynamic
 * only for signed-in users, so signed-out visitors never download Firestore.
 */
export default function UserProfileSync({
  uid,
  onProfile,
}: {
  uid: string;
  onProfile: (profile: NavProfile | null) => void;
}) {
  const db = useFirestore();
  const userProfileRef = useMemoFirebase(() => doc(db, 'users', uid), [db, uid]);
  const { data: profile } = useDoc<NavProfile>(userProfileRef);

  useEffect(() => {
    onProfile(profile);
  }, [profile, onProfile]);

  return null;
}
