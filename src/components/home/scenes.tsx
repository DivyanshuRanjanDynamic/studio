import Image from 'next/image';
import { Check, CheckCircle, FileCode, LockKey, SealCheck, UploadSimple } from '@phosphor-icons/react/dist/ssr';
import type { quoteShowcase } from '@/lib/services/service-facts';
import { cn } from '@/utils';

/*
 * Product scenes for "How it works": small, faithful mockups of the MechHub upload,
 * quote and tracking screens on the blueprint grid, instead of stock photos that
 * showed unrelated processes. Purely visual, so each is aria-hidden; the step text
 * next to it carries the meaning.
 */

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('lp-blueprint lp-marks relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl p-4 text-lp-primary-fg', className)}>
      {children}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('w-full max-w-[280px] rounded-xl bg-lp-bg p-3 text-lp-fg shadow-2xl', className)}>{children}</div>;
}

export function UploadScene() {
  return (
    <Frame>
      <Card>
        <div className="flex items-center justify-between">
          <span className="title-5">New part</span>
          <span className="lp-mono flex items-center gap-1 text-lp-primary">
            <LockKey className="size-3" weight="bold" /> NDA
          </span>
        </div>
        <div className="mt-2 flex flex-col items-center gap-1 rounded-lg border border-dashed border-lp-primary/40 bg-lp-primary/5 px-2 py-3">
          <UploadSimple className="size-5 text-lp-primary" weight="bold" />
          <span className="caption-5 text-lp-muted-fg">Drop a STEP file</span>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-lp-border px-2 py-2">
          <FileCode className="size-4 shrink-0 text-lp-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="caption-4 truncate">bracket_v3.step</span>
              <CheckCircle className="size-3 shrink-0 text-lp-primary" weight="fill" />
            </div>
            <div className="mt-1 h-1 rounded-full bg-lp-primary" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {['Laser cutting', 'Aluminium 5052', '2 mm'].map((c) => (
            <span key={c} className="lp-mono rounded bg-lp-muted px-1 py-0.5 text-lp-muted-fg">
              {c}
            </span>
          ))}
        </div>
      </Card>
    </Frame>
  );
}

export function QuoteScene({ showcase }: { showcase: ReturnType<typeof quoteShowcase> }) {
  const rows: [string, string][] = [
    ['Material', showcase.material],
    ['Cut length', `${showcase.cutLengthMm} mm`],
    ['Pierces', String(showcase.pierces)],
    ['Lead time', showcase.leadTimeDays ? `${showcase.leadTimeDays} days` : 'On quote'],
  ];
  return (
    <Frame>
      <Card>
        <div className="flex items-center justify-between">
          <span className="title-5">Instant quote</span>
          <span className="lp-mono rounded bg-lp-primary px-1 py-0.5 text-lp-primary-fg">Live</span>
        </div>
        <dl className="mt-2 divide-y divide-lp-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 py-1">
              <dt className="caption-5 text-lp-muted-fg">{k}</dt>
              <dd className="caption-4 lp-num">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {showcase.prices.map((p) => (
            <div
              key={p.quantity}
              className={cn('rounded-lg px-1 py-2 text-center', p.quantity === 10 ? 'bg-lp-primary text-lp-primary-fg' : 'bg-lp-muted')}
            >
              <div className="lp-mono opacity-70">{p.quantity} pc</div>
              <div className="title-5 lp-num mt-0.5">{p.label}</div>
            </div>
          ))}
        </div>
        <p className="caption-5 mt-2 text-lp-muted-fg">Per part, excl. GST</p>
      </Card>
    </Frame>
  );
}

const STAGES = ['Quote approved', 'MechMaster assigned', 'In production', 'Quality checked', 'Shipped'];

export function DeliveryScene() {
  const current = 2;
  return (
    <Frame className="justify-start">
      <Card className="relative z-10 max-w-[200px]">
        <div className="flex items-center justify-between gap-2">
          <span className="title-5">Order status</span>
          <span className="lp-mono rounded bg-lp-primary/10 px-1 py-0.5 text-lp-primary">Live</span>
        </div>
        <ol className="mt-2 space-y-1">
          {STAGES.map((s, i) => (
            <li key={s} className={cn('caption-5 flex items-center gap-2', i > current && 'text-lp-muted-fg/60')}>
              <span
                className={cn(
                  'flex size-3 shrink-0 items-center justify-center rounded-full',
                  i < current ? 'bg-lp-primary text-lp-primary-fg' : i === current ? 'border-2 border-lp-primary' : 'border border-lp-border'
                )}
              >
                {i < current && <Check className="size-2" weight="bold" />}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-2 flex items-center gap-1 border-t border-lp-border pt-2 text-lp-primary">
          <SealCheck className="size-3" weight="fill" />
          <span className="lp-mono">Verified MechMaster</span>
        </div>
      </Card>
      <Image
        src="/home/part-1.png"
        alt=""
        width={408}
        height={640}
        sizes="120px"
        className="lp-tumble absolute -right-2 bottom-2 h-40 w-auto object-contain md:h-48"
      />
    </Frame>
  );
}
