import { NextResponse, NextRequest } from 'next/server';
import { compareDesc } from 'date-fns';
import { allPosts } from 'contentlayer/generated';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the incoming request; bail early if unauthorized
    const auth = await authenticateRequest(request as any);
    if (!auth.success) {
      return NextResponse.json({ error: (auth as any).error || 'Unauthorized' }, { status: (auth as any).status || 401 });
    }
    const posts = (allPosts || [])
      // exclude explicit drafts / unpublished posts
      .filter((p: any) => p.draft !== true && p.published !== false)
      // map to minimal metadata only (no body/content) but include fields BlogCard expects
      .map((p: any) => {
        const slug = p.slug || (p._raw && p._raw.flattenedPath) || '';
        const date = p.date ? new Date(p.date).toISOString() : new Date().toISOString();
        const image = p.image || '/mechhub.png';
        const url = p.url || (slug ? `/blog/${slug}` : `/${slug}`);

        return {
          id: p._id || slug || (p._raw && p._raw.sourceFileName) || `post_${Math.random().toString(36).slice(2, 9)}`,
          title: p.title || 'Untitled',
          date,
          summary: p.summary || '',
          image,
          slug,
          url,
          readingTime: { text: (p.readingTime && p.readingTime.text) || '1 min' },
          tags: p.tags || [],
          author: p.author || 'MechHub',
        };
      })
      // sort a copy by date desc
      .sort((a: any, b: any) => compareDesc(new Date(a.date), new Date(b.date)));

    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}
