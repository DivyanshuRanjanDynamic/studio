# MechHub Tracking Plan

- **Tool:** Google Analytics 4, through gtag.js
- **Property:** `G-GS3838EYYR`
- **Setting:** `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. Nothing loads until this is set at build time, so production needs it in the Vercel project settings.
- **Code:** all events go through `src/lib/analytics.ts`
- **Last updated:** 2026-10-31

## Rules

- Fire an event only after the step has succeeded on the server, never on a button click.
- Never send names, emails, phone numbers, addresses or file names to GA4.
- Page views are automatic. Keep Enhanced Measurement on, because it records in-app route changes.

## Decisions This Answers

- Where do people drop between signup, upload, quote and payment?
- Which channels bring paying customers, not only visitors?
- Which share of parts get an instant price, and which need an engineer?
- How much supply-side interest does each channel bring?

## Funnel

| Step | Event | Fires when |
|------|-------|------------|
| 1 | `sign_up` | The user profile is created, or a new Google account signs in |
| 2 | `project_created` | A project is saved |
| 3 | `part_added` | A design is saved to a project |
| 4 | `quote_requested` | The server accepts the quote request |
| 5 | `quote_accepted` | The acceptance is saved |
| 6 | `begin_checkout` | The server creates a payment order |
| 7 | `purchase` | The server verifies the payment |

The instant quote path skips steps 2 to 5: `add_to_cart`, then `begin_checkout`, then `purchase`.

## Events

| Event | Properties | Fired from |
|-------|------------|------------|
| `sign_up` | `method` (email, google), `role` (customer, vendor) | `app/login/page.tsx` |
| `project_created` | none | `components/CreateProjectModal.tsx` |
| `part_added` | `service`, `quantity`, `instant_priced` | `components/part-creation/PartCreationWizard.tsx` |
| `add_to_cart` | `currency`, `value` | `app/quote/instant/page.tsx` |
| `quote_requested` | `source` (project, matching) | `app/(account)/projects/[projectId]/page.tsx`, `app/matching/page.tsx` |
| `quote_accepted` | `source` (project, vendor_offer) | `app/(account)/projects/[projectId]/page.tsx`, `app/(account)/dashboard/page.tsx` |
| `begin_checkout` | `currency`, `value` | `hooks/use-quote-checkout.ts`, project and dashboard pages |
| `purchase` | `transaction_id`, `value`, `currency`, `payment_type` (full, advance, balance) | Same as `begin_checkout` |
| `contact_submitted` | none | `app/contact/ContactClient.tsx` |
| `consultation_requested` | none | `app/consultation/page.tsx` |
| `vendor_application_submitted` | none | `app/onboard/page.tsx` |

## Key Events in GA4

Mark these as key events in Admin > Events: `purchase`, `quote_requested`, `sign_up`, `vendor_application_submitted`.

## Custom Definitions in GA4

Register these as event-scoped dimensions in Admin > Custom definitions: `service`, `role`, `source`, `payment_type`, `instant_priced`, `method`.

## Reading the Revenue Numbers

- `value` is the amount actually charged, including GST and shipping. It is not net revenue.
- A project pays twice, so one order appears as two `purchase` events: `advance` and `balance`.
- `transaction_id` is the Razorpay order id, so GA4 counts each payment once.
- For the number of paying projects, count `payment_type = advance`.
- Refunds are not sent to GA4.

## Known Gaps

- `purchase` fires in the browser. If a customer closes the tab during verification, the Razorpay webhook still records the payment, but GA4 will not. Razorpay remains the source of truth for revenue.
- Ad blockers stop some events. Expect GA4 to read lower than your real order count.
- A vendor-side event, such as a bid submitted, is not tracked yet.
- Admin and vendor pages also send page views. Filter them out of marketing reports.

## UTM Convention

Lowercase, with hyphens between words. Never put personal data in a UTM.

| Channel | utm_source | utm_medium | utm_campaign example |
|---------|------------|------------|----------------------|
| LinkedIn post | `linkedin` | `social` | `founder-posts-2026-11` |
| Instagram post | `instagram` | `social` | `reels-2026-11` |
| Cold email | `email-outreach` | `email` | `robotics-startups-2026-11` |
| College club outreach | `college-club` | `partner` | `drone-clubs-2026-11` |
