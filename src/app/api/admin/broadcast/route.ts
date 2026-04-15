import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';
import { validatePost } from '@/lib/inngest/validatePost';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Authenticate admin caller
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Ensure caller has admin role
  if ((auth as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Basic rate limiting per IP for broadcast actions
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limiter = await rateLimit(`admin-broadcast:${ip}`, 3, 60000);
  if (!limiter.success) return rateLimitResponse(limiter.reset);

  const body = await req.json();
  const { post } = body || {};

  // Validate incoming post payload
  const validation = validatePost(post);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Invalid post payload', details: validation.errors }, { status: 400 });
  }

  await inngest.send({
    name: 'blog/broadcast.send',
    data: { post: validation.sanitized },
  });

  return NextResponse.json({ success: true });
}
