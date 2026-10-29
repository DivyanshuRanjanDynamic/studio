import { allPosts } from 'contentlayer2/generated';
import { BlogClientView } from '@/components/BlogClientView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | MechHub Chronicles',
  description:
    'Expert insights into CNC milling/turning, additive manufacturing, and the future of industrial engineering.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogPage() {
  // allPosts is available here because this is a Server Component.
  // We pass only the serialisable fields to the Client Component.
  const posts = allPosts.map((post) => ({
    _id: post._id,
    title: post.title,
    summary: post.summary,
    date: post.date,
    image: post.image,
    tags: post.tags,
    author: post.author,
    slug: post.slug,
    url: post.url,
    published: post.published ?? true,
    readingTime: post.readingTime,
  }));

  return <BlogClientView posts={posts} />;
}
