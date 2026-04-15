'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar, ArrowRight, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type BlogCardPost = {
  id?: string;
  title: string;
  image: string;
  tags?: string[];
  date: string;
  readingTime: { text: string };
  summary: string;
  author: string;
  url: string;
};

interface BlogCardProps {
  post: BlogCardPost;
  index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
  return (
    <Link href={post.url} className="group block relative">
      <div className="relative overflow-hidden rounded-xl bg-white transition-all duration-300 hover:shadow-lg">
        {/* Image Container */}
        <div className="relative aspect-[2/1] overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Tags */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {post.tags?.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-white text-[#2F5FA7] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[#2F5FA7]" />
              {format(parseISO(post.date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#2F5FA7]" />
              {post.readingTime.text}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-800 group-hover:text-[#2F5FA7] transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
            {post.summary}
          </p>

          <div className="pt-4 flex items-center justify-between border-t border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[9px] font-bold text-[#2F5FA7] ring-1 ring-[#2F5FA7]/10 uppercase">
                {post.author.charAt(0)}
              </div>
              <span className="text-[11px] font-bold text-[#1E3A66]">{post.author}</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-[10px] text-[#2F5FA7] uppercase tracking-wider group-hover:gap-1.5 transition-all">
              Read Article
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
