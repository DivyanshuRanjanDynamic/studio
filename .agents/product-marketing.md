# Product Marketing Context

**Document version:** v2
**Last updated:** 2026-10-31
**Status:** Drafted from the codebase, with founder answers added on 2026-10-31. Anything marked `[CONFIRM]` is an inference, and `[NEEDS INPUT]` means the repo has no answer. Do not present either as fact in customer-facing copy.

## Product Overview
**One-liner:** Upload a CAD file and get custom metal parts made in India, with a clear price, tracked production and no vendor chasing.
**What it does:** MechHub takes a design file (STEP, DXF or DWG), prices it instantly or through a rapid engineer quote, and has it made by verified manufacturing partners called MechMasters. One order can cover cutting, machining, bending, hardware and finishing. The customer tracks it from upload to delivery.
**Product category:** Custom manufacturing platform, or on-demand manufacturing, in India. Buyers search by process and place: "laser cutting services in India", "CNC machining cost India", "sheet metal fabrication Bengaluru".
**Product type:** Managed two-sided marketplace. Buyers order from MechHub; MechHub routes work to its partner network, all under full NDA contracts. The site metadata calls it "A Managed Marketplace for Custom Manufacturing Needs."
**Business model:**
- Pay per order, in INR, through Razorpay. There is no subscription.
- Prices add 18% GST and shipping.
- Project orders take a 50% advance before production, then the balance.
- Instant pricing comes from an in-house engine for sheet cutting, CNC and 3D printing. Other work is quoted by an engineer. Vendors can also bid on projects, and buyers and vendors can counter-offer.
- Minimum order value per line item: ₹1,000 sheet, ₹2,900 CNC, ₹300 3D printing. Faster turnaround costs more.
- MechMasters pay ₹0 to join.
- On vendor-bid orders, MechHub acts as mediator and charges 1-3% based on order value. Internal figure: do not publish it.

**Services:** Precision Sheet Cutting, CNC Milling/Turning, Bending & Folding, Countersinking, Dimple Forming, Hardware Insertion, Precision Tapping, Anodizing, Powder Coating. 3D printing has a quoting engine and appears on the site, but it is not one of the nine listed services. `[CONFIRM]` whether it is a live offer.

## Target Audience
**Target companies:** Startups, college club teams (robotics clubs, drone clubs and similar), industrial buyers, and businesses that need MechHub's manufacturing expertise. MechHub is B2B.
**Decision-makers:** Mechanical or design engineers place most orders. Founders approve spend at startups. Team captains and faculty advisors play that role in student teams. `[CONFIRM]`
**Primary use case:** Getting prototype or low-volume custom metal parts made quickly without managing several vendors.
**Jobs to be done:**
- Turn this CAD file into a real part in days, in time for my build or deadline.
- Tell me what it costs now, so I can decide without waiting on vendors.
- Handle cutting, bending and finishing in one order, so I don't coordinate shops myself.

**Use cases:**
- Robotics: chassis plates, motor mounts, servo brackets.
- Drones and UAVs: frames, arms, custom mounts.
- EVs: enclosures, brackets, motor mounts, battery holders.
- Scaling from one prototype to 1,000+ parts.

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Design engineer (user) | Tolerances, fit, speed, DFM feedback | Vendors return slow, inconsistent answers | Upload once, get a clear quote, track every stage |
| Startup founder (decision maker) | Burn, schedule, IP safety | Delays slip the build; designs go to unknown shops | Clear pricing, NDA-first handling, one accountable order |
| Student team lead (champion) | Budget, competition deadlines | Shops ignore small quantities | Order from one part, at a student-friendly cost |
| Procurement or ops, at larger teams (financial buyer) | GST invoices, reliability, repeatability | Unvetted vendors, messy paperwork | `[NEEDS INPUT]` Not addressed on the site yet |
| MechMaster: shop owner (supply side) | Steady work, on-time payment | Spends time finding orders | Order flow from verified buyers, no sales calls, transparent payouts, ₹0 setup |

## Problems & Pain Points
**Core problem:** Getting a small batch of custom parts made in India means chasing vendors with no price certainty, no visibility and no real IP protection.
**Why alternatives fall short:**
- Email 10 vendors, wait 3 days, get 10 different answers.
- No visibility into whether a part is being made or sitting in a queue.
- Minimum quantities price out students and small teams.
- CAD files go to random vendors with no NDA.
- Separate vendors for cutting, bending and finishing, all managed by the buyer.

