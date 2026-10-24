'use client';

import { useState, useMemo } from 'react';
import { compareDesc } from 'date-fns';
import { Search, ArrowRight } from 'lucide-react';
import Fuse from 'fuse.js';
import { BlogCard } from '@/components/BlogCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Reveal, Tag } from '@/components/home/primitives';
import { BlogLayout } from '@/components/BlogLayout';

// Serialisable subset of a Post — only the fields we actually render
export interface PostSummary {
  _id: string;
  title: string;
  summary: string;
  date: string;
  image: string;
  tags?: string[];
  author: string;
  slug: string;
  url: string;
  published: boolean;
  readingTime: { text: string; minutes: number; words: number; time: number };
}

interface BlogClientViewProps {
  posts: PostSummary[];
}

export function BlogClientView({ posts: allPosts }: BlogClientViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allPosts.forEach((post) => post.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [allPosts]);

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
  }, [allPosts, searchQuery, selectedTag]);

  return (
    <BlogLayout>
      <div className="space-y-12">
        {/* Hero */}
        <div className="pt-10 pb-6">
          <Reveal>
            <Tag>Manufacturing Insights</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              MechHub <span className="font-lp-serif italic">Chronicles</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-4 max-w-xl text-sm text-lp-muted-fg">
              Expert insights into CNC milling/turning, additive manufacturing, and the future of
              industrial engineering.
            </p>
          </Reveal>
        </div>

        {/* Search and Filters */}
        <Reveal delay={180}>
          <div className="flex flex-col sm:flex-row gap-4 items-center sticky top-24 z-20 bg-lp-bg/90 backdrop-blur-xl p-4 border border-lp-border">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-lp-muted-fg" />
              <Input
                type="text"
                placeholder="Search articles, technical guides..."
                className="pl-10 h-12 bg-lp-card border-lp-border text-lp-fg rounded-sm placeholder:text-lp-muted-fg/40 focus:ring-lp-primary/20 focus:border-lp-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative w-full sm:w-auto shrink-0">
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="appearance-none w-full sm:w-52 h-12 pl-4 pr-10 bg-lp-card border border-lp-border text-sm text-lp-fg cursor-pointer transition-all hover:border-lp-fg focus:outline-none focus:ring-2 focus:ring-lp-primary/20 focus:border-lp-primary rounded-sm"
              >
                <option value="">All Topics</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag} ({allPosts.filter((p) => p.published && p.tags?.includes(tag)).length})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="size-4 text-lp-muted-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <Reveal key={post._id} delay={i * 40}>
                <BlogCard post={post as any} index={i} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="inline-flex items-center justify-center size-16 bg-lp-accent border border-lp-border mb-4">
              <Search className="size-8 text-lp-muted-fg" />
            </div>
            <h3 className="text-xl font-medium tracking-tight">No articles found</h3>
            <p className="text-lp-muted-fg text-sm">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-lp-border text-lp-muted-fg hover:text-lp-fg rounded-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag(null);
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Newsletter CTA */}
        <Reveal>
          <div className="mt-20 lp-grid-bg bg-lp-ink p-12 text-lp-ink-fg text-center">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-medium tracking-tight leading-tight">
                Get the latest manufacturing tech news <br /> delivered to your{' '}
                <span className="font-lp-serif italic opacity-70">inbox.</span>
              </h2>
              <p className="text-sm opacity-50">
                Join 5,000+ engineers receiving bi-weekly deep dives into hardware innovation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Input
                  className="h-12 bg-lp-ink-fg/10 border-lp-ink-fg/10 text-lp-ink-fg placeholder:text-lp-ink-fg/40 rounded-sm"
                  placeholder="engineering@company.com"
                />
                <Button className="lp-label-mono h-12 px-8 bg-lp-ink-fg text-lp-ink hover:bg-lp-ink-fg/90 rounded-sm">
                  Subscribe <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
              <p className="lp-label-mono opacity-40">Zero spam. Only precision content.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </BlogLayout>
  );
}
