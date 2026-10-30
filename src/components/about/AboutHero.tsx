import { CtaButton } from '@/components/home/primitives';

const HEADLINE = [
  ['From', 'CAD', 'File'],
  ['to', 'Real', 'Part.'],
];
const ACCENT_WORDS = ['Real', 'Part.'];

// Flat pattern in millimetres. The base and flange meet at the bend line.
const circle = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

const BASE_PATH = `M0 0H120V58a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6Z${circle(14, 50, 4)}${circle(106, 50, 4)}${circle(60, 30, 11)}`;
const FLANGE_PATH = `M0 34V4a4 4 0 0 1 4-4H116a4 4 0 0 1 4 4V34Z${circle(24, 15, 3.2)}${circle(96, 15, 3.2)}`;

const SHEET_LAYERS = [3, 2, 1, 0];

function Sheet({ path, width, height }: { path: string; width: number; height: number }) {
  return (
    <>
      {SHEET_LAYERS.map((layer) => (
        <svg
          key={layer}
          viewBox={`0 0 ${width} ${height}`}
          className="about-sheet about-sheet-fill"
          style={{ transform: `translateZ(${layer * -0.3}cqw)` }}
        >
          <path d={path} fillRule="evenodd" className={layer ? 'about-sheet-edge' : 'about-sheet-top'} />
        </svg>
      ))}
      <svg viewBox={`0 0 ${width} ${height}`} className="about-sheet">
        <path d={path} pathLength={1} className="about-sheet-line" />
      </svg>
    </>
  );
}

/** Blueprint panel: a DXF flat pattern is drawn, cut, then bent into a bracket. CSS only. */
function FoldingPart() {
  return (
    <div
      className="about-blueprint lp-grid-bg lp-hero-fade rounded-sm bg-lp-primary text-lp-primary-fg"
      style={{ animationDelay: '500ms' }}
      role="img"
      aria-label="A flat sheet metal drawing being cut and bent into a finished bracket"
    >
      <div className="about-fold-stage" aria-hidden="true">
        <div className="about-fold-part">
          <div className="about-fold-shadow" />
          <Sheet path={BASE_PATH} width={120} height={64} />
          <svg viewBox="0 0 120 64" className="about-sheet about-dims">
            <path d="M0 72H120M0 69v6M120 69v6" fill="none" />
            <text x="60" y="78" textAnchor="middle">
              120.00
            </text>
            <path d="M0 0H120" fill="none" strokeDasharray="2 1.5" />
            <path d="M68 22l12-12H98" fill="none" />
            <text x="82" y="8.5">
              ⌀ 22
            </text>
            <path d="M126 0V64M123 0h6M123 64h6" fill="none" />
            <text x="131" y="33">
              64.00
            </text>
          </svg>
          <div className="about-fold-flange">
            <Sheet path={FLANGE_PATH} width={120} height={34} />
            <svg viewBox="0 0 120 34" className="about-sheet about-dims">
              <path d="M28 12l10-8H52" fill="none" />
              <text x="39" y="2.5">
                ⌀ 6.4 × 2
              </text>
              <text x="128" y="36">
                BEND 90°
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="lp-label-mono absolute left-4 top-4 flex items-center gap-2 opacity-85">
        <span className="size-1.5 rounded-full bg-lp-primary-fg" />
        Live drawing
      </div>
      <div className="lp-label-mono absolute bottom-4 left-4 h-4 w-40" aria-hidden="true">
        <span className="about-caption">01 · Flat pattern</span>
        <span className="about-caption">02 · Cut to outline</span>
        <span className="about-caption">03 · Bent to shape</span>
      </div>
      <dl className="lp-label-mono absolute bottom-4 right-4 grid grid-cols-[auto_auto] border border-lp-primary-fg/40 bg-lp-primary text-[0.58rem] [&>*]:border-lp-primary-fg/40 [&>*]:px-2 [&>*]:py-1 [&>dd]:border-l [&>dd:not(:last-child)]:border-b [&>dt:not(:nth-last-child(2))]:border-b">
        <dt className="opacity-70">Dwg</dt>
        <dd>MH-001</dd>
        <dt className="opacity-70">Format</dt>
        <dd>DXF</dd>
        <dt className="opacity-70">Rev</dt>
        <dd>A</dd>
      </dl>
    </div>
  );
}

export function AboutHero() {
  return (
    <section className="lp-hero-dots relative overflow-hidden">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-14 sm:px-5 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <span className="lp-tag lp-hero-fade" style={{ animationDelay: '100ms' }}>
            + About MechHub +
          </span>
          <h1 className="mt-6 text-[3.1rem] font-normal leading-[1] tracking-tight sm:text-[4rem] md:text-[5rem] xl:text-[6rem]">
            {HEADLINE.map((line, li) => (
              <span key={li} className="block">
                {line.map((word, wi) => (
                  <span
                    key={wi}
                    className={`lp-hero-word ${ACCENT_WORDS.includes(word) ? 'lp-accent-serif' : ''}`}
                    style={{ animationDelay: `${120 + (li * 3 + wi) * 80}ms` }}
                  >
                    {word}&nbsp;
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="lp-hero-fade mt-6 max-w-xl text-lg text-lp-muted-fg" style={{ animationDelay: '600ms' }}>
            MechHub is a managed marketplace for custom manufacturing in India. Upload a design, get an instant
            quote, and vetted manufacturing partners make your parts and deliver them pan-India.
          </p>
          <div className="lp-hero-fade mt-8 flex flex-wrap gap-3" style={{ animationDelay: '750ms' }}>
            <CtaButton>Upload Your Design</CtaButton>
            <CtaButton href="#how-it-works" ghost>
              See How It Works
            </CtaButton>
          </div>
          <p className="lp-hero-fade lp-label-mono mt-8 text-lp-muted-fg" style={{ animationDelay: '900ms' }}>
            Built in India for students, startups and hobbyists
          </p>
        </div>

        <FoldingPart />
      </div>
    </section>
  );
}
