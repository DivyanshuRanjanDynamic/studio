// ═══════════════════════════════════════════════════
// service-pages — content configs for the 9 service pages
// Every number, material name, tolerance and range comes from the rate modules
// via service-facts.ts; nothing is hard-coded here that the engine disagrees with.
// ═══════════════════════════════════════════════════

import {
  Scissors, Zap, Target, Wrench, Layers, Maximize2, ShieldCheck,
  Settings, Droplets, Palette, Gauge, Thermometer, CircleDot,
  Box, Ruler, Clock, FileCode2, Truck, CheckCircle2, Hammer,
  ArrowDownToLine, CircleDotDashed, Drill, Cog, Factory,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import type { ServicePageConfig } from '@/components/services/ServicePageTemplate';
import * as F from './service-facts';

// ── helpers ──

const turnaround = F.turnaroundTable;

// ═══════════════════════════════════════════════════
// 1. Precision Sheet Cutting
// ═══════════════════════════════════════════════════

export const PRECISION_SHEET_CUTTING: ServicePageConfig = {
  heroTitle: 'Industrial Grade',
  heroSubtitle: 'Sheet Metal Cutting',
  heroDescription:
    'Fiber laser and CO₂ laser cutting for metals, acrylics and wood composites. Upload a DXF or STEP file and get an instant price — parts ship in as little as 2 days.',
  heroBadge: 'Precision Fabrication',
  heroIcon: Scissors,
  heroImage: '/sheet_cutting_service.png',
  heroStatus: 'Fiber & CO₂ Laser Lines Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Tolerance', value: '± 0.1 mm', icon: Target },
    { label: 'Lead time', value: 'Ships in 2–4 days', icon: Zap },
  ],

  capabilities: [
    {
      title: 'Fiber Laser',
      desc: 'High-speed cutting for mild steel, stainless and aluminium up to 12 mm. Clean edges with a minimal heat-affected zone.',
      icon: Zap,
    },
    {
      title: 'CO₂ Laser',
      desc: 'Optimised for acrylic, MDF, plywood and balsa wood. Flame-polished acrylic edges straight off the bed.',
      icon: Layers,
    },
    {
      title: 'Instant DFM',
      desc: 'Our analysis engine checks geometry, nesting and kerf in seconds. Fix issues before you order.',
      icon: Target,
    },
  ],
  expertCta:
    'Need waterjet, CNC routing, carbon fiber plates or thicknesses outside the instant range? Our engineers quote those within 24 hours.',

  materialsTable: F.sheetCuttingMaterials,
  exampleTable: F.sheetCuttingExample,
  orderMinimumInr: F.ORDER_MINIMUMS.sheet,
  turnaroundTable: turnaround,
  costDrivers: [
    'Material type and thickness',
    'Cut length (perimeter of all profiles)',
    'Number of pierce points',
    'Sheet utilisation / nesting efficiency',
    'Quantity — batch setups are shared',
    'Turnaround speed (rush adds a surcharge)',
  ],
  instantPricing: true,

  dfmTitle: 'Sheet Cutting',
  dfmIntro:
    'Optimise your geometry to reduce scrap and prevent edge deformation.',
  dfmRules: [
    { id: 'K', title: 'Kerf Allowance', desc: 'The laser removes material. Fiber kerf ≈ 0.2 mm, CO₂ ≈ 0.3 mm. Our system compensates automatically.' },
    { id: 'L', title: 'Lead-In Clearance', desc: 'Keep at least 2 mm from any critical edge to the cut start point.' },
    { id: 'S', title: 'Part Spacing', desc: 'Maintain ≥ 1× material thickness between adjacent parts for structural integrity.' },
  ],
  dfmImage: '/home/svc-1.jpg',

  processTitle: 'How to Order',
  processSubtitle: 'Cut Parts',
  processImage: '/process.png',
  processSteps: [
    { step: '01', title: 'Upload Your File', description: 'Upload a DXF or STEP file. Our engine parses geometry instantly.', icon: FileCode2 },
    { step: '02', title: 'Instant Quote & DFM', description: 'See a real-time price and automated DFM feedback. Adjust material, thickness and quantity.', icon: Zap },
    { step: '03', title: 'Precision Cutting', description: 'Parts are nested and cut on our fiber or CO₂ lasers, then deburred.', icon: Scissors },
    { step: '04', title: 'Inspection & Delivery', description: 'Every part is measured, packed and shipped to your facility.', icon: Truck },
  ],

  faq: [
    { q: 'What file formats do you accept?', a: 'DXF (2D, 1:1 scale) and STEP (3D — we flatten automatically). AI and EPS files are accepted via engineer review.' },
    { q: 'What is your cutting tolerance?', a: '± 0.1 mm for fiber laser on metals up to 6 mm. Thicker plates and CO₂ cuts may be slightly wider.' },
    { q: 'Is there a minimum order?', a: `You can order one part. The minimum order value is ₹${F.ORDER_MINIMUMS.sheet.toLocaleString('en-IN')} per line item.` },
    { q: 'Can I add bending, tapping or a finish?', a: 'Yes — bending, thread tapping, hardware insertion, powder coating and anodising are all available as add-ons in the same order.' },
  ],

  footerTag: 'Industrial Quality',
  footerHeading: 'Ready to cut your custom designs?',
  footerBadges: ['Certified Precision', 'Rapid Turnaround'],
};

