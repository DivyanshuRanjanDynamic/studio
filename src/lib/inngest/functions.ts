import { inngest } from '@/lib/inngest';
import { Resend } from 'resend';
import { format, parseISO } from 'date-fns';

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

export const sendTestEmail = inngest.createFunction(
  {
    id: 'send-test-email',
    triggers: [{ event: 'blog/test.send' }],
  },

  async ({ event, step }) => {
    const { post } = event.data;
    const resend = getResend();

    console.log('POST DATA:', post);

    // ✅ Safe values (no crashes)
    const safeDate = post?.date ? format(parseISO(post.date), 'MMM d, yyyy') : 'No date';

    const readingTime = post?.readingTime?.text ?? 'N/A';

    const articleUrl = `https://mechhub.in${post?.url ?? ''}`;

    // ✅ IMPORTANT: wrap side effect in step.run
    await step.run(`send-test-email-${Date.now()}`, async () => {
      await resend.emails.send({
        from: 'MechHub Team <outreach@mechhub.in>',
        to: 'admin@mechhub.in',
        subject: post?.title ?? 'New Article',

        html: `
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

<table width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

<!-- Header -->
<tr>
<td style="padding:24px;text-align:center;">
  <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#2F5FA7;">
    MechHub Chronicles
  </p>
  <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;font-weight:600;">
    Test Send
  </p>
</td>
</tr>

<!-- Image -->
<tr>
<td>
  <img 
    src="${post?.image ?? ''}" 
    alt="${post?.title ?? ''}"
    width="600"
    style="width:100%;height:280px;object-fit:cover;"
  />
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:24px;">

<div style="margin-bottom:12px;font-size:10px;color:#94A3B8;font-weight:700;">
  📅 ${safeDate} &nbsp;&nbsp; 🕐 ${readingTime}
</div>

<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1E3A66;">
  ${post?.title ?? ''}
</h1>

<p style="font-size:14px;color:#475569;line-height:1.6;">
  ${post?.summary ?? ''}
</p>

<a href="${articleUrl}" 
  style="display:inline-block;margin-top:16px;background:#1E3A66;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px;">
  Read Article →
</a>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:16px;text-align:center;font-size:10px;color:#94A3B8;">
  This is a test email from MechHub
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
        `,
      });
    });

    console.log('EMAIL SENT ✅');
  }
);
