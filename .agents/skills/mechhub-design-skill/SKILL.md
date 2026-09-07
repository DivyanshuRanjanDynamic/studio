---
name: mechhub-design-system
description: Use whenever building, redesigning, or extending any page/component for MechHub. Encodes the exact brand color palette, typography, spacing, and card/motion patterns extracted from mechhub.in so all new UI stays visually consistent with the live site.
---

# MechHub Design System

MechHub's visual identity is: **industrial-editorial**. A confident navy/blue brand color paired
with a classic serif for headlines (engineering-meets-craftsmanship feel), a clean grotesque
sans for body copy, and a single bright cyan accent used sparingly for emphasis and data points.
Sections alternate between light (off-white) and dark (deep navy) backgrounds to create rhythm
as the user scrolls. Cards are soft, white, rounded, and lift gently on hover.

Do not introduce new brand hues (no purple, no green-as-primary, no orange-as-primary). Green,
orange, and yellow appear ONLY as small functional icon accents (success checks, package icon),
never as backgrounds or buttons.

## Color Tokens

Use these as CSS variables (`:root` + a `.dark-section` scope) — never hardcode hex values inline.

```css
:root {
  /* Brand blues */
  --mh-navy-900: #101d33;   /* darkest navy — dark section backgrounds, deepest gradient stop */
  --mh-navy-800: #16283e;   /* dark section background base */
  --mh-navy-700: #1b3357;   /* dark card background on navy sections */
  --mh-navy-600: #22406e;   /* hero gradient start */
  --mh-blue-500: #2e5596;   /* primary buttons, links, primary brand blue */
  --mh-blue-400: #3d6fb4;   /* hero gradient end / lighter blue accents */
  --mh-blue-300: #6f95c9;   /* muted blue text on dark backgrounds */

  /* Accent */
  --mh-cyan-400: #4fd8e8;   /* eyebrow highlights, stat numbers, "14+" style call-outs */
  --mh-cyan-300: #8fe9f1;   /* hover/lighter cyan variant */

  /* Neutrals */
  --mh-white: #ffffff;
  --mh-bg-light: #f7f9fc;   /* default page background, light section bg */
  --mh-bg-muted: #eef1f6;   /* secondary light surface, input fills */
  --mh-border: #e4e8f0;     /* card borders on light sections */
  --mh-border-dark: #2a3a56; /* card borders on dark/navy sections */

  /* Text */
  --mh-text-heading: #14213d;  /* near-black navy, serif headings */
  --mh-text-body: #64748b;     /* slate gray body copy on light bg */
  --mh-text-body-dark: #aab6c9; /* body copy on navy/dark bg */
  --mh-text-on-dark: #ffffff;

  /* Functional (icons/status only — never as primary UI color) */
  --mh-success: #16a34a;
  --mh-success-bg: #e9f7ee;
  --mh-warning-accent: #f59e0b;
  --mh-warning-bg: #fdf3d9;
  --mh-info-bg: #e9effb;      /* pale blue icon chip background */
}
```

**Gradient recipe** (hero + dark stat sections): `linear-gradient(135deg, var(--mh-navy-600) 0%, var(--mh-blue-400) 100%)` — always diagonal, never flat, never radial for full-bleed sections.

## Typography

- **Headings (h1–h3, section titles):** a classic serif — e.g. `"Playfair Display", "Georgia", serif` — bold weight, tight tracking, `color: var(--mh-text-heading)`. Reserve serif exclusively for editorial-feel headings ("We Work With Transparency", "See How It Works", "What Are You Building?").
- **Hero display headline only:** a heavy, condensed, all-caps grotesque sans (e.g. `"Archivo Black", "Inter", sans-serif` at 800–900 weight) for maximum impact — this is the one exception where sans dominates over serif, used only for the very top hero statement.
- **Body copy, nav, buttons, labels:** clean grotesque sans (e.g. `"Inter", "Helvetica Neue", sans-serif`), `color: var(--mh-text-body)` on light backgrounds, `var(--mh-text-body-dark)` on navy backgrounds.
- **Eyebrow / kicker labels** (e.g. "EXPERT SUPPORT", "FOR EVERY BUILDER", "INDUSTRIAL CATALOG"): small caps, `letter-spacing: 0.12em`, `font-size: 0.75rem`, `font-weight: 600`, colored `var(--mh-blue-500)` on light bg or `var(--mh-cyan-400)` on dark bg, often wrapped in a soft pill badge with `var(--mh-info-bg)` fill.