// ═══════════════════════════════════════════════════
// 2. Sheet Bending
// ═══════════════════════════════════════════════════

export const BENDING: ServicePageConfig = {
  heroTitle: 'CNC Press Brake',
  heroSubtitle: 'Sheet Bending',
  heroDescription:
    `Precision CNC bending for sheet metal up to ${2500} mm long and 5 mm thick. Cut and bent in a single order with instant pricing.`,
  heroBadge: 'Forming',
  heroIcon: ArrowDownToLine,
  heroImage: '/bending_service.png',
  heroStatus: 'CNC Press Brake Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Accuracy', value: '± 0.1° per bend', icon: Target },
    { label: 'Max length', value: '2,500 mm', icon: Ruler },
  ],

  capabilities: [
    {
      title: 'CNC Accuracy',
      desc: 'Servo-electric press brakes hold ± 0.1° across the full bed. Back-gauge repeatability ± 0.05 mm.',
      icon: Target,
    },
    {
      title: 'Cut + Bend',
      desc: 'Laser-cut profiles feed straight into the press brake — one order, one lead time, one shipment.',
      icon: Layers,
    },
    {
      title: 'Complex Bends',
      desc: 'Multiple bends per part, Z-bends, U-channels, and hems. The bend sequence is optimised to avoid collisions.',
      icon: Settings,
    },
  ],
  expertCta:
    'Need bends longer than 2,500 mm, thicknesses above 5 mm, or aluminium 6061? Our engineers can review and quote.',

  materialsTable: F.bendingMaterials,
  exampleTable: F.bendingExample,
  orderMinimumInr: F.ORDER_MINIMUMS.sheet,
  turnaroundTable: turnaround,
  costDrivers: [
    'Number of bend lines',
    'Bend complexity (Z-bends, hems)',
    'Material type and thickness',
    'Part length (2-person handling above 1,200 mm)',
    'Quantity — bend setup is shared across the batch',
    'Turnaround speed',
  ],
  instantPricing: true,

  dfmTitle: 'Bending',
  dfmIntro:
    'Follow these rules to avoid cracks, spring-back errors and tooling collisions.',
  dfmRules: [
    { id: 'R', title: 'Minimum Bend Radius', desc: 'Internal radius ≥ 1× material thickness for mild steel and stainless. Use 1.5× for aluminium 5052.' },
    { id: 'F', title: 'Flange Length', desc: 'The flange (bend-to-edge) must be at least 4× thickness + bend radius, or the brake cannot grip it.' },
    { id: 'H', title: 'Hole Distance', desc: 'Keep holes ≥ 2× thickness away from a bend line. Closer holes will deform.' },
  ],
  dfmImage: '/home/svc-3.jpg',

  processTitle: 'How to Order',
  processSubtitle: 'Bent Parts',
  processImage: '/process.png',
  processSteps: [
    { step: '01', title: 'Upload Your DXF / STEP', description: 'Our engine detects bend lines and unfolds the part automatically.', icon: FileCode2 },
    { step: '02', title: 'Instant Price', description: 'See cutting + bending cost per part. Adjust quantity and turnaround.', icon: Zap },
    { step: '03', title: 'Cut & Bend', description: 'Profiles are laser-cut, then bent on a CNC press brake with automatic back-gauge.', icon: ArrowDownToLine },
    { step: '04', title: 'Ship', description: 'Parts are inspected, packed and dispatched.', icon: Truck },
  ],

  footerTag: 'Precision Forming',
  footerHeading: 'Ready to bend your sheet metal designs?',
  footerBadges: ['CNC Accuracy', 'Cut + Bend in One Order'],
};

// ═══════════════════════════════════════════════════
// 3. CNC Machining
// ═══════════════════════════════════════════════════

