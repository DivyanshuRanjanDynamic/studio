import RSS from 'rss';
import { allPosts } from 'contentlayer2/generated';
import { compareDesc } from 'date-fns';

export async function GET() {
  const feed = new RSS({
    title: 'MechHub Blog | Chronicles of Precision Manufacturing',
    description:
      'Expert insights into CNC milling/turning, additive manufacturing, and hardware innovation.',
    site_url: 'https://www.mechhub.in/blog',
    feed_url: 'https://www.mechhub.in/blog/rss.xml',
    language: 'en',
    pubDate: new Date().toUTCString(),
    copyright: `${new Date().getFullYear()} MechHub`,
  });

  allPosts
    .filter((post) => post.published)
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .forEach((post) => {
      feed.item({
        title: post.title,
        description: post.summary,
        url: `https://www.mechhub.in${post.url}`,
        guid: post._id,
        date: post.date,
        author: post.author,
      });
    });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
