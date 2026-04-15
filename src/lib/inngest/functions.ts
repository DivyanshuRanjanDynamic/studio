import { inngest } from '@/lib/inngest';
import { Resend } from 'resend';
import { format, parseISO } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    triggers: [{ event: 'blog/test.send' }],
  },
  async ({ event }: { event: BlogTestEvent }) => {
    const { post } = event.data;
    const email = `https://mechhub.in${post.url}`;

    await resend.emails.send({
      from: 'MechHub Team <outreach@mechhub.in>',
      to: 'admin@mechhub.in',
      subject: post.title,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#2F5FA7;">MechHub Chronicles</p>
              <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Test Send</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              
              <!-- Image -->
              <img 
                src="${post.image}" 
                alt="${post.title}"
                width="600"
                style="width:100%;max-width:600px;height:280px;object-fit:cover;display:block;"
              />

              <!-- Tags -->
              <div style="padding:20px 28px 0;">
                ${post.tags
                  ?.slice(0, 2)
                  .map(
                    (tag) => `
                  <span style="display:inline-block;background:#EFF6FF;color:#2F5FA7;font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-right:6px;">${tag}</span>
                `
                  )
                  .join('')}
              </div>

              <!-- Content -->
              <div style="padding:20px 28px 28px;">
                
                <!-- Meta -->
                <div style="display:flex;gap:16px;margin-bottom:14px;">
                  <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#94A3B8;">
                    📅 ${format(parseISO(post.date), 'MMM d, yyyy')}
                  </span>
                  <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#94A3B8;">
                    🕐 ${post.readingTime.text}
                  </span>
                </div>

                <!-- Title -->
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1E3A66;line-height:1.3;">
                  ${post.title}
                </h1>

                <!-- Summary -->
                <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;font-weight:500;">
                  ${post.summary}
                </p>

                <!-- Divider -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F1F5F9;margin-top:20px;padding-top:20px;">
  <tr>
    <!-- Author -->
    <td style="vertical-align:middle;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:28px;height:28px;border-radius:50%;background:#EFF6FF;text-align:center;vertical-align:middle;font-size:11px;font-weight:800;color:#2F5FA7;border:1px solid rgba(47,95,167,0.1);">
            ${post.author.charAt(0).toUpperCase()}
          </td>
          <td style="padding-left:10px;font-size:12px;font-weight:700;color:#1E3A66;">
            ${post.author}
          </td>
        </tr>
      </table>
    </td>
                  <!-- CTA -->
                  <a href=$  style="display:inline-block;background:#1E3A66;color:#ffffff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;padding:10px 20px;border-radius:10px;text-decoration:none;">
                    Read Article →
                  </a>

                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:10px;color:#94A3B8;font-weight:600;">
                This is a test send from MechHub admin panel.
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
`,
    });

    console.log('received post:', post.title);
  }
);