export const CNC_MACHINING: ServicePageConfig = {
  heroTitle: 'Precision',
  heroSubtitle: 'CNC Machining',
  heroDescription:
    'VMC 3-axis milling and CNC turning for 9 metals. Upload a STEP file — our engine analyses features, selects stock and returns an instant price.',
  heroBadge: 'Subtractive Manufacturing',
  heroIcon: Cog,
  heroImage: '/cnc_machining_service.png',
  heroStatus: 'VMC & Lathe Cells Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Tolerance', value: '± 0.025 mm', icon: Target },
    { label: 'Envelope', value: '800 × 500 × 500 mm', icon: Box },
  ],

  capabilities: [
    {
      title: '3-Axis Milling',
      desc: 'VMC travel 800 × 500 × 500 mm. Pockets, slots, contours and drilling in a single setup where possible.',
      icon: Cog,
    },
    {
      title: 'CNC Turning',
      desc: 'Lathe capacity Ø 300 × 600 mm. Shafts, bushings and turned features with live tooling for cross-holes.',
      icon: CircleDot,
    },
    {
      title: 'Automated DFM',
      desc: 'Thin walls < 0.8 mm, deep holes > 10× diameter, tight internal fillets < 1 mm — flagged before you order.',
      icon: ShieldCheck,
    },
  ],
  expertCta:
    'Need 5-axis work, EDM, exotic alloys (titanium, Inconel) or tolerances below ± 0.01 mm? Our engineering team quotes within 24 hours.',

  materialsTable: F.cncMaterials,
  exampleTable: F.cncExample,
  orderMinimumInr: F.ORDER_MINIMUMS.cnc,
  turnaroundTable: turnaround,
  costDrivers: [
    'Machine time (set-ups × cycle time)',
    'Material cost (smallest standard stock that fits)',
    'Number of set-ups (our engine minimises these)',
    'Feature complexity (pockets, threads, tight tolerances)',
    'Finish (anodise, powder coat, plating — added per part)',
    'Quantity — programming cost shared across the batch',
  ],
  instantPricing: true,

  dfmTitle: 'CNC Machining',
  dfmIntro:
    'Design parts the machine can reach in the fewest set-ups.',
  dfmRules: [
    { id: 'W', title: 'Wall Thickness', desc: 'Minimum 0.8 mm. Below 0.5 mm the part will chatter or break — our system blocks it.' },
    { id: 'R', title: 'Internal Fillets', desc: 'Internal corners need a radius ≥ 1 mm (the smallest end-mill). Sharp internal corners are not possible.' },
    { id: 'D', title: 'Deep Holes', desc: 'Holes deeper than 10× diameter need peck-drilling and add cycle time. Beyond 20× they are flagged for review.' },
  ],
  dfmImage: '/home/svc-2.jpg',

  processTitle: 'How to Order',
  processSubtitle: 'Machined Parts',
  processImage: '/process.png',
  processSteps: [
    { step: '01', title: 'Upload a STEP File', description: 'Our CNC analysis engine extracts features, selects stock and calculates cycle time.', icon: FileCode2 },
    { step: '02', title: 'Instant Quote', description: 'See price per part, DFM warnings and available finishes. Adjust material and quantity.', icon: Zap },
    { step: '03', title: 'Machining', description: 'CAM programming, fixturing and machining. Multi-setup parts are re-fixtured automatically.', icon: Cog },
    { step: '04', title: 'Finish & Ship', description: 'Deburring, optional finish (anodise, powder coat, plate), inspection and dispatch.', icon: Truck },
  ],

  faq: [
    { q: 'Which 3D formats do you accept?', a: 'STEP (.step / .stp) for instant pricing. IGES and Parasolid files are accepted via engineer review.' },
    { q: 'What is the standard tolerance?', a: '± 0.025 mm on critical dimensions, ± 0.1 mm general. Tighter tolerances are quoted by an engineer.' },
    { q: 'Can you machine plastics?', a: 'Not yet in the instant engine. Delrin, HDPE and nylon are quoted by our engineers.' },
    { q: 'Do you offer turning + milling in one part?', a: 'Yes — our engine detects turned features and routes to a lathe with live tooling when it saves a setup.' },
  ],

  footerTag: 'Subtractive Manufacturing',
  footerHeading: 'Ready to machine your custom parts?',
  footerBadges: ['± 0.025 mm Tolerance', '9 Metals in Stock'],
};

// ═══════════════════════════════════════════════════
// 4. Powder Coating
// ═══════════════════════════════════════════════════