**What it costs them:** Days or weeks lost per iteration, missed competition and demo dates, and engineers' time spent on coordination. `[NEEDS INPUT]` Real numbers from customers.
**Emotional tension:** Fear that a deadline will slip, doubt about the quote, and worry that a design will leak.

## Competitive Landscape
Written without market research. Named competitors are from general knowledge and need checking by the founders or the `competitors` skill.
**Direct:** Indian on-demand manufacturing platforms such as Karkhana.io `[CONFIRM]`. Zetwerk `[CONFIRM]` works at much larger, enterprise scale, which is the gap in the site's "not factories" line.
**Secondary:** Finding job shops yourself through IndiaMART, Justdial, referrals and WhatsApp. It can be cheap, but pricing is opaque and the buyer carries all the coordination and quality risk.
**Indirect:** College workshops, makerspaces, in-house machines, or importing from overseas services. Limited capability or slower, costlier logistics for Indian teams.

## Differentiation
**Key differentiators:**
- Instant pricing on Indian rate cards for sheet cutting, CNC and 3D printing.
- Cost breakdown by material, process, finishing and quantity.
- All processes in one order.
- Order tracking across five stages: CAD Uploaded, Quote Approved, In Production, Quality Checked, Shipped.
- NDA-first workflow with encrypted storage.
- Single-part orders.

**How we do it differently:** MechHub stays accountable for the order and vets the shops, instead of being a directory of vendors.
**Why that's better:** One price, one order and one point of responsibility, from a single prototype onward.
**Why customers choose us:** `[NEEDS INPUT]` Ask real customers. Do not assume.

## Objections
Inferred from the site, not from sales calls. `[NEEDS INPUT]` Replace with what buyers actually say.
| Objection | Response |
|-----------|----------|
| "Will the quality hold up?" | Every order is QC inspected and made by a verified MechMaster. |
| "Is my design safe?" | NDA-first workflow and encrypted storage. |
| "Can I negotiate?" | Yes. Buyers can accept a quote or send a counter-offer. |
| "A local shop is cheaper." | Often true for simple parts. The quote shows the full cost, and the saving is in time and coordination. |
| "What if the parts are wrong?" | The refund policy covers defects with a partial or full refund, depending on severity. |

**Anti-persona:** Enterprise buyers needing high-volume production contracts, and buyers needing certified aerospace or medical supply chains. `[CONFIRM]`

## Switching Dynamics
**Push:** Slow, inconsistent replies from vendors, and no idea where the job stands.
**Pull:** A price in minutes, a single order for every process, and live tracking.
**Habit:** A known local vendor, WhatsApp relationships, and negotiating face to face.
**Anxiety:** Handing over IP, paying a 50% advance to an unfamiliar platform, and not being able to inspect the shop.

## Customer Language
No real customer quotes exist in the repo. The testimonials on the site are placeholders, so they are not used here.
**How they describe the problem:**
- `[NEEDS INPUT]` Collect from calls and WhatsApp threads. The site's own phrases are "WhatsApp chasing" and "10 different answers".

**How they describe us:**
- `[NEEDS INPUT]`

**Words to use:** builder, parts, upload, quote, prototype, tolerance, DFM, delivered, tracked.
**Words to avoid:** see "Never use" under Brand Voice.
**Glossary:**
| Term | Meaning |
|------|---------|
| MechMaster | A verified manufacturing partner on MechHub |
| Builder | MechHub's word for its customers |
| Instant quote | A price from the engine, no human involved |
| Rapid quote | A quote reviewed by an engineer |
| RFQ | A quote request for a project |

## Brand Voice
Inferred from site copy, with no performance data. `[CONFIRM]` Voice is the founders' choice.
| Attribute | Means | Doesn't mean | Example line |
|-----------|-------|--------------|--------------|
| Builder to builder | Talks like an engineer to an engineer, about real parts | Slangy or talking down to students | "Ready to Build Something Real?" |
| Concrete | Names files, processes, days and rupees | Spec-sheet dumps | "Email 10 vendors, wait 3 days, get 10 different answers." |
| Open about how it works | Says what happens and what it costs | Exposing margins or vendor details | "Your parts aren't made in a black box." |
| Short and direct | Short sentences, one idea each | Curt, or fragments in support and legal text | "Upload once. Get an instant or rapid quote." |
| Proudly Indian | Built for Indian teams, in INR | Patriotic slogans in place of proof | "Built in India for builders" |

