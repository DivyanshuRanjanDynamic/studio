import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';

export async function POST(req: NextRequest){
    const {post} = await req.json();

    await inngest.send({
        name: 'blog/test.send',
        data:{
            post,
        },
    });

    return NextResponse.json({success: true});
}