import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest){
    const auth = await authenticateRequest(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const limiter = await rateLimit(`admin-test-trigger:${ip}`, 5, 60000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const {post} = await req.json();

    await inngest.send({
        name: 'blog/test.send',
        data:{
            post,
        },
    });

    return NextResponse.json({success: true});
    
}