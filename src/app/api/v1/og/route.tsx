import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { logger } from '@/utils/logger';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ?title=<title>&author=<author> — public and unauthenticated, so keep the
    // renderer's input to short plain text (letters, digits, punctuation, spaces).
    const clean = (value: string | null, fallback: string) =>
      (value ?? '').replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, '').trim().slice(0, 120) || fallback;
    const title = clean(searchParams.get('title'), 'MechHub Chronicles');
    const author = clean(searchParams.get('author'), 'MechHub Team');

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#09090b', // zinc-950
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Logo / Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)',
              marginRight: '15px',
            }}
          />
          <span
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-0.05em',
            }}
          >
            MechHub
          </span>
          <span
            style={{
              marginLeft: '10px',
              fontSize: '28px',
              color: '#71717a', // zinc-500
            }}
          >
            / Blog
          </span>
        </div>

        <h1
          style={{
            fontSize: '84px',
            fontWeight: 'bold',
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '40px',
            maxWidth: '900px',
          }}
        >
          {title}
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '30px',
              background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)',
              marginRight: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            {author.charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{author}</span>
            <span
              style={{
                fontSize: '18px',
                color: '#71717a',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Manufacturing Expert
            </span>
          </div>
        </div>

        {/* Decorative corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            display: 'flex',
            fontSize: '20px',
            color: '#3b82f6',
            fontWeight: 'bold',
            opacity: 0.5,
          }}
        >
          mechhub.in
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    logger.error({
      event: 'og_image_generation_failed',
      error: e.message,
      url: req.url,
    });
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
