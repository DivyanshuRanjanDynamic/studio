import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast';
import { BlogCard } from '../BlogCard';

type PostMeta = {
  id: string;
  title: string;
  date: string;
  summary: string;
  image: string;
  slug: string;
  url: string;
  readingTime: { text: string };
  tags: string[];
  author: string;
};

export const BlogView = () => {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState<Set<string>>(new Set());
  const [sendingTest, setSendingTest] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/posts')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setPosts(data as PostMeta[]);
        else setPosts([]);
      })
      .catch(() => {
        if (!mounted) return;
        setPosts([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleTest = async (post: PostMeta) => {
    if (sendingTest.has(post.id)) return; // already sending
    setSendingTest((prev) => {
      const s = new Set(prev);
      s.add(post.id);
      return s;
    });

    try {
      const res = await fetch('/api/admin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Test dispatch failed', res.status, text);
        toast({ title: 'Test Failed', description: `Status ${res.status}`, variant: 'destructive' });
      } else {
        toast({ title: 'Test Sent', description: 'Test broadcast queued.' });
      }
    } catch (err) {
      console.error('Test dispatch error', err);
      alert('Test request failed');
    } finally {
      setSendingTest((prev) => {
        const s = new Set(prev);
        s.delete(post.id);
        return s;
      });
    }
  };

  const handleBroadcast = async (post: PostMeta) => {
    if (sendingBroadcast.has(post.id)) return; // already sending
    setSendingBroadcast((prev) => {
      const s = new Set(prev);
      s.add(post.id);
      return s;
    });

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Broadcast failed', res.status, text);
        toast({ title: 'Broadcast Failed', description: `Status ${res.status}`, variant: 'destructive' });
      } else {
        toast({ title: 'Broadcast Sent', description: 'Broadcast queued for delivery.' });
      }
    } catch (err) {
      console.error('Broadcast error', err);
      alert('Broadcast request failed');
    } finally {
      setSendingBroadcast((prev) => {
        const s = new Set(prev);
        s.delete(post.id);
        return s;
      });
    }
  };

  if (loading) return <div className="py-6 text-center text-slate-500">Loading posts…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post, index) => (
        <div key={post.id || index} className="flex flex-col">
          <BlogCard post={post} index={index} />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleBroadcast(post)}
              disabled={sendingBroadcast.has(post.id)}
              className={`flex-1 py-2 rounded-xl bg-[#1E3A66] text-white text-sm font-bold transition-colors ${sendingBroadcast.has(post.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#2F5FA7]'}`}
            >
              {sendingBroadcast.has(post.id) ? 'Broadcasting…' : 'Broadcast'}
            </button>
            <button
              onClick={() => handleTest(post)}
              disabled={sendingTest.has(post.id)}
              className={`flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold transition-colors ${sendingTest.has(post.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              {sendingTest.has(post.id) ? 'Sending…' : 'Test'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}