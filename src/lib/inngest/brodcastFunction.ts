import { inngest } from '@/lib/inngest';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { format, parseISO } from 'date-fns';
import { logger } from '@/utils/logger';


let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

type BlogBroadcastEvent = {
  name: 'blog/broadcast.send';
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

export const broadcastBlogEmail = inngest.createFunction(
  {
    id: 'broadcast-blog-email',
    triggers: [{ event: 'blog/broadcast.send' }],
  },
  async ({ event, step }) => {
    const { post } = event.data;
    const fullUrl = `https://mechhub.in${post.url}`;

    // Step 1 — Fetch all active verified users
    const subscribers = await step.run('fetch-subscribers', async () => {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) throw new Error('Firestore not initialized');

      const snapshot = await adminFirestore
        .collection('users')
        .where('status', '==', 'active')
        .where('emailVerified', '==', true)
        .get();

      const users= snapshot.docs.map((doc:any) => ({
        email: doc.data().email as string,
        name: (doc.data().fullName as string) ?? null,
      }));
      return users;
    });

    // Step 2 — Send email to each user one by one
    const resend = getResend();
    const failedRecipients: { email: string; error: string }[] = [];

    for (const subscriber of subscribers) {
      await step.run(`send-email-${subscriber.email}-${Date.now()}`, async () => {
        try {
          await resend.emails.send({
            from: 'MechHub Team <outreach@mechhub.in>',
            to: subscriber.email,
            subject: post.title,
            html: getEmailHtml(post, fullUrl, subscriber.name),
          });
        } catch (err: any) {
          const message = err?.message ?? String(err);
          // Log the failure and continue with the next subscriber
          try {
            logger.error({
              event: 'broadcast_send_failed',
              to: subscriber.email,
              error: message,
              postId: post.id,
            });
          } catch (logErr) {
            // Fallback to console if logger fails
            // eslint-disable-next-line no-console
            console.error('broadcast_send_failed', { to: subscriber.email, error: message, postId: post.id });
          }

          failedRecipients.push({ email: subscriber.email, error: message });
        }
      });
    }

    return {
      success: true,
      total: subscribers.length,
      sent: subscribers.length - failedRecipients.length,
      failed: failedRecipients.length,
      failures: failedRecipients.map((f) => f.email),
    };
  }
);

function getEmailHtml(
  post: BlogBroadcastEvent['data']['post'],
  fullUrl: string,
  name: string | null
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#2F5FA7;">MechHub Chronicles</p>
              ${name ? `<p style="margin:4px 0 0;font-size:13px;color:#64748B;font-weight:600;">Hey ${name}, here's something new for you 👋</p>` : ''}
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              
              <img src="${post.image}" alt="${post.title}" width="600"
                style="width:100%;max-width:600px;height:280px;object-fit:cover;display:block;" />

              <div style="padding:20px 28px 0;">
                ${post.tags?.slice(0, 2).map(tag => `
                  <span style="display:inline-block;background:#EFF6FF;color:#2F5FA7;font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-right:6px;">${tag}</span>
                `).join('')}
              </div>

              <div style="padding:20px 28px 28px;">
                <div style="margin-bottom:14px;">
                  <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#94A3B8;margin-right:16px;">
                    📅 ${format(parseISO(post.date), 'MMM d, yyyy')}
                  </span>
                  <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#94A3B8;">
                    🕐 ${post.readingTime.text}
                  </span>
                </div>

                <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1E3A66;line-height:1.3;">
                  ${post.title}
                </h1>

                <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;font-weight:500;">
                  ${post.summary}
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F1F5F9;padding-top:20px;margin-top:4px;">
                  <tr>
                    <td style="vertical-align:middle;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width:28px;height:28px;border-radius:50%;background:#EFF6FF;text-align:center;vertical-align:middle;font-size:11px;font-weight:800;color:#2F5FA7;">
                            ${post.author.charAt(0).toUpperCase()}
                          </td>
                          <td style="padding-left:10px;font-size:12px;font-weight:700;color:#1E3A66;">
                            ${post.author}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="text-align:right;vertical-align:middle;">
                      <a href="${fullUrl}" style="display:inline-block;background:#1E3A66;color:#ffffff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;padding:10px 20px;border-radius:10px;text-decoration:none;">
                        Read Article →
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:10px;color:#94A3B8;font-weight:600;">
                You're receiving this because you're a MechHub member.
              </p>
              <p style="margin:6px 0 0;font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#2F5FA7;">
                MechHub · Precision Engineering Content
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}