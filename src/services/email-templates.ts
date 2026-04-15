// ═══════════════════════════════════════════════════
// MechHub Email Template Engine
// ═══════════════════════════════════════════════════
//
// Reusable inline-CSS email templates with consistent
// MechHub branding. All templates render to raw HTML
// strings that work across all major email clients.
//
// Design System:
//   Primary:    #1E3A66
//   Accent:     #2F5FA7
//   Cyan:       #06b6d4
//   Background: #eef2f7 / #f8fafc
//   Surface:    #ffffff
//   Text:       #0f172a / #334155
//   Muted:      #64748b / #94a3b8

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mechhub.in';
const CURRENT_YEAR = new Date().getFullYear();

// ─── Shared Base Layout ──────────────────────────────────────

interface LayoutOptions {
  previewText?: string;
  heroPill?: string;
  heroTitle: string;
  heroSubtitle?: string;
}

function baseLayout(content: string, options: LayoutOptions): string {
  const { previewText, heroPill, heroTitle, heroSubtitle } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <style>
    body { margin: 0; padding: 0; background-color: #eef2f7; color: #0f172a; font-family: Georgia, Cambria, 'Times New Roman', Times, serif; -webkit-font-smoothing: antialiased; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
    .wrapper { width: 100%; padding: 24px 10px; background-color: #eef2f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #d4dbe6; border-radius: 14px; overflow: hidden; }
    .topbar { padding: 16px 22px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0; }
    .brand { margin: 0; color: #1e3a66; font-size: 32px; font-weight: 700; letter-spacing: -0.01em; line-height: 1; }
    .hero { background-color: #2f5fa7; padding: 28px 28px 24px; }
    .hero-pill { display: inline-block; padding: 6px 12px; border-radius: 999px; border: 1px solid #6d86b8; color: #e9f0ff; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .hero-title { margin: 14px 0 8px; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.1; text-transform: uppercase; letter-spacing: 0.01em; }
    .hero-subtitle { margin: 0; color: #99e5f0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 700; line-height: 1.1; }
    .content { padding: 26px 28px 20px; }
    .title { margin: 0 0 12px; font-size: 20px; line-height: 1.3; color: #1e3a66; font-weight: 700; }
    .paragraph { margin: 0 0 14px; font-size: 15px; line-height: 1.7; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .field-value { font-size: 15px; color: #0f172a; font-weight: 500; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .highlight-box { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .price-tag { font-size: 28px; font-weight: 800; color: #1e3a66; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .cta-wrap { margin: 26px 0 20px; text-align: center; }
    .cta { display: inline-block; padding: 14px 28px; border-radius: 999px; background-color: #2f5fa7; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.04em; text-transform: uppercase; }
    .cta-outline { display: inline-block; padding: 12px 24px; border-radius: 999px; background-color: #ffffff; border: 2px solid #2f5fa7; color: #2f5fa7 !important; text-decoration: none; font-size: 13px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.04em; text-transform: uppercase; }
    .divider { height: 1px; background-color: #e2e8f0; margin: 20px 0; }
    .meta { margin: 0; font-size: 13px; line-height: 1.6; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .badge-green { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .badge-blue { background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .badge-amber { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .message-box { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 4px; }
    .footer { padding: 16px 28px 26px; background-color: #f8fafc; }
    .rule { height: 1px; background-color: #e2e8f0; margin-bottom: 14px; }
    .footer-text { margin: 0; color: #64748b; font-size: 12px; line-height: 1.6; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .footer-link { color: #2f5fa7; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  ${previewText ? `<div class="preheader">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="topbar">
        <h1 class="brand">MechHub</h1>
      </div>
      <div class="hero">
        ${heroPill ? `<span class="hero-pill">${heroPill}</span>` : ''}
        <h2 class="hero-title">${heroTitle}</h2>
        ${heroSubtitle ? `<p class="hero-subtitle">${heroSubtitle}</p>` : ''}
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <div class="rule"></div>
        <p class="footer-text">&copy; ${CURRENT_YEAR} MechHub &mdash; A Unit of Synchubb Innovations Pvt Ltd</p>
        <p class="footer-text" style="margin-top: 6px;">
          <a href="${APP_URL}" class="footer-link">mechhub.in</a> &bull;
          <a href="mailto:outreach@mechhub.in" class="footer-link">outreach@mechhub.in</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Helper: Format currency ─────────────────────────────────

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function projectLink(projectId: string): string {
  return `${APP_URL}/projects/${projectId}`;
}

function dashboardLink(): string {
  return `${APP_URL}/dashboard`;
}

// ═══════════════════════════════════════════════════
// Auth Email Templates
// ═══════════════════════════════════════════════════

export function verificationEmail(name: string, verificationUrl: string): string {
  return baseLayout(
    `
    <h2 class="title">Verify your email address</h2>
    <p class="paragraph">Hi ${name},</p>
    <p class="paragraph">Thanks for creating your MechHub account! Please confirm your email address to activate your workspace and continue securely.</p>
    <div class="cta-wrap">
      <a href="${verificationUrl}" class="cta">Verify Email</a>
    </div>
    <p class="meta">This secure link expires in 24 hours.</p>
    <p class="meta">If the button does not work, copy and paste this URL into your browser:</p>
    <div class="link-box" style="margin: 18px 0 0; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f6f9ff; word-break: break-all; font-size: 12px; line-height: 1.6; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${verificationUrl}</div>
    `,
    {
      previewText: 'Confirm your email to activate your MechHub workspace.',
      heroPill: 'Account Security',
      heroTitle: 'Email Verification',
      heroSubtitle: 'Confirm Your Identity',
    }
  );
}

export function passwordResetEmail(name: string, resetUrl: string): string {
  return baseLayout(
    `
    <h2 class="title">Password Reset Request</h2>
    <p class="paragraph">Hi ${name},</p>
    <p class="paragraph">We received a request to reset the password for your MechHub account. If you made this request, please click the button below to choose a new password.</p>
    <div class="cta-wrap">
      <a href="${resetUrl}" class="cta">Reset My Password</a>
    </div>
    <p class="meta">This secure link will expire soon.</p>
    <p class="meta">If you didn't request a password reset, you can safely ignore this email.</p>
    `,
    {
      previewText: 'Reset the password for your MechHub account.',
      heroPill: 'Account Security',
      heroTitle: 'Password Reset',
      heroSubtitle: 'Choose a New Password',
    }
  );
}

// ═══════════════════════════════════════════════════
// Customer Email Templates
// ═══════════════════════════════════════════════════

export function welcomeEmail(name: string): string {
  return baseLayout(
    `
    <h2 class="title">Welcome aboard, ${name}!</h2>
    <p class="paragraph">You've joined India's most advanced managed manufacturing platform. Whether you need CNC machining, sheet metal cutting, 3D printing, or wire EDM — we're ready to build your next project.</p>
    <div class="highlight-box">
      <div class="field-label">What's next?</div>
      <p class="paragraph" style="margin: 8px 0 0;">Create a project, upload your CAD files, and get an instant quote from our engineering team.</p>
    </div>
    <div class="cta-wrap">
      <a href="${dashboardLink()}" class="cta">Go to Dashboard</a>
    </div>
    <p class="meta">Need help? Reply to this email or reach us at outreach@mechhub.in</p>
    `,
    {
      previewText: 'Welcome to MechHub — your manufacturing workspace is ready.',
      heroPill: 'Built in India for Builders',
      heroTitle: 'Welcome to MechHub',
      heroSubtitle: 'Your Manufacturing Hub',
    }
  );
}

export function rfqSubmittedCustomerEmail(
  name: string,
  projectName: string,
  projectId: string,
  partCount: number
): string {
  return baseLayout(
    `
    <h2 class="title">Quote Request Received</h2>
    <p class="paragraph">Hi ${name}, we've received your manufacturing request and our engineering team is reviewing it now.</p>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Project</div>
        <div class="field-value">${projectName}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Parts Submitted</div>
        <div class="field-value">${partCount} part${partCount > 1 ? 's' : ''}</div>
      </div>
    </div>
    <p class="paragraph">You'll receive a detailed quotation within <strong>24 hours</strong>. We'll notify you by email the moment it's ready.</p>
    <div class="cta-wrap">
      <a href="${projectLink(projectId)}" class="cta">View Project</a>
    </div>
    `,
    {
      previewText: `Your quote request for "${projectName}" is being reviewed.`,
      heroPill: 'Quote Requested',
      heroTitle: 'Request Received',
      heroSubtitle: projectName,
    }
  );
}

export function quotationReceivedEmail(
  name: string,
  projectName: string,
  projectId: string,
  quotedPrice: number,
  leadTimeDays: number
): string {
  return baseLayout(
    `
    <h2 class="title">Your Quotation is Ready</h2>
    <p class="paragraph">Hi ${name}, great news! Our engineering team has reviewed your project and prepared a quotation for you.</p>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Project</div>
        <div class="field-value">${projectName}</div>
      </div>
      <div class="field">
        <div class="field-label">Quoted Price</div>
        <div class="price-tag">${formatINR(quotedPrice)}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Estimated Lead Time</div>
        <div class="field-value">${leadTimeDays} business days</div>
      </div>
    </div>
    <p class="paragraph">You can <strong>accept the quote</strong> to proceed to payment, or <strong>negotiate</strong> if you'd like to discuss the pricing.</p>
    <div class="cta-wrap">
      <a href="${projectLink(projectId)}" class="cta">Review Quotation</a>
    </div>
    <p class="meta">This quotation is valid for 7 days from the date of issue.</p>
    `,
    {
      previewText: `Quotation ready for "${projectName}" — ${formatINR(quotedPrice)}`,
      heroPill: 'Quotation Ready',
      heroTitle: 'Quote for You',
      heroSubtitle: formatINR(quotedPrice),
    }
  );
}

export function negotiationAdminReplyEmail(
  name: string,
  projectName: string,
  projectId: string,
  adminMessage: string,
  proposedPrice?: number
): string {
  return baseLayout(
    `
    <h2 class="title">New Message from MechHub</h2>
    <p class="paragraph">Hi ${name}, the MechHub team has responded to your negotiation for <strong>${projectName}</strong>.</p>
    ${proposedPrice ? `
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Revised Price</div>
        <div class="price-tag">${formatINR(proposedPrice)}</div>
      </div>
    </div>
    ` : ''}
    <div class="field">
      <div class="field-label">Message</div>
      <div class="message-box">
        <div class="field-value">${adminMessage.replace(/\n/g, '<br/>')}</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${projectLink(projectId)}" class="cta">View &amp; Respond</a>
    </div>
    `,
    {
      previewText: `MechHub replied to your negotiation for "${projectName}"`,
      heroPill: 'Negotiation Update',
      heroTitle: 'Counter-Offer',
      heroSubtitle: projectName,
    }
  );
}

export function quoteAcceptedEmail(
  name: string,
  projectName: string,
  projectId: string,
  finalPrice: number
): string {
  return baseLayout(
    `
    <h2 class="title">Quote Accepted — Let's Build!</h2>
    <p class="paragraph">Hi ${name}, you've accepted the quotation for <strong>${projectName}</strong>. Here's the next step:</p>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Agreed Price</div>
        <div class="price-tag">${formatINR(finalPrice)}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Next Step</div>
        <div class="field-value">Pay 50% advance (${formatINR(Math.round(finalPrice * 0.5))}) to start production</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${projectLink(projectId)}" class="cta">Pay Advance &amp; Start</a>
    </div>
    <p class="meta">Production begins immediately after your advance payment is confirmed.</p>
    `,
    {
      previewText: `Quote accepted for "${projectName}" — pay advance to start manufacturing.`,
      heroPill: 'Order Confirmed',
      heroTitle: 'Quote Accepted',
      heroSubtitle: formatINR(finalPrice),
    }
  );
}

export function paymentAdvanceConfirmedEmail(
  name: string,
  projectName: string,
  projectId: string,
  amountPaid: number,
  balanceDue: number
): string {
  return baseLayout(
    `
    <h2 class="title">Advance Payment Confirmed</h2>
    <p class="paragraph">Hi ${name}, your advance payment has been verified. Manufacturing for <strong>${projectName}</strong> is now in progress!</p>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Advance Paid</div>
        <div class="price-tag">${formatINR(amountPaid)}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Balance Due (on delivery)</div>
        <div class="field-value">${formatINR(balanceDue)}</div>
      </div>
    </div>
    <p class="paragraph"><span class="badge badge-blue">IN PRODUCTION</span></p>
    <p class="paragraph">We'll notify you when your parts are shipped. The remaining ${formatINR(balanceDue)} will be due at that time.</p>
    <div class="cta-wrap">
      <a href="${projectLink(projectId)}" class="cta">Track Project</a>
    </div>
    `,
    {
      previewText: `Advance of ${formatINR(amountPaid)} confirmed — production started for "${projectName}"`,
      heroPill: 'Payment Verified',
      heroTitle: 'Production Started',
      heroSubtitle: projectName,
    }
  );
}

export function statusInProductionEmail(
  name: string,
  projectName: string,
  projectId: string
): string {
  return baseLayout(
    `
    <h2 class="title">Manufacturing in Progress</h2>
    <p class="paragraph">Hi ${name}, your project <strong>${projectName}</strong> is now actively being manufactured in our workshop.</p>
    <p class="paragraph"><span class="badge badge-blue">IN PRODUCTION</span></p>
    <p class="paragraph">Our team is working on your parts with precision. We'll update you when they're ready to ship.</p>
    <div class="cta-wrap">
      <a href="${projectLink(projectId)}" class="cta">Track Progress</a>
    </div>
    `,
    {
      previewText: `"${projectName}" is now in production — we'll update you soon.`,
      heroPill: 'Status Update',
      heroTitle: 'In Production',
      heroSubtitle: projectName,
    }
  );
}

export function statusShippedEmail(
  name: string,
  projectName: string,
  projectId: string,
  balanceDue: number
): string {
  return baseLayout(
    `
    <h2 class="title">Your Parts Have Shipped! 🚚</h2>
    <p class="paragraph">Hi ${name}, great news! Your parts for <strong>${projectName}</strong> have been dispatched and are on their way to you.</p>
    <p class="paragraph"><span class="badge badge-green">SHIPPED</span></p>
    <div class="divider"></div>
    <h2 class="title">Balance Payment Due</h2>
    <p class="paragraph">To complete your order, please pay the remaining balance:</p>
    <div class="highlight-box">
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Balance Due</div>
        <div class="price-tag">${formatINR(balanceDue)}</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${projectLink(projectId)}" class="cta">Pay Balance Now</a>
    </div>
    <p class="meta">Prompt payment helps us serve you faster on future orders.</p>
    `,
    {
      previewText: `"${projectName}" has shipped — please pay the remaining ${formatINR(balanceDue)}.`,
      heroPill: 'Order Shipped',
      heroTitle: 'Parts Shipped',
      heroSubtitle: `Balance Due: ${formatINR(balanceDue)}`,
    }
  );
}

export function paymentBalanceConfirmedEmail(
  name: string,
  projectName: string,
  projectId: string,
  amountPaid: number,
  totalPaid: number
): string {
  return baseLayout(
    `
    <h2 class="title">Final Payment Confirmed ✅</h2>
    <p class="paragraph">Hi ${name}, your final payment for <strong>${projectName}</strong> has been verified. Your order is now fully paid!</p>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Balance Paid</div>
        <div class="price-tag">${formatINR(amountPaid)}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Total Amount Paid</div>
        <div class="field-value" style="font-weight: 700; color: #059669;">${formatINR(totalPaid)}</div>
      </div>
    </div>
    <p class="paragraph"><span class="badge badge-green">FULLY PAID</span></p>
    <p class="paragraph">Thank you for choosing MechHub. We hope to serve you again on your next manufacturing project.</p>
    <div class="cta-wrap">
      <a href="${dashboardLink()}" class="cta">Back to Dashboard</a>
    </div>
    `,
    {
      previewText: `Final payment of ${formatINR(amountPaid)} confirmed for "${projectName}" — fully paid!`,
      heroPill: 'Payment Complete',
      heroTitle: 'All Paid Up',
      heroSubtitle: formatINR(totalPaid),
    }
  );
}

export function statusDeliveredEmail(
  name: string,
  projectName: string,
  projectId: string
): string {
  return baseLayout(
    `
    <h2 class="title">Your Parts Have Been Delivered! 🎉</h2>
    <p class="paragraph">Hi ${name}, your project <strong>${projectName}</strong> has been successfully delivered.</p>
    <p class="paragraph"><span class="badge badge-green">DELIVERED</span></p>
    <p class="paragraph">We hope the parts meet your expectations. If you have any concerns about quality or fit, please don't hesitate to reach out to us at outreach@mechhub.in.</p>
    <div class="cta-wrap">
      <a href="${dashboardLink()}" class="cta-outline">View All Projects</a>
    </div>
    <p class="meta">Thank you for manufacturing with MechHub. We're here for your next build.</p>
    `,
    {
      previewText: `"${projectName}" delivered — thank you for choosing MechHub!`,
      heroPill: 'Delivery Complete',
      heroTitle: 'Parts Delivered',
      heroSubtitle: projectName,
    }
  );
}

// ═══════════════════════════════════════════════════
// Admin Email Templates
// ═══════════════════════════════════════════════════

export function adminNewUserEmail(userName: string, userEmail: string): string {
  return baseLayout(
    `
    <h2 class="title">New User Registered</h2>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${userName}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${userEmail}" style="color: #2F5FA7; text-decoration: none;">${userEmail}</a></div>
      </div>
    </div>
    <p class="meta">This user has verified their email and is now active on the platform.</p>
    `,
    {
      previewText: `New user: ${userName} (${userEmail}) just joined MechHub.`,
      heroPill: 'User Activity',
      heroTitle: 'New Registration',
    }
  );
}

export function adminNewRfqEmail(
  customerName: string,
  customerEmail: string,
  projectName: string,
  projectId: string,
  partCount: number
): string {
  return baseLayout(
    `
    <h2 class="title">New Quote Request</h2>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Customer</div>
        <div class="field-value">${customerName} (<a href="mailto:${customerEmail}" style="color: #2F5FA7; text-decoration: none;">${customerEmail}</a>)</div>
      </div>
      <div class="field">
        <div class="field-label">Project</div>
        <div class="field-value">${projectName}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Parts</div>
        <div class="field-value">${partCount} part${partCount > 1 ? 's' : ''} submitted</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${APP_URL}/admin" class="cta">Open Admin Panel</a>
    </div>
    `,
    {
      previewText: `New RFQ from ${customerName}: "${projectName}" — ${partCount} parts`,
      heroPill: 'Action Required',
      heroTitle: 'New RFQ Received',
      heroSubtitle: projectName,
    }
  );
}

export function adminNegotiationCustomerReplyEmail(
  customerName: string,
  customerEmail: string,
  projectName: string,
  projectId: string,
  customerMessage: string,
  proposedPrice?: number
): string {
  return baseLayout(
    `
    <h2 class="title">Customer Negotiation Reply</h2>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Customer</div>
        <div class="field-value">${customerName} (<a href="mailto:${customerEmail}" style="color: #2F5FA7; text-decoration: none;">${customerEmail}</a>)</div>
      </div>
      <div class="field">
        <div class="field-label">Project</div>
        <div class="field-value">${projectName}</div>
      </div>
      ${proposedPrice ? `
      <div class="field">
        <div class="field-label">Proposed Price</div>
        <div class="price-tag">${formatINR(proposedPrice)}</div>
      </div>
      ` : ''}
    </div>
    <div class="field">
      <div class="field-label">Customer Message</div>
      <div class="message-box">
        <div class="field-value">${customerMessage.replace(/\n/g, '<br/>')}</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${APP_URL}/admin" class="cta">Respond in Admin Panel</a>
    </div>
    `,
    {
      previewText: `${customerName} replied in negotiation for "${projectName}"`,
      heroPill: 'Negotiation',
      heroTitle: 'Customer Reply',
      heroSubtitle: projectName,
    }
  );
}

export function adminContactQueryEmail(
  fullName: string,
  email: string,
  message: string,
  phone?: string,
  company?: string
): string {
  return baseLayout(
    `
    <h2 class="title">New Contact Query</h2>
    <div class="field">
      <div class="field-label">Name</div>
      <div class="field-value">${fullName}</div>
    </div>
    <div class="field">
      <div class="field-label">Email</div>
      <div class="field-value"><a href="mailto:${email}" style="color: #2F5FA7; text-decoration: none;">${email}</a></div>
    </div>
    ${phone ? `<div class="field"><div class="field-label">Phone</div><div class="field-value">${phone}</div></div>` : ''}
    ${company ? `<div class="field"><div class="field-label">Company</div><div class="field-value">${company}</div></div>` : ''}
    <div class="field">
      <div class="field-label">Message</div>
      <div class="message-box">
        <div class="field-value">${message.replace(/\n/g, '<br/>')}</div>
      </div>
    </div>
    `,
    {
      previewText: `New contact query from ${fullName} via mechhub.in/contact`,
      heroPill: 'Contact Form',
      heroTitle: 'New Contact Query',
      heroSubtitle: `From ${fullName}`,
    }
  );
}

export function adminConsultationBookedEmail(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  message: string,
  quoteRef?: string
): string {
  return baseLayout(
    `
    <h2 class="title">New Expert Consultation Booked</h2>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Customer</div>
        <div class="field-value">${customerName}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${customerEmail}" style="color: #2F5FA7; text-decoration: none;">${customerEmail}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${customerPhone}</div>
      </div>
      ${quoteRef ? `
      <div class="field">
        <div class="field-label">Quote Reference</div>
        <div class="field-value"><span class="badge badge-blue">${quoteRef}</span></div>
      </div>
      ` : ''}
    </div>
    <div class="field">
      <div class="field-label">Project Brief</div>
      <div class="message-box">
        <div class="field-value">${message.replace(/\n/g, '<br/>')}</div>
      </div>
    </div>
    <p class="meta">Please contact this customer within 24 hours.</p>
    `,
    {
      previewText: `Consultation booked by ${customerName} — requires callback within 24h`,
      heroPill: 'Action Required',
      heroTitle: 'Consultation Request',
      heroSubtitle: customerName,
    }
  );
}

export function adminPaymentReceivedEmail(
  customerName: string,
  customerEmail: string,
  projectName: string,
  projectId: string,
  paymentType: 'advance' | 'completion',
  amount: number,
  customerPhone?: string
): string {
  const typeLabel = paymentType === 'advance' ? '50% Advance' : '50% Balance';
  return baseLayout(
    `
    <h2 class="title">Payment Received — ${typeLabel}</h2>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Project</div>
        <div class="field-value" style="font-weight: 700; color: #1e3a66;">${projectName}</div>
      </div>
      <div class="field">
        <div class="field-label">Customer</div>
        <div class="field-value">${customerName} (<a href="mailto:${customerEmail}" style="color: #2F5FA7; text-decoration: none;">${customerEmail}</a>)</div>
      </div>
      ${customerPhone ? `
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${customerPhone}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="field-label">Payment Milestone</div>
        <div class="field-value"><span class="badge badge-green">${typeLabel}</span></div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Amount Paid</div>
        <div class="price-tag">${formatINR(amount)}</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${APP_URL}/admin" class="cta">Open Admin Panel</a>
    </div>
    `,
    {
      previewText: `${typeLabel} payment for "${projectName}" from ${customerName}.`,
      heroPill: 'Payment Alert',
      heroTitle: 'Payment Received',
      heroSubtitle: `${formatINR(amount)} — ${projectName}`,
    }
  );
}

export function adminQuoteAcceptedEmail(
  customerName: string,
  customerEmail: string,
  projectName: string,
  projectId: string,
  acceptedPrice: number
): string {
  return baseLayout(
    `
    <h2 class="title">Quote Accepted by Customer</h2>
    <div class="highlight-box">
      <div class="field">
        <div class="field-label">Customer</div>
        <div class="field-value">${customerName} (<a href="mailto:${customerEmail}" style="color: #2F5FA7; text-decoration: none;">${customerEmail}</a>)</div>
      </div>
      <div class="field">
        <div class="field-label">Project</div>
        <div class="field-value">${projectName}</div>
      </div>
      <div class="field" style="margin-bottom: 0;">
        <div class="field-label">Accepted Price</div>
        <div class="price-tag">${formatINR(acceptedPrice)}</div>
      </div>
    </div>
    <p class="paragraph">The customer will proceed to pay the 50% advance. Monitor the payment status in the admin panel.</p>
    <div class="cta-wrap">
      <a href="${APP_URL}/admin" class="cta">Open Admin Panel</a>
    </div>
    `,
    {
      previewText: `${customerName} accepted quote for "${projectName}" at ${formatINR(acceptedPrice)}`,
      heroPill: 'Order Progress',
      heroTitle: 'Quote Accepted',
      heroSubtitle: `${formatINR(acceptedPrice)} confirmed`,
    }
  );
}

export function vendorApprovedEmail(vendorName: string, loginUrl: string): string {
  return baseLayout(
    `
    <h2 class="title">Welcome to MechHub — You're now a MechMaster!</h2>
    <p class="paragraph">Hi ${vendorName}, congratulations and welcome aboard.</p>
    <p class="paragraph">Your vendor onboarding has been approved. You can now access MechMaster privileges to list manufacturing capabilities and fulfill orders on MechHub.</p>
    <div class="cta-wrap">
      <a href="${loginUrl}" class="cta">Login to MechHub</a>
    </div>
    <p class="meta">Thank you for partnering with MechHub. We look forward to building with you.</p>
    `,
    {
      previewText: 'Your MechHub vendor profile is approved. You are now a MechMaster.',
      heroPill: 'Vendor Approval',
      heroTitle: 'Welcome, MechMaster',
      heroSubtitle: 'Your account is now active',
    }
  );
}

export function vendorRejectedEmail(vendorName: string, reapplyUrl: string): string {
  return baseLayout(
    `
    <h2 class="title">Your MechHub vendor application update</h2>
    <p class="paragraph">Hi ${vendorName}, thank you for applying to join MechHub.</p>
    <p class="paragraph">At this time, your application was not approved. We encourage you to reapply after strengthening your profile and capability details.</p>
    <div class="cta-wrap">
      <a href="${reapplyUrl}" class="cta-outline">Reapply as Vendor</a>
    </div>
    <p class="meta">If you need help preparing your reapplication, reply to this email and our team will assist.</p>
    `,
    {
      previewText: 'Your vendor application was not approved at this time. Reapplication is welcome.',
      heroPill: 'Vendor Update',
      heroTitle: 'Application Status',
      heroSubtitle: 'Reapply any time',
    }
  );
}

export function adminVendorPendingReminderEmail(
  pendingCount: number,
  vendors: Array<{ companyName: string; ownerName: string; submittedAt: string }>,
  reviewUrl: string
): string {
  const rows = vendors
    .map((vendor) => {
      const submittedDate = new Date(vendor.submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      return `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${vendor.ownerName}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">${vendor.companyName}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">${submittedDate}</td>
      </tr>`;
    })
    .join('');

  return baseLayout(
    `
    <h2 class="title">Pending Vendor Reviews</h2>
    <p class="paragraph">There ${pendingCount === 1 ? 'is' : 'are'} currently <strong>${pendingCount}</strong> vendor application${pendingCount === 1 ? '' : 's'} pending review on MechHub.</p>
    <div class="highlight-box" style="padding: 0; overflow: hidden;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc;">
            <th align="left" style="padding: 10px 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #64748b;">Owner</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #64748b;">Company</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #64748b;">Submitted</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="cta-wrap">
      <a href="${reviewUrl}" class="cta">Review Applications</a>
    </div>
    `,
    {
      previewText: `${pendingCount} vendor application(s) pending review on MechHub.`,
      heroPill: 'Action Required',
      heroTitle: 'Vendor Approvals Pending',
      heroSubtitle: `${pendingCount} awaiting review`,
    }
  );
}