## Layout & Spacing

- Base spacing unit: 4px. Section vertical padding: 96–128px desktop, 64px mobile.
- Content max-width: ~1200–1280px, centered.
- Corner radius scale: `--radius-sm: 8px` (chips/badges), `--radius-md: 16px` (buttons — but buttons are fully pill-shaped, `border-radius: 999px`), `--radius-lg: 20px` (cards), `--radius-xl: 28px` (large feature panels like the hero image frame).
- Section rhythm: alternate light (`--mh-bg-light`) → dark (`--mh-navy-800` gradient) → light, to create visual pacing as established on the live site (hero dark → "what are you building" light → services dark → materials dark navy → transparency light → designed-for dark blue → consultation light).

## Component Patterns

### Buttons
- Primary: pill-shaped, `background: var(--mh-blue-500)`, white text, bold, trailing arrow icon (`→`) that shifts 4px right on hover.
- Secondary (on dark hero): pill-shaped, white background, `color: var(--mh-blue-500)` text.
- Hover: darken fill by ~8%, add subtle `box-shadow: 0 8px 20px rgba(46,85,150,0.25)`, 150ms ease-out transition.

### Cards
- Light-section cards: `background: var(--mh-white)`, `border: 1px solid var(--mh-border)`, `border-radius: var(--radius-lg)`, soft shadow `0 4px 24px rgba(20,33,61,0.06)`.
- Dark-section cards (services/materials grid): `background: var(--mh-navy-700)` or a subtle navy gradient tile, `border: 1px solid var(--mh-border-dark)`, same radius.
- Icon chips inside cards: small rounded-square (`border-radius: 12px`) filled with a pale tint (`--mh-info-bg` blue or `--mh-warning-bg` yellow) housing a line icon in `--mh-blue-500`.
- **Hover transition (required on every interactive card):** `transform: translateY(-4px)`, shadow deepens, 200ms `cubic-bezier(0.4, 0, 0.2, 1)`. For image/media cards (services grid), also scale the inner image `1.0 → 1.06` with `overflow: hidden` on the parent, same duration, no delay.
- Numbered capability cards (e.g. "01 Precision Sheet Cutting"): number badge is a small translucent dark chip (`rgba(255,255,255,0.1)` on navy) pinned top-left of the image area.

### Badges / Pills
- Status/eyebrow pills: pale tinted background matching the token above, fully rounded, small caps text, occasionally a leading dot indicator (`•`) in the accent color.

### Motion Guidance for Antigravity
When asked to add "innovative" transitions on this site, stay inside this system rather than introducing arbitrary new colors or effects:
- Card hover lift + shadow deepen (above) — use everywhere.
- Staggered fade-up on scroll for grid items (services, materials, "what are you building"): 60–80ms stagger, `opacity 0→1` + `translateY(16px→0)`, ease-out, trigger via IntersectionObserver.
- Number/stat counters (e.g. "14+ materials", "1 → 10k+ parts") should count up when scrolled into view rather than appearing static.
- Filter pills (materials page: ALL / ALUMINUM / STEEL...) should animate the active-state pill with a sliding background indicator rather than an instant color swap.
- Avoid: bouncy/elastic easing, neon glow effects, gradient-shifting text, or any color outside the token list — none of these match MechHub's precision-engineering tone.

## Forbidden Patterns
- No purple/violet anywhere.
- No flat (non-gradient) full-bleed hero background — the brand always uses the diagonal navy→blue gradient.
- No thin/light-weight serif for the hero headline — serif is reserved for secondary section headings only.
- No sharp 0px corners — everything in this system is rounded.
- No default browser focus outlines — replace with a `2px solid var(--mh-cyan-400)` focus ring for accessibility that still matches the brand.
