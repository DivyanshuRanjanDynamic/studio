import React, { useEffect, useState } from 'react'
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

  if (loading) return <div className="py-6 text-center text-slate-500">Loading posts…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post, index) => (
        <div key={post.id || index} className="flex flex-col">
          <BlogCard post={post} index={index} />
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 rounded-xl bg-[#1E3A66] text-white text-sm font-bold hover:bg-[#2F5FA7] transition-colors">
              Broadcast
            </button>
            <button className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
              Test
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
