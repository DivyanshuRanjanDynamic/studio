import {serve} from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { sendTestEmail } from '@/lib/inngest/functions';
import { broadcastBlogEmail } from '@/lib/inngest/brodcastFunction';

export const { GET, POST, PUT} = serve({
    client: inngest,
    functions: [sendTestEmail, broadcastBlogEmail],
});