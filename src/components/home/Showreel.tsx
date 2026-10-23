'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AudioLines, Play } from 'lucide-react';
import { cn } from '@/utils';
import { CtaButton, Reveal, Tag } from './primitives';

// TODO: S3 demo video uses a signed URL — replace with a permanent embed
const VIDEO_URL = 'https://marketing-video-mechhub.s3.eu-north-1.amazonaws.com/DyuglzSvsywR2q3qXDCPiQ.mp4';

// Start/end seconds match the scenes in the launch video.
const CHAPTERS = [
  { start: 0, end: 10, title: 'Upload your design', body: 'Drop a STEP, DXF or DWG file into an NDA-protected portal.' },
  { start: 10, end: 14, title: 'Get a price in seconds', body: 'Pick the process, material and thickness. The quote updates instantly.' },
  { start: 14, end: 17, title: 'See every rupee', body: 'Material, cut length, pierces and setup, line by line. No hidden fees, ever.' },
  { start: 17, end: 21.5, title: 'Receive your parts', body: 'Made at a vetted facility and delivered in 72 hours on average.' },
];

const STATS = [
  ['500+', 'Parts Delivered'],
  ['14+', 'Materials in Stock'],
  ['72hr', 'Avg. Turnaround'],
  ['100%', 'NDA Protected'],
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const stamp = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

/** Launch video on the left; chapters synced to playback (click to seek) on the right. */
export function Showreel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  const playFrom = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    setTime(seconds);
    setStarted(true);
    video.play().catch(() => { });
  };

  const current = CHAPTERS.findIndex((c) => time >= c.start && time < c.end);
  const active = started ? current : 0;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-5 md:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-16">
        {/* Video + stats */}
        <div>
          <Reveal className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-lp-ink shadow-[0_40px_80px_-40px_rgba(10,20,60,0.45)]">
            <video
              ref={videoRef}
              src={VIDEO_URL}
              poster="/brag.jpg"
              preload="none"
              playsInline
              controls={started}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {!started && (
              <button
                onClick={() => playFrom(0)}
                aria-label="Play MechHub demo video"
                className="absolute inset-0 text-left"
              >
                <Image
                  src="/brag.jpg"
                  alt="MechHub launch video: from .dxf to metal"
                  fill
                  sizes="(min-width: 1400px) 800px, (min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition-transform duration-[3s] group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-lp-ink/60 via-transparent to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-lp-bg text-lp-primary shadow-2xl transition-transform group-hover:scale-110 sm:size-16">
                  <span className="absolute inset-0 animate-ping rounded-full bg-lp-bg/50" />
                  <Play className="relative size-5 fill-current sm:size-6" />
                </span>
                <span className="lp-label-mono absolute bottom-5 left-5 hidden items-center gap-2 text-lp-ink-fg/90 sm:flex">
                  <AudioLines className="size-3.5" /> Sound on · 0:21
                </span>
              </button>
            )}
          </Reveal>

          <Reveal delay={150} className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-lp-border bg-lp-border sm:grid-cols-4">
            {STATS.map(([value, label]) => (
              <div key={label} className="bg-lp-bg px-5 py-4">
                <p className="text-3xl tracking-tight">{value}</p>
                <p className="lp-label-mono mt-1 text-lp-muted-fg">{label}</p>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Chapters */}
        <div>
          <Reveal>
            <Tag>The Showreel</Tag>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 text-[2.6rem] leading-[0.95] tracking-tight md:text-[3.4rem]">
              File to <span className="lp-accent-serif">factory</span>, in 21 seconds.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-4 max-w-md text-sm text-lp-muted-fg">
              Watch one part go through MechHub. Tap a step to jump straight to it.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <ol className="mt-8 border-t border-lp-border">
              {CHAPTERS.map((chapter, i) => {
                const isActive = i === active;
                const progress = started ? clamp01((time - chapter.start) / (chapter.end - chapter.start)) : 0;
                return (
                  <li key={chapter.title}>
                    <button
                      onClick={() => playFrom(chapter.start)}
                      aria-current={isActive && playing ? 'step' : undefined}
                      className="group/ch relative w-full border-b border-lp-border py-4 text-left"
                    >
                      <div className="flex gap-5">
                        <span
                          className={cn(
                            'w-10 font-lp-serif text-3xl italic leading-none transition-colors duration-500',
                            isActive ? 'text-lp-primary' : 'text-lp-primary/25 group-hover/ch:text-lp-primary/60'
                          )}
                        >
                          0{i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between gap-4">
                            <h3
                              className={cn(
                                'text-lg transition-colors duration-500 md:text-xl',
                                isActive ? 'text-lp-fg' : 'text-lp-muted-fg group-hover/ch:text-lp-fg'
                              )}
                            >
                              {chapter.title}
                            </h3>
                            <span className="lp-label-mono flex items-center gap-1.5 text-lp-muted-fg">
                              {isActive && playing && <span className="size-1.5 animate-pulse rounded-full bg-lp-primary" />}
                              {stamp(chapter.start)}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'grid transition-all duration-500',
                              isActive ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            )}
                          >
                            <p className="overflow-hidden text-sm text-lp-muted-fg">{chapter.body}</p>
                          </div>
                        </div>
                      </div>
                      <span
                        className="absolute -bottom-px left-0 h-0.5 bg-lp-primary transition-[width] duration-300 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          <Reveal delay={250} className="mt-8">
            <CtaButton href="/quote/instant">Start your quote</CtaButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