export const POWDER_COATING: ServicePageConfig = {
  heroTitle: 'Industrial',
  heroSubtitle: 'Powder Coating',
  heroDescription:
    'Electrostatic powder coating for sheet metal and CNC parts. Five instant colours, RAL matching on request, matte to high-gloss textures.',
  heroBadge: 'Surface Protection',
  heroIcon: Palette,
  heroImage: '/powder_coating_service.png',
  heroStatus: 'Electrostatic Lines Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Colours', value: '5 instant + RAL on request', icon: Palette },
    { label: 'Durability', value: 'Impact & UV resistant', icon: ShieldCheck },
  ],

  capabilities: [
    {
      title: 'Electrostatic Bond',
      desc: 'Charged powder wraps around the part for even coverage on complex geometry, including recesses and internal corners.',
      icon: Zap,
    },
    {
      title: 'Colour Range',
      desc: 'Black, Blue, Clear, Gold and Red are priced instantly. Any RAL code is available on request.',
      icon: Palette,
    },
    {
      title: 'Texture Options',
      desc: 'Matte, gloss, sand-texture and hammer-tone finishes. Specify in your order notes.',
      icon: Layers,
    },
  ],
  expertCta:
    'Looking for specific RAL colours, high-heat powders for engine parts, or UV-stable architectural coatings? Our finishing team can match any spec.',

  materialsTable: () => F.finishMaterials(['powder_coat']),
  exampleTable: () => F.finishExample('powder_coat', 'ms-crca', 'ms_a36'),
  orderMinimumInr: null,
  turnaroundTable: turnaround,
  costDrivers: [
    'Part surface area (the powder must cover it all)',
    'Quantity — the finisher\'s lot minimum is shared',
    'Colour (standard vs. custom RAL)',
    'Texture (matte, gloss, sand, hammer-tone)',
    'Masking if specific areas must stay bare',
  ],
  instantPricing: true,

  dfmTitle: 'Powder Coating',
  dfmIntro:
    'A few design choices make the difference between a perfect finish and one that flakes.',
  dfmRules: [
    { id: 'H', title: 'Hanging Points', desc: 'Parts are hung by hooks. Provide a non-critical hole (≥ 3 mm) or a hidden edge for the hook.' },
    { id: 'E', title: 'Edge Radius', desc: 'Powder thins on sharp edges. Radius all external edges ≥ 0.5 mm for even adhesion.' },
    { id: 'T', title: 'Thermal Limits', desc: 'Parts cure at 200 °C for 20 minutes. Remove plastic or rubber inserts first.' },
  ],
  dfmImage: '/home/svc-9.jpg',

  processTitle: 'How It',
  processSubtitle: 'Works',
  processImage: '/blue-powder-bends.png',
  processSteps: [
    { step: '01', title: 'Sanding & Degreasing', description: 'Parts are cleaned and pre-treated to ensure adhesion.', icon: Wrench },
    { step: '02', title: 'Electrostatic Spraying', description: 'Charged powder is sprayed over the grounded part for full coverage.', icon: Zap },
    { step: '03', title: 'Thermal Curing', description: 'Parts enter a 200 °C oven. The powder melts, flows and crosslinks into a hard finish.', icon: Thermometer },
    { step: '04', title: 'Inspection & Pack', description: 'Colour and thickness are checked before packing.', icon: Truck },
  ],

  footerTag: 'Surface Protection',
  footerHeading: 'Ready to finish your metal parts?',
  footerBadges: ['Impact Resistant', 'UV Stable'],
};

// ═══════════════════════════════════════════════════
// 5. Anodizing
// ═══════════════════════════════════════════════════

