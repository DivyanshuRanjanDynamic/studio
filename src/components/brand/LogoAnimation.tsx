import { cn } from '@/utils';

const WORD = 'MechHub';

// Gear and "M" geometry from public/mechhub-logo-small.svg, split so each piece can move.
const GEAR_POINTS =
  '96.63,102.36 97.41,96.15 102.59,96.15 103.37,102.36 108.68,104.56 113.62,100.72 117.28,104.38 113.44,109.32 115.64,114.63 121.85,115.41 121.85,120.59 115.64,121.37 113.44,126.68 117.28,131.62 113.62,135.28 108.68,131.44 103.37,133.64 102.59,139.85 97.41,139.85 96.63,133.64 91.32,131.44 86.38,135.28 82.72,131.62 86.56,126.68 84.36,121.37 78.15,120.59 78.15,115.41 84.36,114.63 86.56,109.32 82.72,104.38 86.38,100.72 91.32,104.56';

function MHalf() {
  return (
    <>
      <path fill="#fff" stroke="#0f46e1" strokeWidth="5" strokeLinejoin="round" d="M36 53L62 79V152H30L36 134Z" />
      <path fill="#fff" d="M58 94H62L71 95.5V104.5L62 106H58ZM58 116H62L71 117.5V126.5L62 128H58ZM58 138H62L71 139.5V148.5L62 150H58Z" />
      <path fill="#fff" stroke="#0f46e1" strokeWidth="5" strokeLinejoin="round" d="M36 38H66L100 72V112L36 48Z" />
    </>
  );
}

/**
 * Animated MechHub logo (reference: a mark that spins in from a blur, settles at centre
 * stage, then slides left as the wordmark types in). Pure CSS keyframes in landing.css,
 * so it runs without JavaScript; sized by font-size (the mark is 1.4em tall).
 */
export function LogoAnimation({ className }: { className?: string }) {
  return (
    <div className={cn('lp-logo-anim', className)} role="img" aria-label="MechHub">
      <span className="lp-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 200 200" className="lp-logo-tile">
          <rect width="200" height="200" rx="10" fill="#0f46e1" />
          <g className="lp-logo-m lp-logo-m-left">
            <MHalf />
          </g>
          <g transform="matrix(-1 0 0 1 200 0)">
            <g className="lp-logo-m lp-logo-m-right">
              <MHalf />
            </g>
          </g>
          <g className="lp-logo-gear">
            <polygon points={GEAR_POINTS} fill="#fff" stroke="#0f46e1" strokeWidth="5" strokeLinejoin="round" />
            <circle cx="100" cy="118" r="6" fill="#0f46e1" />
          </g>
        </svg>
      </span>
      <span className="lp-logo-word" aria-hidden="true">
        {WORD.split('').map((ch, i) => (
          <span key={i} className="lp-logo-letter" style={{ animationDelay: `${1450 + i * 55}ms` }}>
            {ch}
          </span>
        ))}
      </span>
    </div>
  );
}
