'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/utils';
import { useRouter } from 'next/navigation';

interface BlogEngagementProps {
  slug: string;
}

export function BlogEngagement({ slug }: BlogEngagementProps) {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!db) return;

    const fetchStats = async () => {
      try {
        const docRef = doc(db, 'blog_stats', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setLikes(data.likes || 0);

          // Check if current user has liked
          if (auth?.currentUser) {
            const likedBy = data.likedBy || [];
            setIsLiked(likedBy.includes(auth.currentUser.uid));
          }
        }
      } catch (error) {
        console.error('Error fetching blog stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [db, slug, auth?.currentUser]);

  const handleLike = async () => {
    if (!auth?.currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'You must be signed in to like a post.',
        variant: 'destructive',
      });
      // Optional: redirect to login
      router.push('/login');
      return;
    }

    if (isSubmitting || !db) return;

    setIsSubmitting(true);
    const docRef = doc(db, 'blog_stats', slug);
    const userId = auth.currentUser.uid;

    try {
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // First interaction, create document
        await setDoc(docRef, {
          likes: 1,
          likedBy: [userId],
        });
        setLikes(1);
        setIsLiked(true);
      } else {
        // Document exists, update it
        if (isLiked) {
          // Unlike
          await updateDoc(docRef, {
            likes: increment(-1),
            likedBy: arrayRemove(userId),
          });
          setLikes((l) => Math.max(0, l - 1));
          setIsLiked(false);
        } else {
          // Like
          await updateDoc(docRef, {
            likes: increment(1),
            likedBy: arrayUnion(userId),
          });
          setLikes((l) => l + 1);
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      toast({
        title: 'Action Failed',
        description: 'Could not update your like. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-slate-100" />
        <div className="w-16 h-4 bg-slate-100 rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-6 border-t border-slate-200 mt-12">
      <button
        onClick={handleLike}
        disabled={isSubmitting}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 group focus:outline-none focus:ring-2 disabled:opacity-50',
          isLiked
            ? 'bg-red-50 border-red-200 text-red-500 focus:ring-red-500/50'
            : 'bg-white border-slate-200 text-blue-200 hover:bg-slate-50 hover:text-[#1E3A66] focus:ring-[#2F5FA7]/50'
        )}
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-all duration-300',
            isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'
          )}
        />
        <span className="font-semibold text-sm text-[#1E3A66]">
          {likes} {likes === 1 ? 'Like' : 'Likes'}
        </span>
      </button>
      <p className="text-sm text-blue-200 font-medium hidden sm:block">
        Did you find this article helpful?
      </p>
    </div>
  );
}