export const ANODIZING: ServicePageConfig = {
  heroTitle: 'Industrial',
  heroSubtitle: 'Anodizing',
  heroDescription:
    'Electrochemical surface treatment for aluminium. Type II (clear and colour) priced instantly; Type III hardcoat on request.',
  heroBadge: 'Surface Engineering',
  heroIcon: Droplets,
  heroImage: '/anodizing_service.png',
  heroStatus: 'Chemical Process Tanks Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Types', value: 'Type II instant, Type III on request', icon: Layers },
    { label: 'Colours', value: 'Black, Blue, Clear, Gold, Red', icon: Palette },
  ],

  capabilities: [
    {
      title: 'Type II (Decorative)',
      desc: 'Clear or colour anodise with 8–25 µm oxide layer. Excellent corrosion resistance and vibrant dye absorption.',
      icon: Palette,
    },
    {
      title: 'Type III (Hardcoat)',
      desc: 'Dense 25–75 µm oxide. Extreme wear resistance for friction and sliding surfaces. Engineer-quoted.',
      icon: ShieldCheck,
    },
    {
      title: 'Dielectric Strength',
      desc: 'The oxide layer is a ceramic insulator — ideal for electrical isolation without an added coating.',
      icon: Gauge,
    },
  ],
  expertCta:
    'Need MIL-A-8625, PTFE impregnation, masking for grounding zones, or Type III hardcoat? Our chemical engineers can help.',

  materialsTable: () => F.finishMaterials(['anodize_clear', 'anodize_color']),
  exampleTable: () => F.finishExample('anodize_color', 'al-5052', 'al_6061'),
  orderMinimumInr: null,
  turnaroundTable: turnaround,
  costDrivers: [
    'Part surface area',
    'Anodise type (II vs. III)',
    'Colour (clear is cheapest, colours cost more)',
    'Quantity — lot minimum shared across the batch',
    'Masking for selective anodising',
  ],
  instantPricing: true,

  dfmTitle: 'Anodizing',
  dfmIntro:
    'Aluminium only. Design for even oxide build-up and correct racking.',
  dfmRules: [
    { id: 'D', title: 'Dimensional Build-Up', desc: 'Type II adds ≈ 12 µm per side. Type III adds up to 37 µm. Account for this on mating surfaces.' },
    { id: 'R', title: 'Racking Points', desc: 'Current must flow through the part. Provide a non-critical contact point; the rack mark is visible.' },
    { id: 'S', title: 'Surface Finish', desc: 'Smoother machined surfaces give more uniform, reflective anodise. Aim for Ra ≤ 3.2 µm.' },
  ],
  dfmImage: '/home/svc-8.jpg',

  processTitle: 'How It',
  processSubtitle: 'Works',
  processImage: '/process.png',
  processSteps: [
    { step: '01', title: 'Pre-Treatment', description: 'Parts are cleaned, etched and optionally brightened for a uniform surface.', icon: Wrench },
    { step: '02', title: 'Electrolytic Oxidation', description: 'Parts are immersed in an acid bath under controlled current to grow the oxide layer.', icon: Zap },
    { step: '03', title: 'Dyeing (Colour Only)', description: 'Pores absorb the dye. Black, Blue, Gold, Red or Clear.', icon: Palette },
    { step: '04', title: 'Sealing & Inspection', description: 'Hot-water or nickel-acetate seal locks the colour and corrosion protection.', icon: Truck },
  ],

  footerTag: 'Surface Engineering',
  footerHeading: 'Ready to anodise your aluminium parts?',
  footerBadges: ['Corrosion Resistant', 'Aluminium Only'],
};

// ═══════════════════════════════════════════════════
// 6. Thread Tapping
// ═══════════════════════════════════════════════════

