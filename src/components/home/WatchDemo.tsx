'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, X } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/utils';
import { buttonClass } from './button';

// TODO: S3 demo video uses a signed URL — replace with a permanent embed
const VIDEO_URL = 'https://marketing-video-mechhub.s3.eu-north-1.amazonaws.com/DyuglzSvsywR2q3qXDCPiQ.mp4';

/**
 * "Watch demo" button. The video is not loaded until it is clicked; it then opens in a
 * modal dialog and starts playing. Esc, the close button or a click outside closes it
 * and pauses playback. Uses the native <dialog> element for focus trapping.
 */
export function WatchDemo({ className }: { className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      videoRef.current?.pause();
      setOpen(false);
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  // Start playback once the dialog is open and the source is mounted.
  useEffect(() => {
    if (open) videoRef.current?.play().catch(() => {});
  }, [open]);

  const show = () => {
    setOpen(true);
    // The source is only mounted while open, so the video never loads with the page.
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button type="button" onClick={show} className={cn(buttonClass('secondary', 'md', true), className)} aria-haspopup="dialog">
        Watch demo
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg">
          <Play className="size-4" weight="fill" />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="MechHub demo video"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="lp-demo m-auto w-[calc(100%-32px)] max-w-[1200px] overflow-visible bg-transparent p-0 backdrop:bg-lp-ink/80 backdrop:backdrop-blur-sm"
      >
        <div className="relative overflow-hidden rounded-3xl bg-lp-ink">
          <video
            ref={videoRef}
            src={open ? VIDEO_URL : undefined}
            controls
            playsInline
            preload="none"
            className="aspect-video w-full"
          />
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close demo video"
          className="lp-press absolute -top-12 right-0 flex size-10 items-center justify-center rounded-full bg-lp-bg text-lp-fg hover:bg-lp-muted"
        >
          <X className="size-5" weight="bold" />
        </button>
      </dialog>
    </>
  );
}
