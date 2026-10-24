'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import type { Post } from 'contentlayer2/generated';

interface BlogCardProps {
  post: Post;
  index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
  return (
    <Link href={post.url} className="group block">
      <div className="border border-lp-border bg-lp-bg transition-colors hover:border-lp-primary overflow-hidden">
        <div className="relative aspect-[2/1] overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {post.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="lp-label-mono bg-lp-bg/90 backdrop-blur-sm text-lp-primary px-2 py-0.5 border border-lp-border"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-4 lp-label-mono text-lp-muted-fg">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              {format(parseISO(post.date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3" />
              {post.readingTime.text}
            </span>
          </div>

          <h3 className="text-base font-medium tracking-tight group-hover:text-lp-primary transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>

          <p className="text-xs text-lp-muted-fg line-clamp-2 leading-relaxed">
            {post.summary}
          </p>

          <div className="pt-4 flex items-center justify-between border-t border-lp-border">
            <div className="flex items-center gap-2.5">
              <div className="flex size-6 items-center justify-center bg-lp-accent text-lp-primary lp-label-mono">
                {post.author.charAt(0)}
              </div>
              <span className="text-[11px] font-medium">{post.author}</span>
            </div>

            <div className="lp-label-mono flex items-center gap-1 text-lp-primary group-hover:gap-1.5 transition-all">
              Read Article
              <ArrowRight className="size-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