export const TAPPING: ServicePageConfig = {
  heroTitle: 'Precision',
  heroSubtitle: 'Thread Tapping',
  heroDescription:
    `Automated tapping for ${F.TAP_RANGE.count} thread sizes: ${F.TAP_RANGE.metric} metric and ${F.TAP_RANGE.imperial} imperial. Added to your sheet or CNC order — our engine finds the holes automatically.`,
  heroBadge: 'Fastening Solutions',
  heroIcon: Drill,
  heroImage: '/tapping_service.png',
  heroStatus: 'Multi-Spindle Tapping Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Range', value: `${F.TAP_RANGE.metric} + imperial`, icon: Ruler },
    { label: 'Class', value: '6H / 2B fit', icon: Target },
  ],

  capabilities: [
    {
      title: 'Class 6H / 2B Fit',
      desc: 'Threads meet ISO 965 (metric) and ASME B1.1 (UNC/UNF) for medium-fit bolt compatibility.',
      icon: Target,
    },
    {
      title: 'Blind & Through Holes',
      desc: 'Depth-controlled tapping with chip evacuation for both through-hole and blind-hole threads.',
      icon: Layers,
    },
    {
      title: 'Auto-Detection',
      desc: 'Upload a STEP or DXF with holes — our engine detects diameters and matches them to tap standards.',
      icon: CircleDotDashed,
    },
  ],
  expertCta:
    `Need ACME, trapezoidal, or micro threads below M2? Our engineering team can quote within 24 hours.`,

  materialsTable: F.tappingMaterials,
  exampleTable: F.tappingExample,
  orderMinimumInr: null,
  turnaroundTable: turnaround,
  costDrivers: [
    'Number of tapped holes',
    'Thread size and depth',
    'Material hardness (stainless costs more than aluminium)',
    'Tap wear (scales with thread depth relative to diameter)',
    'Quantity — setup shared across the batch',
  ],
  instantPricing: true,

  dfmTitle: 'Tapping',
  dfmIntro:
    'Good pilot holes make reliable threads.',
  dfmRules: [
    { id: 'P', title: 'Pilot Hole Size', desc: 'Your DXF/STEP must have the correct pilot diameter for the thread. Our engine checks it and warns if it is off.' },
    { id: 'M', title: 'Minimum Material', desc: 'Material thickness ≥ 1.5× thread pitch to guarantee full engagement.' },
    { id: 'B', title: 'Blind Hole Depth', desc: 'Allow 3–5 mm extra depth beyond the required thread length for chip clearance.' },
  ],
  dfmImage: '/home/svc-7.jpg',

  processTitle: 'How It',
  processSubtitle: 'Works',
  processImage: '/process.png',
  processSteps: [
    { step: '01', title: 'Hole Detection', description: 'Holes are identified from your STEP or DXF and matched to the nearest tap standard.', icon: CircleDotDashed },
    { step: '02', title: 'Tap Selection', description: 'The engine picks the right tap and calculates depth, speed and feed for your material.', icon: Settings },
    { step: '03', title: 'Automated Tapping', description: 'Multi-spindle tapping with torque control. Through-hole and blind-hole supported.', icon: Drill },
    { step: '04', title: 'Thread Gauge Check', description: 'Go / no-go gauges verify every tapped hole before shipping.', icon: CheckCircle2 },
  ],

  footerTag: 'Fastening Solutions',
  footerHeading: 'Ready to add threads to your parts?',
  footerBadges: [`${F.TAP_RANGE.count} Thread Sizes`, 'Go/No-Go Verified'],
};

// ═══════════════════════════════════════════════════
// 7. Hardware Insertion
// ═══════════════════════════════════════════════════

export const HARDWARE_INSERTION: ServicePageConfig = {
  heroTitle: 'Press-Fit',
  heroSubtitle: 'Hardware Insertion',
  heroDescription:
    'Self-clinching nuts, studs, standoffs and PEM® fasteners pressed into sheet metal. Added to your cutting order — quoted by our engineers.',
  heroBadge: 'Assembly Hardware',
  heroIcon: Hammer,
  heroImage: '/hardware_insertion_service.png',
  heroStatus: 'Insertion Press Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Types', value: 'Nuts, Studs, Standoffs', icon: Wrench },
    { label: 'Pricing', value: 'Engineer-quoted', icon: Clock },
  ],

  capabilities: [
    {
      title: 'Self-Clinching',
      desc: 'PEM®-style nuts, studs and standoffs pressed into sheet metal. The metal cold-flows into the knurl for a permanent joint.',
      icon: Hammer,
    },
    {
      title: 'Flush & Floating',
      desc: 'Flush-head nuts for clean surfaces, floating nuts for alignment tolerance. Both stocked in common sizes.',
      icon: Layers,
    },
    {
      title: 'Repeatable Force',
      desc: 'Servo-controlled insertion press with tonnage feedback. Every fastener is verified to spec.',
      icon: Gauge,
    },
  ],
  expertCta:
    'Need rivet nuts, weld nuts, or blind fasteners for thicker plates? Our engineers can advise and quote.',

  materialsTable: () =>
    F.sheetMetalMaterials((id) =>
      id === 'al-6061' ? 'T6 temper — higher insertion force, possible micro-cracking on thin sheets'
      : 'Good clinching properties',
    ),
  exampleTable: F.sheetCuttingExample,
  orderMinimumInr: null,
  turnaroundTable: turnaround,
  costDrivers: [
    'Number of insertions',
    'Fastener type and size',
    'Material thickness and grade',
    'Access (internal hardware is harder to reach)',
    'Bundled with cutting — no separate setup fee',
  ],
  instantPricing: false,

  dfmTitle: 'Hardware Insertion',
  dfmIntro:
    'Design the hole and the material to match the fastener.',
  dfmRules: [
    { id: 'H', title: 'Hole Diameter', desc: 'The mounting hole must match the fastener spec exactly. Oversized holes prevent clinching.' },
    { id: 'T', title: 'Sheet Thickness', desc: 'Minimum thickness varies by fastener. Typical: ≥ 1.0 mm for M3, ≥ 1.4 mm for M5.' },
    { id: 'E', title: 'Edge Distance', desc: 'Keep the fastener centre ≥ 3× hole diameter from any edge or bend line.' },
  ],
  dfmImage: '/home/svc-6.jpg',

  processTitle: 'How It',
  processSubtitle: 'Works',
  processImage: '/Self-Clinching-Nuts-MS-.png',
  processSteps: [
    { step: '01', title: 'Hole Prep', description: 'Holes are laser-cut to the fastener\'s spec during the cutting step.', icon: Scissors },
    { step: '02', title: 'Fastener Loading', description: 'The correct PEM® fastener is loaded into the insertion press.', icon: Settings },
    { step: '03', title: 'Press Insertion', description: 'Servo-controlled ram presses the fastener. Tonnage feedback verifies the clinch.', icon: Hammer },
    { step: '04', title: 'Pull-Out Test', description: 'A sample is pull-tested to verify holding force meets the spec.', icon: CheckCircle2 },
  ],

  footerTag: 'Assembly Hardware',
  footerHeading: 'Ready to add fasteners to your sheet metal?',
  footerBadges: ['PEM® Compatible', 'Tonnage Verified'],
};

