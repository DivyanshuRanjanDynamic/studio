'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface BlogCommentsProps {
  slug: string;
}

interface Comment {
  id: string;
  slug: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date | null;
}

export function BlogComments({ slug }: BlogCommentsProps) {
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile name specifically for comments
  const fetchUserName = async (uid: string) => {
    if (!db) return 'User';
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data.fullName || data.companyName || 'User';
      }
    } catch (e) {
      console.error('Error fetching user name:', e);
    }
    return 'User';
  };

  useEffect(() => {
    if (!db) return;

    const commentsRef = collection(db, 'blog_comments');
    const q = query(commentsRef, where('slug', '==', slug));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            slug: data.slug,
            userId: data.userId,
            userName: data.userName || 'User',
            content: data.content,
            createdAt: data.createdAt?.toDate() || null,
          };
        });

        // Sort comments client-side to avoid needing a composite index
        fetchedComments.sort((a, b) => {
          const timeA = a.createdAt?.getTime() || 0;
          const timeB = b.createdAt?.getTime() || 0;
          return timeB - timeA;
        });

        setComments(fetchedComments);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth?.currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'You must be signed in to post a comment.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const userName = await fetchUserName(auth.currentUser.uid);

      await addDoc(collection(db!, 'blog_comments'), {
        slug,
        userId: auth.currentUser.uid,
        userName,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      setNewComment('');
      toast({
        title: 'Success',
        description: 'Your comment has been posted.',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!db || !auth?.currentUser) return;

    try {
      await deleteDoc(doc(db, 'blog_comments', commentId));
      toast({
        title: 'Deleted',
        description: 'Your comment was removed.',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mt-16 pt-8 border-t border-slate-200">
      <div className="flex items-center gap-3 mb-8 text-[#1E3A66]">
        <MessageSquare className="w-6 h-6 text-[#2F5FA7]" />
        <h3 className="text-2xl font-bold font-heading">Discussion ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      <div className="mb-12">
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this topic..."
                className="w-full min-h-[120px] bg-white border border-slate-200 rounded-xl p-4 text-[#1E3A66] placeholder:text-blue-100 focus:outline-none focus:ring-2 focus:ring-[#2F5FA7]/50 resize-y"
                required
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-[#2F5FA7] rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Post Comment
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-[#2F5FA7]/5 border border-[#2F5FA7]/20 rounded-xl p-6 text-center space-y-4">
            <p className="text-blue-200">
              Join the discussion by logging in to your MechHub account.
            </p>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="bg-transparent border-[#2F5FA7]/30 text-[#2F5FA7] hover:bg-[#2F5FA7]/10"
            >
              Log in to comment
            </Button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                <div className="space-y-3 w-full">
                  <div className="w-32 h-4 bg-slate-100 rounded" />
                  <div className="w-full h-16 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-blue-200 text-center italic py-8 border border-dashed border-slate-200 rounded-xl">
            No comments yet. Be the first to start the discussion!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              {/* Avatar */}
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#2F5FA7] to-cyan-400 flex items-center justify-center text-sm font-bold text-white uppercase shadow-inner border border-blue-100">
                {comment.userName.charAt(0)}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1E3A66] text-sm">{comment.userName}</span>
                    <span className="text-xs text-blue-100">
                      {comment.createdAt
                        ? formatDistanceToNow(comment.createdAt, { addSuffix: true })
                        : 'Just now'}
                    </span>
                  </div>

                  {/* Delete Button (Only for owner) */}
                  {user && user.uid === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-blue-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
