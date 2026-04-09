import React from 'react'
import { allPosts } from 'contentlayer/generated';
import { compareDesc } from 'date-fns';
import { BlogCard } from '../BlogCard';

export const BlogView = () => {
  const posts = allPosts.sort((a, b) => 
    compareDesc(new Date(a.date), new Date(b.date))
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {posts.map((post, index) => (
    <div key={post._id} className="flex flex-col">
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
