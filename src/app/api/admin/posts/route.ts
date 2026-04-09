import { NextResponse } from 'next/server';
import { compareDesc } from 'date-fns';
import { allPosts } from 'contentlayer/generated';

export async function GET() {
  try {
    const posts = (allPosts || [])
      // exclude explicit drafts / unpublished posts
      .filter((p: any) => p.draft !== true && p.published !== false)
      // map to minimal metadata only (no body/content) but include fields BlogCard expects
      .map((p: any) => ({
        id: p._id || p.slug || p._raw?.sourceFileName || null,
        title: p.title || '',
        date: p.date || null,
        summary: p.summary || '',
        image: p.image || null,
        slug: p.slug || (p._raw && p._raw.flattenedPath) || null,
        url: p.url || (p.slug ? `/blog/${p.slug}` : (p._raw && `/${p._raw.flattenedPath}`)),
        readingTime: { text: (p.readingTime && p.readingTime.text) || '1 min' },
        tags: p.tags || [],
        author: p.author || 'MechHub',
      }))
      // sort a copy by date desc
      .sort((a: any, b: any) => compareDesc(new Date(a.date), new Date(b.date)));

    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}
