import Image from 'next/image';
import type { CSSProperties } from 'react';
import { Check, Lightning, SealCheck } from '@phosphor-icons/react/dist/ssr';
import { quoteShowcase } from '@/lib/services/service-facts';

/**
 * About hero visual: what MechHub is, in one frame. A CAD wireframe on the drafting
 * grid turns into real machined parts, with the two things the platform adds on top:
 * an instant quote (live engine output) and a vetted MechMaster.
 */
export function AboutVisual() {
  const showcase = quoteShowcase();
  const ten = showcase.prices.find((p) => p.quantity === 10);

  return (
    <div
      role="img"
      aria-label="A CAD wireframe turning into machined parts, with an instant quote and a verified MechMaster"
      className="lp-blueprint lp-marks relative aspect-[4/3] overflow-hidden rounded-3xl text-lp-primary-fg"
    >
      {/* CAD wireframe */}
      <svg
        viewBox="0 0 160 140"
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 w-3/5 -translate-x-1/2 -translate-y-1/2 opacity-30"
        fill="none"
        stroke="currentColor"
        strokeWidth=".75"
      >
        <path d="M80 10 150 45v60l-70 35-70-35V45z" />
        <path d="M10 45l70 35 70-35M80 80v60" />
        <path d="M30 55l50 25 50-25M30 55v40l50 25 50-25V55" strokeDasharray="2 2" />
        <circle cx="80" cy="62" r="9" />
      </svg>

      <span aria-hidden="true" className="lp-mono absolute left-6 top-6 opacity-70">
        CAD → Part
      </span>
      <span aria-hidden="true" className="lp-mono absolute bottom-6 right-6 opacity-70">
        Made in India
      </span>

      {/* Parts */}
      {[
        { src: '/home/part-1.png', w: 408, cls: 'left-[8%] top-[24%] h-2/5', r0: '-14deg', r1: '-4deg', dur: '8s' },
        { src: '/home/part-4.png', w: 399, cls: 'right-[10%] top-[42%] h-1/3', r0: '6deg', r1: '16deg', dur: '9s' },
        { src: '/home/part-3.png', w: 259, cls: 'left-[46%] top-[34%] h-1/2', r0: '-6deg', r1: '4deg', dur: '7s' },
      ].map((p) => (
        <Image
          key={p.src}
          src={p.src}
          alt=""
          width={p.w}
          height={640}
          sizes="200px"
          className={`lp-tumble absolute w-auto object-contain ${p.cls}`}
          style={{ '--r0': p.r0, '--r1': p.r1, '--dur': p.dur } as CSSProperties}
        />
      ))}

      {/* Quote card */}
      {ten && (
        <div aria-hidden="true" className="absolute right-4 top-4 w-48 rounded-xl bg-lp-bg p-3 text-lp-fg shadow-2xl md:right-6 md:top-6">
          <p className="lp-mono flex items-center gap-1 text-lp-primary">
            <Lightning className="size-3" weight="fill" /> Instant quote
          </p>
          <p className="caption-5 mt-1 text-lp-muted-fg">{showcase.material}</p>
          <p className="title-3 lp-num mt-2">
            {ten.label} <span className="caption-5 text-lp-muted-fg">per part, 10 pcs</span>
          </p>
          {showcase.leadTimeDays && <p className="lp-mono mt-1 text-lp-muted-fg">Ships in {showcase.leadTimeDays} days</p>}
        </div>
      )}

      {/* MechMaster card */}
      <div aria-hidden="true" className="absolute bottom-4 left-4 w-48 rounded-xl bg-lp-bg p-3 text-lp-fg shadow-2xl md:bottom-6 md:left-6">
        <p className="title-5 flex items-center gap-1">
          <SealCheck className="size-4 text-lp-primary" weight="fill" /> Verified MechMaster
        </p>
        <ul className="mt-2 space-y-1">
          {['NDA signed', 'QC inspected'].map((t) => (
            <li key={t} className="caption-5 flex items-center gap-1 text-lp-muted-fg">
              <Check className="size-3 text-lp-primary" weight="bold" /> {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
