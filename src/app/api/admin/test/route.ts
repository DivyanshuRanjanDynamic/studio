import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';
import { validatePost } from '@/lib/inngest/validatePost';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest){
    const auth = await authenticateRequest(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const limiter = await rateLimit(`admin-test-trigger:${ip}`, 5, 60000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const body = await req.json();
    const { post } = body || {};

    const validation = validatePost(post);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid post payload', details: validation.errors }, { status: 400 });
    }

    await inngest.send({
        name: 'blog/test.send',
        data:{
            post: validation.sanitized,
        },
    });

    return NextResponse.json({success: true});
    
}