import { inngest } from '@/lib/inngest';

type BlogTestEvent = {
  name: 'blog/test.send';
  data: {
    post: {
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
  };
};

export const sendTestEmail = inngest.createFunction(
  {
    id: 'send-test-email',
    event: 'blog/test.send',
  },
  async ({ event }: { event: BlogTestEvent }) => {
    const { post } = event.data;

    console.log('received post:', post.title);
  }
);