**Tone by context:**
- Support: Answer first, own mistakes, plain next steps. No marketing claims.
- Launch: What's new, who it's for, one real number.
- Errors: What happened and how to fix it. No jokes when someone is blocked.
- Sales: Engineer to engineer, short, one ask.
- Social: The founders' own views and real parts on the shop floor. The loosest the brand gets.

**Terms we own:** MechMaster, Builder, "Manufacturing Without the Black Box", "Real Parts. Real Engineers. Real Deadlines."
**Never use (and why):**
- "Institutional-grade", "Industrial Commerce Infrastructure": corporate, and conflicts with the builder voice. `[CONFIRM]`
- "Seamless": orders involve real shops and real edge cases.
- "No negotiation": the product has counter-offers. Say "No vendor chasing".
- "Our facility", "under one roof": parts are made by the partner network.
- "AI-powered DFM": removed from the About page because it wasn't on the approved facts list.
- Any claim from the "Do not use" list below.

## Proof Points
**Metrics (founder-supplied, 2026-10-31):** 500+ orders delivered, 72 hrs typical turnaround, 100+ repeat customers, 10+ active MechMasters. `[NEEDS INPUT]` On-time rate.
**Customers:** `[NEEDS INPUT]` None verified.
**Testimonials:** None verified.

**Safe to use, from the product:**
| Theme | Proof |
|-------|-------|
| Speed | Parts ship in as little as 2 days on sheet cutting, per the service page |
| Precision | ±0.1 mm fiber laser on metals up to 6 mm; ±0.025 mm on critical CNC dimensions, ±0.1 mm general |
| Low barrier | Order one part. Minimum order value per line item: ₹1,000 sheet, ₹2,900 CNC, ₹300 3D printing |
| Trust | Published refund and NDA policies; every partner has signed a full NDA contract; the privacy policy states AES-256 encryption at rest and in transit |
| Company | MechHub is a unit of Synchubb Innovations Pvt Ltd; founders Ujjwal Jha (CEO), Divyanshu Ranjan (Co-founder & CTO), Dristi Sengupta (Co-founder & COO) |

**Do not use until verified.** These appear on the live site, but the code marks them as placeholders or they conflict with other pages:
| Claim | Why |
|-------|-----|
| The three testimonials (A.R., V.K., S.P.) | Founders chose to keep these on the site as placeholders for now. Never reuse them as proof |
| Named institutions (IIT Bombay, NIT Trichy, BITS Pilani) as customers | Removed from the site; no permission or proof on file |
| "ISO 9001 Certified" | Application filed, approval pending. Do not use in new copy until approved |
| "AWS-certified welders" | No supporting evidence found in the repo |
| "India's fastest-growing manufacturing network", "the only Indian manufacturing platform" | Unsupported superlatives |
| "Zero minimums", "No minimums" | Say "No minimum quantity". Minimum order values apply |

## Goals
**Business goal:** `[NEEDS INPUT]` Assumed to be more paid orders from repeat hardware teams, with enough MechMaster capacity to serve them.
**Conversion action:** Upload a design and request a quote. Supply-side action: apply at `/onboard`.
**Current metrics:** `[NEEDS INPUT]` Traffic, upload-to-quote rate, quote-to-order rate, repeat rate, active MechMasters.

## Paid Ads (optional)
Not captured. `[NEEDS INPUT]` Fill in before using the `ads` skill.

## Learnings
*Decisions and tested lessons. Newest first. Keep it to about 20 active entries.*
| Date | Learning | Evidence | Applies to | Status |
|------|----------|----------|------------|--------|
| | | | | |

## Changelog
*Newest first. One line per revision: what changed and why.*
- v2 (2026-10-31) — Added founder answers on audience, metrics and vendor-bid fee; updated claim rules after site fixes (real metrics, no minimum quantity, counter-offers, partner network, ISO pending).
- v1 (2026-10-31) — Initial context, drafted from site copy and pricing code; marked unverified claims and open questions for founder review.
