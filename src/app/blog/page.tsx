'use client';

import { useState, useMemo } from 'react';
import { allPosts } from 'contentlayer/generated';
import { compareDesc } from 'date-fns';
import { Search, SlidersHorizontal, ArrowRight, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { BlogLayout } from '@/components/BlogLayout';
import { BlogCard } from '@/components/BlogCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackToHomeBar } from '@/components/BackToHomeBar';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allPosts.forEach((post) => post.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, []);

  // Filter and Sort Posts
  const posts = useMemo(() => {
    let filtered = allPosts
      .filter((post) => post.published)
      .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)));

    if (selectedTag) {
      filtered = filtered.filter((post) => post.tags?.includes(selectedTag));
    }

    if (!searchQuery) return filtered;

    const fuse = new Fuse(filtered, {
      keys: ['title', 'summary', 'tags'],
      threshold: 0.3,
    });

    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, selectedTag]);

  return (
    <BlogLayout>
      <div className="space-y-12">
        <BackToHomeBar className="pt-0 pb-0 px-0" />
        {/* Blog Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <Badge className="bg-[#E8F1FF] text-[#2F5FA7] border-[#2F5FA7]/20 px-3 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">
            Manufacturing Insights
          </Badge>
          <h1 className="text-center font-bold tracking-normal text-balance leading-snug text-3xl md:text-4xl lg:text-[56px] text-[#1E3A66] mb-8">
            MechHub <span className="text-[#2F5FA7]">Chronicles</span>
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed font-medium">
            Expert insights into CNC milling/turning, additive manufacturing, and the future of
            industrial engineering.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center sticky top-24 z-20 bg-white/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-100 shadow-xl">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100" />
            <Input
              type="text"
              placeholder="Search articles, technical guides..."
              className="pl-10 h-11 bg-slate-50 border-slate-200 text-[#1E3A66] rounded-xl placeholder:text-blue-100 focus:ring-[#2F5FA7]/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-auto shrink-0">
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="appearance-none w-full sm:w-52 h-11 pl-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-[#1E3A66] cursor-pointer transition-all hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2F5FA7]/20 focus:border-[#2F5FA7]/30"
            >
              <option value="" className="bg-white text-[#1E3A66]">
                All Topics
              </option>
              {allTags.map((tag) => (
                <option key={tag} value={tag} className="bg-white text-[#1E3A66]">
                  {tag} ({allPosts.filter((p) => p.published && p.tags?.includes(tag)).length})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-4 h-4 text-blue-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <BlogCard key={post._id} post={post} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-100 mb-4 shadow-sm">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#1E3A66]">No articles found</h3>
            <p className="text-[#64748B] font-medium">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-slate-200 text-blue-200 hover:text-[#2F5FA7] rounded-full"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag(null);
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Newsletter / CTA Section */}
        <div className="mt-32 relative rounded-3xl overflow-hidden border border-blue-50 bg-[#1E3A66] p-12 text-center shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Get the latest manufacturing tech news <br /> delivered to your inbox.
            </h2>
            <p className="text-blue-100/60 font-medium">
              Join 5,000+ engineers receiving bi-weekly deep dives into hardware innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Input
                className="h-12 bg-white/10 border-white/10 rounded-xl text-white placeholder:text-white/40"
                placeholder="engineering@company.com"
              />
              <Button className="h-12 px-8 bg-white hover:bg-blue-50 text-[#1E3A66] rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg">
                Subscribe <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
              Zero spam. Only precision content.
            </p>
          </div>
          {/* Subtle glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-[100px]" />
        </div>
      </div>
    </BlogLayout>
  );
}
