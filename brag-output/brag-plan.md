# MechHub — brag plan

**What it is:** Upload a CAD file, get an instant price for laser-cut or CNC parts, and get them made and delivered in India.
**Who for:** Students, startups and hobbyists who need real parts without minimums or haggling.
**What sets it apart:** Price in seconds, with the full cost breakdown shown: material, cutting time, pierces, setup.
**Most impressive claim (from the site):** "72hr avg. turnaround", "No minimums. No negotiation."
**Visual hook:** A DXF outline draws itself on a blueprint grid, then turns into a real machined part.
**Tone:** `default`: punchy, playful, clean. 120 BPM, soft transitions.
**Format:** 1920×1080, 30fps, 21s.

## Angle
The file-to-part flow, shown with MechHub's own UI: drop a file, get a price in seconds, see every cost line.

## Visual identity (from `landing.css`)
- Background `oklch(99% 0.002 260)`, ink `oklch(12% 0.005 265)`, primary blue `oklch(48% 0.24 264)`, accent `oklch(92% 0.04 264)`
- Geist (sans), Geist Mono uppercase labels, Instrument Serif italic accent words
- Near-square corners, dotted hero background, blue grid on the CTA
- Real assets: `mechhub.png` logo, `home/part-1..5.png` machined parts

## Storyboard (beats at 120 BPM, 1 bar = 2s)
| # | Time | Scene | On screen |
|---|---|---|---|
| 1 | 0.0–3.0 | **Hook** | Dark blueprint grid. A bracket outline draws itself in blue with dimension ticks; label `drone-plate.dxf`. It flashes into the real metal part. Text: "From **.dxf**" → "to *metal*." |
| 2 | 3.0–6.0 | **Reveal** | Landing hero rebuilt: "Custom *Manufacturing* / Made Fast & / Affordable" rising word by word, the parts strip floating below, MechHub logo in the corner. |
| 3 | 6.0–9.5 | **Highlight 1: Upload** | Instant Quote screen: stepper, "Upload CAD Files" dropzone. A cursor drags `drone-plate.dxf` in; the dropzone lights up; the file row lands with ✓ and `366×382mm · 11 holes`. Label: "01 — Drop your file". |
| 4 | 9.5–13.5 | **Highlight 2: Price** | The cursor picks Laser Cutting → Mild Steel → 0.8 mm. The "Your Quote" panel slides in; the price counts up to ₹3,286; Per part / Quantity / 3 Days lead time. Label: "02 — Price in seconds". |
| 5 | 13.5–16.5 | **Highlight 3: Breakdown** | "Laser Cutting Cost & Time Breakup": three cards stagger in (Sheet material ₹473/unit, Laser cutting 1.93 m · 11 pierces, Setup & nesting). Label: "03 — No hidden fees, ever." |
| 6 | 16.5–21.0 | **Punchline / outro** | Blue grid CTA: "Ready to Build *Something Real?*" then badges ✓ No Minimums · ✓ 72hr Turnaround · ✓ NDA Protected · ✓ Made in India, then logo + mechhub.in. |

## Data handling
- The file name `drone-plate.dxf` and quote ref `MH-Q-2481` are fictional stand-ins.
- The quote figures (₹3,286, Mild Steel 0.8 mm, 366×382 mm, 1.93 m cut, 11 pierces, 3 days) match a sample quote from the app's own review screen.
- No customer names, emails, keys or internal URLs.

## Sound
A minor at 120 BPM: soft four-on-the-floor kick, plucked arpeggio, warm pad and sub bass. In-key ticks on the cursor clicks, a filtered-noise whoosh on each cut, a riser into the reveal, and a soft chord "ding" when the price settles.