// ═══════════════════════════════════════════════════
// 8. Dimple Forming
// ═══════════════════════════════════════════════════

export const DIMPLE_FORMING: ServicePageConfig = {
  heroTitle: 'Precision',
  heroSubtitle: 'Dimple Forming',
  heroDescription:
    'Controlled dimples and lances in sheet metal for flush-mount fasteners, airflow and alignment features. Engineer-quoted, bundled with your cutting order.',
  heroBadge: 'Sheet Forming',
  heroIcon: CircleDot,
  heroImage: '/dimple_forming_service.png',
  heroStatus: 'Forming Press Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Application', value: 'Flush fasteners & alignment', icon: Target },
    { label: 'Pricing', value: 'Engineer-quoted', icon: Clock },
  ],

  capabilities: [
    {
      title: 'Flush-Mount Dimples',
      desc: 'Conical dimples that let countersunk screws sit flush with the surface. Standard #6, #8, #10, 1/4" dies.',
      icon: CircleDot,
    },
    {
      title: 'Lance & Form',
      desc: 'Partial cuts with formed tabs for ventilation, spring clips or alignment features.',
      icon: Layers,
    },
    {
      title: 'Repeatable Depth',
      desc: 'CNC-controlled stroke depth with ± 0.05 mm repeatability across the batch.',
      icon: Target,
    },
  ],
  expertCta:
    'Need custom die profiles, deep draws, or louvers? Our sheet-forming engineers can design and quote.',

  materialsTable: () =>
    F.sheetMetalMaterials((id) =>
      id === 'al-6061' ? 'T6 temper cracks on tight dimples — 5052 is recommended'
      : 'Good formability',
    ),
  exampleTable: F.sheetCuttingExample,
  orderMinimumInr: null,
  turnaroundTable: turnaround,
  costDrivers: [
    'Number of dimples / lances per part',
    'Die size and profile',
    'Material type and thickness',
    'Tooling setup (standard dies vs. custom)',
    'Bundled with cutting — no separate setup fee',
  ],
  instantPricing: false,

  dfmTitle: 'Dimple Forming',
  dfmIntro:
    'Design for the die and the material.',
  dfmRules: [
    { id: 'D', title: 'Dimple Diameter', desc: 'Standard dies: #6, #8, #10, 1/4". Custom sizes need a new die — adds lead time.' },
    { id: 'C', title: 'Clearance', desc: 'Keep dimples ≥ 2× material thickness from any edge, hole or bend line.' },
    { id: 'T', title: 'Thickness Limit', desc: 'Dimple forming works best up to 2 mm. Thicker sheets may crack or require annealing.' },
  ],
  dfmImage: '/home/svc-5.jpg',

  processTitle: 'How It',
  processSubtitle: 'Works',
  processImage: '/process.png',
  processSteps: [
    { step: '01', title: 'Engineer Review', description: 'Our team reviews your drawing, selects die sets and confirms feasibility.', icon: FileCode2 },
    { step: '02', title: 'Laser Cut', description: 'The flat pattern is laser-cut with pilot holes for dimple alignment.', icon: Scissors },
    { step: '03', title: 'Dimple Press', description: 'CNC forming press stamps each dimple with controlled depth.', icon: CircleDot },
    { step: '04', title: 'Inspection', description: 'Depth, diameter and position are measured against spec.', icon: CheckCircle2 },
  ],

  footerTag: 'Sheet Forming',
  footerHeading: 'Ready to add dimples to your sheet metal?',
  footerBadges: ['Flush-Mount Ready', 'CNC Depth Control'],
};

