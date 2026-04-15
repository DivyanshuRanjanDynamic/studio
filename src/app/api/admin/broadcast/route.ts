import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Authenticate admin caller
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Basic rate limiting per IP for broadcast actions
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limiter = await rateLimit(`admin-broadcast:${ip}`, 3, 60000);
  if (!limiter.success) return rateLimitResponse(limiter.reset);

  const { post } = await req.json();

  await inngest.send({
    name: 'blog/broadcast.send',
    data: { post },
  });

  return NextResponse.json({ success: true });
}
