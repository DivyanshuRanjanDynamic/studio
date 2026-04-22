import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'MechHub <outreach@mechhub.in>';
  
  console.log('API Key:', apiKey ? 'Present' : 'Missing');
  console.log('From:', from);

  if (!apiKey) {
    console.error('RESEND_API_KEY is missing');
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: ['divyanshuchannel2@gmail.com'],
      subject: 'Resend Test from MechHub',
      html: '<p>If you see this, Resend is working correctly.</p>',
    });

    if (error) {
      console.error('Resend Error:', error);
    } else {
      console.log('Resend Success:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testResend();