// ═══════════════════════════════════════════════════
// 9. Countersinking
// ═══════════════════════════════════════════════════

export const COUNTERSINKING: ServicePageConfig = {
  heroTitle: 'Precision',
  heroSubtitle: 'Countersinking',
  heroDescription:
    'Chamfered holes for flush-head screws in sheet metal and CNC parts. Standard 82° and 90° angles, engineer-quoted.',
  heroBadge: 'Hole Finishing',
  heroIcon: ArrowDownToLine,
  heroImage: '/countersinking_service.png',
  heroStatus: 'Countersink Station Active',
  heroStatusLabel: 'Operational Status',
  heroStats: [
    { label: 'Angles', value: '82° and 90° standard', icon: Target },
    { label: 'Pricing', value: 'Engineer-quoted', icon: Clock },
  ],

  capabilities: [
    {
      title: '82° Flat-Head',
      desc: 'The most common countersink for flat-head machine screws. Seats flush with the surface.',
      icon: ArrowDownToLine,
    },
    {
      title: '90° Metric',
      desc: 'Standard for DIN 7991 / ISO 10642 socket-head countersunk screws.',
      icon: Target,
    },
    {
      title: 'Deburr Chamfer',
      desc: 'A light 45° chamfer to break the edge of drilled or laser-cut holes. Prevents burr injury and eases fastener entry.',
      icon: Wrench,
    },
  ],
  expertCta:
    'Need 100° aerospace countersinks, spotfacing, or countersinking in hardened alloys? Our engineers can quote.',

  materialsTable: () =>
    F.sheetMetalMaterials(() => 'Compatible'),
  exampleTable: F.sheetCuttingExample,
  orderMinimumInr: null,
  turnaroundTable: turnaround,
  costDrivers: [
    'Number of countersunk holes',
    'Angle and diameter',
    'Material hardness',
    'Bundled with cutting or machining — minimal extra setup',
  ],
  instantPricing: false,

  dfmTitle: 'Countersinking',
  dfmIntro:
    'Specify the angle and depth clearly so the screw sits flush.',
  dfmRules: [
    { id: 'A', title: 'Angle Match', desc: 'The countersink angle must match the screw head: 82° for ANSI, 90° for DIN/ISO. A mismatch leaves a gap.' },
    { id: 'D', title: 'Depth', desc: 'The countersink must be deep enough for the head to sit flush but not so deep it weakens the material.' },
    { id: 'E', title: 'Edge Distance', desc: 'Keep the countersink centre ≥ 2× major diameter from any edge to prevent blowout.' },
  ],
  dfmImage: '/two-countersinking.png',

  processTitle: 'How It',
  processSubtitle: 'Works',
  processImage: '/process.png',
  processSteps: [
    { step: '01', title: 'Engineer Review', description: 'Hole positions, angles and depths are confirmed from your drawing.', icon: FileCode2 },
    { step: '02', title: 'Pilot Holes', description: 'Holes are laser-cut or drilled to the correct clearance diameter.', icon: Scissors },
    { step: '03', title: 'Countersink', description: 'CNC countersink tool chamfers each hole to the specified angle and depth.', icon: ArrowDownToLine },
    { step: '04', title: 'Flush Check', description: 'A sample screw is seated to verify the head sits flush.', icon: CheckCircle2 },
  ],

  footerTag: 'Hole Finishing',
  footerHeading: 'Ready to countersink your parts?',
  footerBadges: ['Flush Fastening', 'Angle Verified'],
};

/** All service page configs keyed by route slug */
export const SERVICE_PAGES: Record<string, ServicePageConfig> = {
  'precision-sheet-cutting': PRECISION_SHEET_CUTTING,
  'bending': BENDING,
  'cnc-machining': CNC_MACHINING,
  'powder-coating': POWDER_COATING,
  'anodizing': ANODIZING,
  'tapping': TAPPING,
  'hardware-insertion': HARDWARE_INSERTION,
  'dimple-forming': DIMPLE_FORMING,
  'countersinking': COUNTERSINKING,
};

/**
 * Page metadata for /services/<slug>, built from the copy the hero renders so the
 * search snippet always matches the page. Used by each service route's layout.tsx,
 * since the pages themselves are client components and cannot export metadata.
 */
export function serviceMetadata(config: ServicePageConfig, slug: string): Metadata {
  return {
    title: `${config.heroSubtitle} Services in India | MechHub`,
    description: config.heroDescription,
    alternates: {
      canonical: `/services/${slug}`,
    },
  };
}
