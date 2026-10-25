# MechHub Security Audit

**Date:** 2026-10-24
**Scope:** `studio/` (Next.js 16 + TypeScript + Firebase Auth/Firestore + Razorpay + AWS S3) and `cad-converter/` (FastAPI + CadQuery), as they are in the working tree, uncommitted changes included.
**Features covered:** register/login/session, cart and checkout, instant-quote analysis (S3 upload intent → converter), Razorpay payments (quote orders, project milestones, shop), project/quotation workflow, file download/retrieve, Firestore rules, dependencies.
**Method:** I read the source, traced each flow, ran `npm audit` in `studio/`, and checked configuration and git history for secrets. This was a read-only review: I changed no application code and made no requests to production systems.

---

## Update (2026-10-24, after review)

### Fix status

- **C1: fixed in the working tree (not committed, not deployed).** The new `src/lib/quotation-acceptance.ts` holds the rules:
  - A customer counter-offer no longer changes `quotedPrice`.
  - Accept requires an open quotation on *this* project for *this* customer, at a price the *other* party proposed.
  - The quoting vendor can now accept a customer's counter-offer (the vendor page already called this route and got a 403).
  - Accept stores `acceptedQuotationId`.
  - `firestore.rules`: quotations create/update are admin-only (vendors already use the API).
  - Tests: `src/lib/__tests__/quotation-acceptance.test.ts` (11).
- **C2: fixed in the working tree.** `next@16.4.3` and `eslint-config-next@16.4.3`; `npm audit` now reports no `next` advisories. The OG route caps and strips its query input.
- **L3 Razorpay webhook: built (not committed).**
  - New route `POST /api/v1/payment/webhook`. It checks a raw-body `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET` and answers 503 when that is unset. It caps the body at 256 KB.
  - It handles `payment.captured`, `order.paid`, `payment.failed`, `refund.processed` and `refund.failed`.
  - Each event id is logged once in `razorpay_webhook_events`. Permanent mismatches are acknowledged and logged; transient errors return 5xx so Razorpay retries.
  - The captured amount is checked against the record. Milestone orders now store `amountPaise`.
  - The new `PaymentFulfilmentService` is a set of idempotent Firestore transactions, shared by the webhook and all three browser verify routes.
  - Tests: `src/lib/__tests__/razorpay-webhook.test.ts` (17).
- **H3: fixed as part of that change.** Every path now requires the record's stored `razorpayOrderId` to equal the paid order. `order/verify` no longer skips the ownership check when Admin SDK init fails (it returns 503).
- **L1: fixed.** Signature checks go through `src/lib/razorpay-signature.ts` (`timingSafeEqual`).
- **Bug found and fixed:** the old `CheckoutService.markAsPaid` (now removed) wrote `'paymentStatus.advance'` through `set({merge})`. Firestore stores that as a literal dotted field name, so `paymentStatus.advance.paid` was never set and the double-payment check in `priceProjectPayment` could not see project payments made through the cart flow.
- **Behaviour change:** a shop payment that arrives after stock ran out is recorded as paid with `status: 'stock_conflict'` for an admin to refund or restock. Before, it stayed unpaid even though Razorpay had taken the money.
- **C1 end to end:** `quotation-price-flow.test.ts` (6) drives the real PATCH → accept → `payment/create-order` handlers on an in-memory Firestore. The ₹1 counter-offer and cross-project acceptance both fail, and a vendor-accepted counter-offer is exactly what Razorpay charges.
- **C2 smoke test:** the production build was served on Next 16.4.3. `/api/v1/og` renders (200 `image/png`) with oversized and markup input. The webhook rejects unsigned POSTs (401).
- **H1: fixed.** `projects/[id]/status` returns 403 unless the caller is an admin or an active MechMaster. Tests: `project-status-access.test.ts` (4).
- **H2: fixed.**
  - `/api/v1/notifications/send` now takes only `{ projectId, type, …offer values }`. The server addresses mail to `users/{ownerUid}.email` and fills content from the project.
  - Admins send the admin-side updates. The project owner can only send `quote_accepted`, and only once the project is accepted. Vendors are refused; no vendor screen ever called this route.
  - `NotificationService` HTML-escapes every template argument centrally and strips control characters from subjects.
  - The 5 UI call sites were updated. Before this, the customer's acceptance email was always refused with a 403; the page now awaits its status write so the server sees the acceptance.
  - Tests: `notification-safety.test.ts` (6).
- **H3: fixed (see above).** `scripts/expire-legacy-unpaid-orders.ts` lists, and with `--apply` expires, unpaid orders that have no `razorpayOrderId`, which can no longer be paid. Not yet run against production.
- **H4: mostly fixed.**
  - Upgraded `firebase-admin` 10.3 → 13.10 and declared `@google-cloud/firestore` directly, because npm skipped the optional dependency. I chose 13 over 14 because 14 requires Node ≥ 22 and `apphosting.yaml` pins no runtime.
  - Upgraded `sharp` 0.34 → 0.35.5. `mongoose` and the unused `src/db/` models were then removed from the working tree, outside this session; typecheck, tests and audit pass without them. Remove `MONGODB_URI` from env and rotate that Atlas credential if Mongo isn't planned.
  - Ran `npm audit fix`. Order arrays are now capped at 50 (zod advisory mitigation), and `isAdvance` + `isBalance` together is rejected.
  - `npm audit`: **0 critical** (was 5), 16 high (was 44), 70 moderate.
  - Remaining highs need major migrations:
    - `zod` 3 → 4
    - `firebase` client 11 → 12 (its gRPC advisory)
    - `inngest`
    - `genkit`
    - `contentlayer2`/MDX (build-time)
- **Still open from H2's area:** server-side emails in `project-rfq.service.ts` and the payment confirmations still address `projectRFQs.userEmail`, which the customer can write. Content is now escaped, but the recipient can be redirected to any address. Resolve recipients from `users/{uid}.email`, or add `userEmail` to the protected project fields.
- **Precondition for C1 (clarified):** the accept route only runs while the project's canonical status is `RFQ_SENT` or `ACCEPTED`.
  - That state is reachable through admin-issued quotations, and through the customer's own client-side `quotation_sent → accepted` status change, which the rules allow.
  - A vendor bid through `POST …/quotations` moves the project to `QUOTATION_SENT`, after which accept returns 409. That is a functional bug in the marketplace flow, separate from this audit.

### Medium findings: fixed (working tree, not committed)

| Finding | Fix | Tests |
|---|---|---|
| **M1** vendor self-assign | `projects/[id]/accept` requires the vendor to be on `invitedVendorIds` / `shortlistedVendorIds` / `selectedVendorIds` (merged, so an empty list can't hide a shortlist) and the RFQ to be `RFQ_SENT` | `medium-findings.test.ts` |
| **M2** unbounded uploads, no rate limits | Presigned PUTs sign `ContentLength`, so S3 rejects any other body size (checked: `X-Amz-SignedHeaders=content-length;host`). Per-account limits: upload intents 60/h, CNC upload intents 60/h, converter analyses (CNC / sheet / print) 30/h, quote saves 120/h | `file-access.test.ts`, `quote-auth.test.ts` |
| **M3** legacy file fallback trusted client `createdAt` | "Earliest part" now uses Firestore's own document `createTime`. Parts with no server time never count | `file-access.test.ts` (back-dated forged part refused) |
| **M4** vendor profiles world-readable | `users` read = owner or admin only. The matching page loads `GET /api/v1/vendors/directory`, which returns card fields only: name/team, https image, rating, verified flag, city/state, experience, specializations, portfolio. No email, phone, GST, revenue or street address | `medium-findings.test.ts`, plus a browser check on `/matching` against production data |
| **M5** cron open without secret | `/api/vendors/reminders` returns 503 when `CRON_SECRET` is unset and 401 on a wrong secret (constant-time compare) | `medium-findings.test.ts` |
| **M7** login token in verification URL | The verify route redirects to `/login?verified=true&redirect=…` and mints no custom token; the login page has no `?token=` auto sign-in | `medium-findings.test.ts` |
| **M10** converter copies to public bucket, open `/status` | `cad-converter/main.py`: STEP/STL files are no longer uploaded anywhere (`_upload_to_s3` removed). Jobs record their `owner`. `/status/{id}` needs the creator's convert ticket (or the service token), returns 404 for anyone else, and never returns `owner`/`fileUrl`/`resultUrl`. The app sends its ticket when polling and renews it on 401 | converter `tests/test_convert_access.py` (82/82), `step-converter-status.test.ts` |

**Rollout:**
1. **Deploy order:** deploy the app before the converter. The new app sends tickets to the old converter, which ignores them. The old app polls without one, which the new converter refuses.
2. **Cron secret:** set `CRON_SECRET` on App Hosting and send it as `x-cron-secret` from the scheduler.
3. **Firestore rules:** deploy them; they include the `users` read lock.
4. **Old copies in S3:** delete `cad_uploads/` and `cad_outputs/` from `mechhub-product-images` if present.
5. **Legacy file fallback:** run `scripts/backfill-file-owners.ts --apply`, then set `FILE_ACCESS_LEGACY_FALLBACK=false`.

### Re-verification (2026-10-24): every Critical and High finding re-investigated

**Code re-trace (fresh pass):**
- Every write of `quotedPrice` or `finalPrice` is now either admin-only (the admin panel, under the rules) or server-validated (the vendor bid route, and accept via `decideAcceptance`).
- Every "mark paid" write is in `PaymentFulfilmentService`.
- Every email goes through `NotificationService`, which escapes all template arguments.
- Last H2 gap closed: the RFQ, negotiation, payment-confirmation and notify emails now go to the owner's account email through `src/lib/project-contact.ts` (`users/{uid}.email`). They no longer use the client-editable `projectRFQs.userEmail`.

**Attacks against the production build (`next start`, port 9010).** All 18 were refused:

| Finding | Attack | Result |
|---|---|---|
| C1 | Counter-offer and accept with no auth, then with a forged ID token | 401 |
| C2 | OG route with markup and a 5 KB title | 200 `image/png` (input stripped and capped) |
| C2 | `/_next/image` fetching an SVG from an allowed host | 400 "image type is not allowed" (PNG from the same host: 200) |
| C2 | `/_next/image` pointed at `169.254.169.254` (cloud metadata address) | 400 |
| C2 | `/admin` with `x-middleware-subrequest`; `/dashboard` with RSC segment-prefetch headers | redirected to `/login` |
| C2 | Browser with a forged `session` cookie on `/admin`, `/dashboard`, `/vendor` | redirected to `/login` (screenshot taken) |
| H1 | Project status change with no auth, then with a forged token | 401 |
| H2 | Old-style email relay with any recipient; new route with a forged token | 401 |
| H3 | Webhook unsigned / signed with a guessed secret / body re-serialised after signing | 401 |
| H3 | Webhook with a 300 KB body | 413 |
| H4 | Admin SDK 13 starts with the real credentials and rejects forged tokens (server log) | OK |

**In-process end-to-end tests (real route handlers, in-memory Firestore):**
- C1: 6 tests
- webhook / H3: 17 tests
- H1: 4 tests
- H2: 6 tests, plus the RFQ recipient assertion

Full suite: **302/302**. Typecheck clean. `next build` succeeds. `npm audit`: 0 critical. `next`, `jsonwebtoken`, `node-forge`, `protobufjs` and `handlebars` report no advisories.

**Not tested as a signed-in user.** That needs real accounts and writes on production Firebase, and `.env.local` holds live Razorpay keys. A signed-in click-through (customer counters → vendor accepts → customer pays advance; admin status emails; a real webhook delivery) needs a staging Firebase project and `rzp_test_` keys.

**Production caveat for C1:** until the repo `firestore.rules` are deployed, the live rules still let a vendor write a quotation straight from the client. A vendor colluding with a customer could create a ₹1 bid on that customer's project, and the customer could accept it. The route fix blocks every other path. Deploying the rules closes this one too.

### Deployed Firestore rules (as provided) are the older version

The production rules differ from `studio/firestore.rules` in ways that **add** risk. Until the repo rules are deployed, these apply in production:

| Gap in deployed rules | Effect |
|---|---|
| `partProtectedFields` and the projectParts create allow-list lack `instantQuote`, `quoteStatus`, `quoteNote` | **High.** A customer can write a forged `instantQuote` (for example `pricePerPart: 1`) on their own parts. The project cost summary, the RFQ `instantCostSnapshot`, the quotation PDF and the admin "Apply instant prices" button all read it, so the admin can be steered into quoting, and charging, a forged price |
| `projectProtectedFields` lacks `artifacts`, `timelineEvents`, `negotiationHistory`, `instantCostSnapshot`, `quoteRequestedAt` | The customer can forge timeline events, negotiation history (messages that look like they came from the admin) and cost snapshots |
| `customerStatusChange` allows `draft → quote_requested` and `quotation_sent → negotiation` from the client | Skips the server RFQ and negotiation routes (part checks, snapshots, notifications) |
| `quotations` create/update allowed for vendors | The C1 variant: a vendor writes a bid on any project at any price, straight from the client |
| `consultationRequests`, `contactQueries`, `newsletter_subscribers`: `create: if true` | Unauthenticated, unvalidated, unthrottled writes. These bypass the rate-limited server routes (spam and storage cost) |
| `users` read (same as the repo) | M4 still applies |

**Action:** deploy the repo rules, which include the C1 quotation change, after a staging check:

```bash
firebase deploy --only firestore:rules
```

### S3 policy provided

The public-read policy plus `*` GET/HEAD CORS for `marketing-video-mechhub` is fine for a marketing-assets bucket. Never apply it to `mechhub-assets` (CAD files), and keep customer files out of `mechhub-product-images` (M10).

---

## Summary

| # | Severity | Finding |
|---|----------|---------|
| C1 | **Critical** | A customer can set their own project price (counter-offer overwrites `quotedPrice`, then they accept it), so Razorpay charges what the customer chose |
| C2 | **Critical** | Next.js 16.2.4 has published unauthenticated RCE advisories. The app uses both affected features (`next/og` with user input, and the image optimizer with open remote hosts) |
| H1 | High | A suspended or inactive `mechmaster` can set **any** project to **any** status (the vendor checks are skipped) |
| H2 | High | Vendors can send MechHub-branded email with HTML they control to **any address** (open phishing relay). All email templates are unescaped |
| H3 | High | `/api/v1/order/verify` accepts a Razorpay signature from a different payment when the order has no `razorpayOrderId`, and skips the ownership check when Admin SDK init fails |
| H4 | High | `firebase-admin@10.3.0` (pulls in `jsonwebtoken@8.5.1`, `node-forge`, `protobufjs@6`) sits on the token-verification path. `npm audit` reports 5 critical, 44 high, 85 moderate and 3 low |
| M1 | Medium | Any active vendor can self-assign a project that has no invite list, which also gives them the customer's CAD files |
| M2 | Medium | Presigned S3 PUTs don't enforce size, and upload-intent and analysis routes have no rate limit (storage cost and converter CPU DoS) |
| M3 | Medium | The legacy file-access fallback trusts the client-written `projectParts.createdAt`, so another user's legacy CAD file can be read |
| M4 | Medium | Active vendors' full `users` docs (phone, email, address, GST, monthly revenue) can be read **without signing in** |
| M5 | Medium | The vendor-reminder cron endpoint is open when `CRON_SECRET` is unset (it is unset in `.env.local`) |
| M6 | Medium | Firestore rules are over-permissive for `notifications`, `negotiations/messages`, `reviews`, `rfqs`, `blog_comments` and `blog_stats` |
| M7 | Medium | The email-verification link turns into a Firebase **custom token in a URL query string** (a 24 h magic login link that leaks into history and logs) |
| M8 | Medium | Account suspension isn't enforced on most APIs, and logout doesn't revoke the session |
| M9 | Medium | `/api/v1/shop/checkout` prices products that have no `salePrice` at ₹0, ignores `isActive`, and accepts fractional quantities |
| M10 | Medium | The converter copies customers' STEP/STL files to `AWS_S3_BUCKET` (the public product-image bucket in this env) and exposes the URL on unauthenticated `/status/{id}` |
| L1–L10 | Low | Timing-unsafe signature comparisons, verbose errors, no webhook/reconciliation, missing security headers, broad converter allow-list, cross-user quote refs at checkout, rate-limit bucket collapse, dev env on live keys, unpinned converter image, `dangerouslySetInnerHTML` on converter SVG |

**Things that are already done well** (checked, no finding): Firebase Auth stores passwords (scrypt), and there is no custom password storage. The session cookie is `httpOnly`, `SameSite=strict` and verified with `checkRevoked`, so classic CSRF is blocked. Self-service role escalation is closed (`toSelfServiceRole`, admin only for a verified `ADMIN_EMAILS` address). Quote and shop line prices are recomputed on the server from saved quotes and the catalogue (`CheckoutService.priceOrder`). Razorpay HMAC verification is present on all three verify routes and is bound to the stored order id. The Firestore rules block client `orders` creation and all client writes to price, payment and role fields. S3 keys are generated on the server and sanitised (no traversal). Downloads are authorised from server-written `uploaded_files` records. Converter service auth fails closed with `hmac.compare_digest`, and file fetches are HTTPS-only with no redirects and a size cap. Redirects after login go through `getSafeRedirectPath`. Firestore queries are SDK-parameterised (no NoSQL-injection surface found), and Mongoose is never imported by app code. No `.env*`, key or service-account file has ever been committed (checked the full `git log --all`). The logger redacts keys named `token`, `secret` and `password`.

---

## Critical

### C1. Customer-controlled price: counter-offer overwrites `quotedPrice`, then the customer accepts it

**Files**
- `src/app/api/v1/projects/[projectId]/quotations/[quotationId]/route.ts:72-77`: any party, **including the customer**, overwrites `quotedPrice`/`leadTimeDays` and sets `status: 'revised'`.
- `src/app/api/v1/projects/[projectId]/quotations/[quotationId]/accept/route.ts:36-72`: the owner accepts **any** quotation id. It never checks `quote.rfqId === projectId`, `quote.status`, or who set the last price, then copies `quote.quotedPrice` onto the project.
- `src/app/api/v1/payment/create-order/route.ts:138` and `src/services/checkout.service.ts:230`: the Razorpay amount is `finalPrice || quotedPrice`.

**Exploitation**
1. The customer creates a project and requests quotes. A vendor bids ₹2,00,000, so a `quotations/{q_…}` doc exists with `userId = customer`. The customer can read its id through `GET /api/v1/projects/{id}/quotations`.
2. The customer sends `PATCH /api/v1/projects/{projectId}/quotations/{qid}` with `{"price":1,"leadTime":1,"message":"ok"}`. The route identifies them as `actorType = 'customer'` and writes `quotedPrice: 1, status: 'revised'`.
3. The customer sends `POST …/quotations/{qid}/accept`. The project gets `quotedPrice: 1`, `status: accepted` and the vendor assigned.
4. The customer sends `POST /api/v1/payment/create-order` with `{rfqId, paymentType:"advance"}`. The amount is `calculateProjectFinances(1)`: subtotal 1 + GST 0 + shipping 150 = 151, so the advance is **₹76**. `payment/verify` then marks the advance paid and moves the project to `in_progress`.
5. Variant without step 2: the accept route doesn't check that the quotation belongs to this project, so a cheap bid from the customer's *other* project (or a quotation created by a colluding vendor straight through the Firestore rule `quotations` create, rules:213) can be accepted onto an expensive project. It also accepts `declined`/`cancelled` quotations.

**Fix**: customers propose, only the vendor or an admin sets the binding price, and acceptance checks the quotation's project, status and who made the last move.

```diff
--- a/src/app/api/v1/projects/[projectId]/quotations/[quotationId]/route.ts
+++ b/src/app/api/v1/projects/[projectId]/quotations/[quotationId]/route.ts
@@
-    const updatedQuotation = {
-      id: quotationId,
-      quotedPrice: parsed.data.price,
-      leadTimeDays: parsed.data.leadTime,
-      status: 'revised' as const,
-      negotiationHistory: [...history, newEntry],
-      updatedAt: nowIso,
-    };
+    // Only the vendor (or an admin) can change the binding price. A customer's
+    // counter-offer is recorded in the history until the vendor re-quotes.
+    const updatedQuotation = {
+      id: quotationId,
+      ...(actorType === 'customer'
+        ? {}
+        : { quotedPrice: parsed.data.price, leadTimeDays: parsed.data.leadTime }),
+      status: 'revised' as const,
+      negotiationHistory: [...history, newEntry],
+      updatedAt: nowIso,
+    };
```

```diff
--- a/src/app/api/v1/projects/[projectId]/quotations/[quotationId]/accept/route.ts
+++ b/src/app/api/v1/projects/[projectId]/quotations/[quotationId]/accept/route.ts
@@
       if (!isAdmin && project.userId !== auth.uid) {
         return { ok: false, code: 403, message: 'Permission denied' };
       }
+
+      // The quotation must be a live bid on THIS project, for THIS customer.
+      if (quote.rfqId !== projectId || quote.userId !== project.userId) {
+        return { ok: false, code: 404, message: 'Quotation not found' };
+      }
+      if (quote.status !== 'pending' && quote.status !== 'revised') {
+        return { ok: false, code: 409, message: `Quotation is ${quote.status}` };
+      }
+      // The customer may only accept a price the vendor (or an admin) set last.
+      const lastMove = Array.isArray(quote.negotiationHistory) ? quote.negotiationHistory.at(-1) : undefined;
+      if (!isAdmin && lastMove?.party === 'customer') {
+        return { ok: false, code: 409, message: 'Waiting for the vendor to respond to your counter-offer' };
+      }
+      const price = Number(quote.quotedPrice);
+      if (!Number.isFinite(price) || price <= 0) {
+        return { ok: false, code: 409, message: 'Quotation has no valid price' };
+      }
@@
-        quotedPrice: quote.quotedPrice, // Lock in the price
+        quotedPrice: price, // Lock in the vendor's price
```

Also harden the rules so a vendor can't mint a quotation for an arbitrary project and price straight from the client (`firestore.rules:213-223`). Make quotation create/update server-only, which matches how `POST …/quotations` already writes through the Admin SDK:

```diff
-      allow create: if isAdmin() ||
-        (isVendor() && request.resource.data.vendorId == request.auth.uid);
-      allow update: if isAdmin() || (
-        isVendor() &&
-        resource.data.vendorId == request.auth.uid &&
-        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['userId', 'vendorId', 'projectId', 'rfqId']) &&
-        request.resource.data.get('status', '') != 'accepted'
-      );
+      // Bids and revisions go through /api/v1/projects/[id]/quotations (server-validated).
+      allow create, update: if isAdmin();
```

Finally, add a defence in depth to `payment/create-order` and `priceProjectPayment`: require `rfq.acceptedQuotationId` (written by the server) and re-read that quotation's `quotedPrice`, instead of trusting whatever ended up in `quotedPrice`.

---

### C2. Next.js 16.2.4: unauthenticated RCE and middleware-bypass advisories, with affected features in use

**Files**
- `package.json` (`"next": "^16.1.7"`, installed `16.2.4`).
- `src/app/api/v1/og/route.tsx:1-15`: `ImageResponse` from `next/og`, rendering `title`/`author` from the query string (GHSA-vcvr-r3jv-pc5j, *RCE in next/og ImageResponse*, `>=16.2.0 <16.3.6`).
- `next.config.ts` `images.remotePatterns` allows `res.cloudinary.com/**`, `picsum.photos`, `instasize.com` and others, so anyone can host an SVG/AVIF on Cloudinary and send it through `/_next/image` (GHSA-2464-fhr4-w9xw *RCE in Image Optimization when SVG files are used* `<=16.4.0`, GHSA-2xp9-vwfh-vxw4 AVIF `<16.3.3`, GHSA-cjq9-62q9-8jv4 SSRF in Image Optimization).
- `src/middleware.ts`: several middleware-bypass advisories (GHSA-267c-6grr-h53f, GHSA-26hh-7cqf-hhc6, GHSA-492v-c6pp-mqqv, GHSA-6gpp-xcg3-4w24 for *Turbopack + App Router*, and the dev script uses `--turbopack`). The impact is limited because the middleware only checks that a cookie is present, and pages and APIs re-verify on the server.

**Exploitation (per the advisories)**
1. The attacker requests `/api/v1/og?title=<crafted payload>` (unauthenticated, edge runtime), or
2. uploads a crafted SVG/AVIF to their own Cloudinary account and requests `/_next/image?url=https://res.cloudinary.com/<attacker>/…/x.svg&w=64&q=75`.
3. A vulnerable server runs attacker code, which exposes `FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY_SECRET`, AWS keys and `CONVERTER_SERVICE_TOKEN` from the environment. That means full data theft, account takeover and payment-fraud capability.

I didn't reproduce these. The rating follows the vendor's advisories plus the confirmed use of the affected features.

**Fix**

```diff
--- a/package.json
+++ b/package.json
-    "next": "^16.1.7",
+    "next": "^16.4.1",
-    "eslint-config-next": "16.1.6",
+    "eslint-config-next": "16.4.1",
```

```bash
npm install next@latest eslint-config-next@latest && npm audit --omit=dev
```

Use the newest 16.x that `npm audit` reports clean. Two advisories list `<=16.4.0` as affected. Until the upgrade ships, narrow the attack surface in `next.config.ts`:

```diff
   images: {
+    dangerouslyAllowSVG: false,
+    formats: ['image/webp'],
     remotePatterns: [
-      { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/**' },
+      // Only our own Cloudinary cloud, never every tenant's
+      { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/<your-cloud-name>/**' },
```

and cap and escape the OG inputs (`src/app/api/v1/og/route.tsx`):

```diff
-    const title = searchParams.get('title') || 'MechHub Chronicles';
-    const author = searchParams.get('author') || 'MechHub Team';
+    const clean = (v: string | null, fallback: string) =>
+      (v ?? '').replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, '').slice(0, 120) || fallback;
+    const title = clean(searchParams.get('title'), 'MechHub Chronicles');
+    const author = clean(searchParams.get('author'), 'MechHub Team');
```

---

## High

### H1. Suspended or inactive `mechmaster` bypasses every vendor restriction on project status

**File:** `src/app/api/v1/projects/[projectId]/status/route.ts:33-84`

The route allows the roles `admin` and `mechmaster` (line 33), then sets `isVendor = role === 'mechmaster' && status === 'active'` (line 42). The vendor restrictions (only own assigned project, only execution statuses) live inside `if (isVendor)` (line 77). A `mechmaster` whose status is `suspended`, `inactive` or `pending` is neither `isAdmin` nor `isVendor`, so **no restriction applies**. Any transition `canTransitionStatus` allows then succeeds on **any** project.

**Exploitation**
1. An admin suspends a misbehaving vendor (`users/{uid}.status = 'suspended'`). Their session cookie and ID tokens stay valid (see M8).
2. The vendor sends `POST /api/v1/projects/{anyProjectId}/status` with `{"nextStatus":"DELIVERED"}` (or `DISPATCHED`, `CANCELLED`, and so on) for projects they were never assigned.
3. Customers' projects jump to `shipped`/`delivered`, which unlocks balance payment requests, sends "shipped" emails and disrupts every order on the platform.

**Fix**

```diff
     const isAdmin = auth.role === 'admin';
     const isVendor = auth.role === 'mechmaster' && auth.status === 'active';
+    if (!isAdmin && !isVendor) {
+      return forbiddenResponse('Active MechMaster account required');
+    }
```

---

### H2. Vendor-controlled email relay plus HTML injection in every email template

**Files**
- `src/app/api/v1/notifications/send/route.ts:53-77`: any `mechmaster` can submit up to 5 events per request (20 requests/min per IP). The **recipient (`event.customer.email`) and every field are taken from the request body** and passed unvalidated to `NotificationService.sendAllAsync`.
- `src/services/notification.service.ts:49-158`: `to: event.customer.email`.
- `src/services/email-templates.ts:75-243` and throughout: `${name}`, `${projectName}`, `${message}` and `projectLink(projectId)` are interpolated into HTML **without escaping** (`escapeHtml` exists in `src/lib/auth-safety.ts:192` but the templates never use it).

**Exploitation**
1. The attacker holds a vendor (`mechmaster`) account, or has compromised one.
2. They send `POST /api/v1/notifications/send`:
   ```json
   {"events":[{"type":"status_shipped","customer":{"email":"victim@corp.com","name":"Priya"},
     "projectName":"Your order <a href=\"https://mechhub-pay.example/login\">Pay balance now</a>",
     "projectId":"x\" style=\"display:none\"><a href=\"https://mechhub-pay.example/login","quotedPrice":1}]}
   ```
3. Resend delivers a genuine, DKIM-signed `@mechhub.in` email with the attacker's link and markup. The phishing page then harvests MechHub or Google credentials, which means account takeover.
4. The same HTML injection works without a vendor account. Customer-controlled fields (`projectName`, negotiation `message`, consultation/contact text) are rendered into **admin** notification emails, letting an attacker put phishing markup in the admin's inbox.

**Fix**: (a) the server resolves recipients and content from Firestore, never from the body, and (b) templates escape everything.

```diff
--- a/src/app/api/v1/notifications/send/route.ts
+++ b/src/app/api/v1/notifications/send/route.ts
-    const body = await req.json();
-    const events: NotificationEvent[] = Array.isArray(body.events) ? body.events : [body];
+    // Clients name a project + event type only; the server builds the event.
+    const body = z.object({
+      projectId: z.string().min(1).max(128),
+      type: z.enum([...CLIENT_ALLOWED_EVENTS] as [string, ...string[]]),
+    }).safeParse(await req.json());
+    if (!body.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
+    const project = await ProjectRepository.getProjectRfqById(body.data.projectId);
+    if (!project.success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
+    const isAssignedVendor = project.data.assignedVendorId === auth.uid;
+    if (auth.role !== 'admin' && !isAssignedVendor) return forbiddenResponse('Not your project');
+    const events: NotificationEvent[] = [buildProjectEvent(body.data.type, project.data)]; // recipient = project owner's stored email
```

```diff
--- a/src/services/email-templates.ts
+++ b/src/services/email-templates.ts
+import { escapeHtml } from '@/lib/auth-safety';
+/** Escape every interpolated value; URLs additionally go through encodeURIComponent for ids. */
+const e = (v: unknown) => escapeHtml(String(v ?? ''));
@@
-    <p class="paragraph">Hi ${name},</p>
+    <p class="paragraph">Hi ${e(name)},</p>
@@
-        <div class="field-value">${projectName}</div>
+        <div class="field-value">${e(projectName)}</div>
@@
 function projectLink(projectId: string) {
-  return `${APP_URL}/projects/${projectId}`;
+  return `${APP_URL}/projects/${encodeURIComponent(projectId)}`;
 }
```

Apply `e()` to every `${…}` that isn't a constant (subjects in `notification.service.ts` too, since header injection via `\r\n` in `projectName` should be stripped).

---

### H3. Order payment verification: signature reuse on orders without `razorpayOrderId`, and a fail-open ownership check

**File:** `src/controllers/order.controller.ts:249-296`

- Line 264: `if (orderData.razorpayOrderId && orderData.razorpayOrderId !== razorpay_order_id)`. When the stored order has **no** `razorpayOrderId`, *any* genuine `(order_id, payment_id, signature)` triple is accepted. Orders created before the recent checkout change never stored `razorpayOrderId` (see the hand-over note: "previously never saved"), so every such unpaid order in production is exposed.
- Line 251: the ownership and order-match checks sit inside `if (adminFirestore) { … }`. If Admin SDK init fails (bad `FIREBASE_PRIVATE_KEY` formatting, for example), **both checks are skipped** and `CheckoutService.markAsPaid` still runs.
- `markAsPaid` (`src/services/checkout.service.ts:370`) doesn't check that the order is still `pending` or that the paid amount matches.

**Exploitation**
1. The attacker has a legacy unpaid quote order `order_X` worth ₹5,00,000 (no `razorpayOrderId`).
2. They buy the cheapest shop item through `/api/v1/shop/checkout` and pay ₹100 for real. Razorpay returns a valid `razorpay_order_id = order_cheap`, `payment_id` and `signature`.
3. They send `POST /api/v1/order/verify` with `{orderId: "order_X", razorpay_order_id: "order_cheap", razorpay_payment_id, razorpay_signature}`. The signature is valid and the order-id check is skipped, so `order_X` becomes `paid`, and a linked project is marked advance/balance paid and moved to `in_production`/`delivered`.

**Fix**

```diff
--- a/src/controllers/order.controller.ts
+++ b/src/controllers/order.controller.ts
-      const { adminFirestore } = getFirebaseAdmin();
-      if (adminFirestore) {
-        const orderSnap = await adminFirestore.collection('orders').doc(orderId).get();
+      const { adminFirestore } = getFirebaseAdmin();
+      if (!adminFirestore) {
+        return NextResponse.json({ success: false, error: { code: ErrorCode.INTERNAL_ERROR, message: 'Service unavailable' } }, { status: 503 });
+      }
+      {
+        const orderSnap = await adminFirestore.collection('orders').doc(orderId).get();
@@
-        if (orderData.razorpayOrderId && orderData.razorpayOrderId !== razorpay_order_id) {
+        // The signature only proves *a* payment happened; bind it to THIS order.
+        if (!orderData.razorpayOrderId || orderData.razorpayOrderId !== razorpay_order_id) {
@@
+        if (orderData.paymentStatus === 'paid') {
+          return NextResponse.json({ success: true, orderId });
+        }
       }
```

Apply the same `!orderData.razorpayOrderId ||` change to `src/app/api/v1/shop/verify/route.ts:57`. For extra assurance, fetch the payment from Razorpay before marking the order paid:

```ts
const payment = await razorpay.payments.fetch(razorpay_payment_id);
if (payment.order_id !== orderData.razorpayOrderId || payment.status !== 'captured' ||
    payment.amount !== Math.round(orderData.total * 100)) {
  return forbiddenResponse('Payment does not match this order');
}
```

Then migrate legacy orders: mark unpaid orders that have no `razorpayOrderId` as `expired` so they must be re-created.

---

### H4. Vulnerable dependencies on the authentication path (and elsewhere)

`npm audit` (studio) reports **137 vulnerabilities: 5 critical, 44 high, 85 moderate, 3 low**. The ones that matter:

| Package | Installed | Why it matters | Fix |
|---|---|---|---|
| `next` | 16.2.4 | See C2 (RCE, middleware bypass, SSRF, cache poisoning, DoS) | `next@latest` (≥ 16.4.1) |
| `firebase-admin` | 10.3.0 (direct) | Verifies every ID token and session cookie. Bundles `jsonwebtoken@8.5.1` (GHSA-hjrf-2m68-5959 RSA→HMAC key confusion, GHSA-8cf7-32gw-wr33), `node-forge` (RSA PKCS#1 signature-verification bypass GHSA-86w9-cpqp-85rv), `@google-cloud/firestore` (GHSA-4g6q-77j7-vvjc logs key material), `protobufjs@6` (prototype pollution, code injection), `@grpc/grpc-js`, `@fastify/busboy` DoS | `firebase-admin@^13` or `^14` (major: re-test `getFirebaseAdmin`, which uses v10 APIs) |
| `protobufjs` | 7.5.5 (direct) | Critical code-execution advisories (GHSA-xq3m-2v4x-88gg and others). Exploitable only if attacker-supplied schemas are loaded; none found | Upgrade, or drop the direct dependency if it's unused |
| `handlebars` | 4.7.9 (via genkit/dotprompt) | Critical template-injection advisories. Only exploitable if user input becomes a *template*; none found | `npm audit fix` |
| `sharp` | 0.34.5 (direct) | libvips/libheif CVEs, and it backs Next's image optimizer | `sharp@^0.35.5` |
| `zod` | 3.25.76 (direct) | Memory exhaustion on oversized collections (GHSA-mrhx-c7xc-m3w5), and every API validates with zod | Add `.max()` to arrays (e.g. `shop/checkout` `items`), and plan `zod@4` |
| `mongoose` | 9.5.0 (direct) | Prototype pollution. **Not imported by any app code** (`src/db/*` is dead) | Remove `mongoose`, `src/db/`, and the live `MONGODB_URI` credential |
| `postcss`, `undici`, `ws`, `axios`, `form-data`, `follow-redirects`, `fast-uri`, `vite`/`vitest` | various | Build-time or transitive | `npm audit fix` |

```bash
npm install next@latest firebase-admin@^13 sharp@^0.35.5 && npm uninstall mongoose && npm audit fix
```

**Converter (`cad-converter/`)**: it has no lockfile. Dependencies are pinned inline in the `Dockerfile` (`fastapi==0.111.0`, `uvicorn==0.29.0`, `python-multipart==0.0.9`, `boto3==1.34.100`, `google-cloud-firestore==2.16.0`) on top of `cadquery/cadquery:latest`. `pip-audit` isn't installed on this machine, so I couldn't scan it. From known advisories, `python-multipart 0.0.9` (CVE-2024-53981, multipart DoS, fixed 0.0.18) and the Starlette that ships with FastAPI 0.111 (CVE-2024-47874 multipart DoS, fixed Starlette 0.40) should be bumped. Pin the base image by digest. See L9.

---

## Medium

### M1. Any active vendor can claim a project that has no invite list

**File:** `src/app/api/v1/projects/[projectId]/accept/route.ts:54-67`

`if (Array.isArray(invited) && invited.length > 0 && !invited.includes(auth.uid))` skips the invite check entirely when no vendors were invited. `if (normalized && normalized !== 'RFQ_SENT')` skips the status check when the status isn't recognised.

**Exploitation:** an active `mechmaster` who learns a `projectId` (shared links, emails, a previous shortlist) sends `POST /api/v1/projects/{id}/accept`. They become `assignedVendorId`, and `FileAccessService.projectGrants` (`src/services/file-access.service.ts:46-51`) then lets them download every CAD file and artifact of that customer's project (IP theft).

**Fix**

```diff
-      if (Array.isArray(invited) && invited.length > 0 && !invited.includes(auth.uid)) {
+      if (!Array.isArray(invited) || !invited.includes(auth.uid)) {
         return { ok: false as const, code: 403, message: 'You are not invited for this project' };
       }
 
       const normalized = normalizeWorkflowStatus(project.workflowStatus, project.status);
-      if (normalized && normalized !== 'RFQ_SENT') {
+      if (normalized !== 'RFQ_SENT') {
```

### M2. Unbounded presigned uploads and unthrottled analysis (cost and DoS)

**Files:** `src/app/api/v1/files/upload-intent/route.ts:49-94`, `src/services/cnc-analysis.service.ts:71-75`, `src/controllers/quote.controller.ts` (`createCncUploadIntent`, `analyzeCnc`, `analyzePart`, `createQuote`, `createCncQuote`). None of these call `rateLimit`.

- `fileSize` is only *declared* by the client. The `PutObjectCommand` signs no `ContentLength`, so the presigned URL accepts any size (S3 allows up to 5 GB per PUT) for 15 minutes.
- The converter's per-user quotas (`convert_access.py`) cover only `/convert`. `/internal/analyze-*` is called with the service token, so all users share one unthrottled path into a 2-CPU OCCT container (`railway.toml`).

**Exploitation:** a signed-in, verified user loops `POST /api/v1/files/upload-intent` (no limit) and PUTs multi-GB files, running up S3 storage and egress costs. Or they loop `POST /api/v1/quote/cnc/analyze` with a heavy STEP file to pin the converter's CPUs, so instant quoting fails for every customer.

**Fix**: sign the length, and rate-limit per uid.

```diff
--- a/src/app/api/v1/files/upload-intent/route.ts
+++ b/src/app/api/v1/files/upload-intent/route.ts
+    const limiter = await rateLimit(`upload-intent:${auth.uid}`, 30, 60 * 60 * 1000);
+    if (!limiter.success) return rateLimitResponse(limiter.reset);
@@
-    const { fileName, fileSize, contentType } = await request.json();
-    if (!fileName || !fileSize) {
+    const { fileName, fileSize, contentType } = await request.json();
+    if (typeof fileName !== 'string' || !fileName || typeof fileSize !== 'number') {
@@
     const command = new PutObjectCommand({
       Bucket: bucket,
       Key: key,
       ContentType: contentType || 'application/octet-stream',
+      ContentLength: fileSize, // signed: S3 rejects a body of any other length
     });
-    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins
+    const uploadUrl = await getSignedUrl(s3Client, command, {
+      expiresIn: 900,
+      signableHeaders: new Set(['content-length', 'content-type']),
+    });
```

Do the same in `CncAnalysisService.createUploadIntent` (`ContentLength: fileSize`). Alternatively use `createPresignedPost` with `['content-length-range', 1, limit]`. Add `rateLimit(\`cnc-analyze:${user.uid}\`, 10, 3_600_000)` in `analyzeCnc`/`analyzePart`, and a global concurrency cap in the converter for `/internal/analyze-*`, like `ConvertQuota`. Also add an S3 lifecycle rule that expires `cnc-analysis/` objects.

### M3. Legacy file-access fallback trusts a client-written timestamp

**Files:** `src/services/file-access.service.ts:115-135`; `firestore.rules:176-182` (projectParts create doesn't constrain `createdAt` or the file key).

For files with no `uploaded_files` record, ownership goes to "the earliest part that referenced the key" (sorted by `createdAt`). `FILE_ACCESS_LEGACY_FALLBACK` defaults to on. A client can create a `projectParts` doc on its own draft project with any `cadFile.fileKey` and `createdAt: "0000-01-01T00:00:00Z"`.

**Exploitation:** an attacker who knows a legacy key (from an old email, a former shortlist, an admin screenshot, or the S3 URLs stored in projects) creates a part as described. Their part becomes "earliest", and `GET /api/v1/files/retrieve?fileKey=…` streams the victim's CAD file.

**Fix**: run `scripts/backfill-file-owners.ts --apply`, set `FILE_ACCESS_LEGACY_FALLBACK=false`, and stop clients from writing parts at all (the wizard already uses `POST /api/v1/projects/[id]/parts`):

```diff
--- a/firestore.rules
+++ b/firestore.rules
       allow create: if isAdmin() || (
         isAuthenticated() &&
         request.resource.data.userId == request.auth.uid &&
         isOwnDraftProject(request.resource.data.projectId) &&
+        request.resource.data.createdAt == request.time &&
         !request.resource.data.keys().hasAny(['unitCost', 'totalCost', 'price', 'quotedPrice',
-          'instantQuote', 'quoteStatus', 'quoteNote'])
+          'instantQuote', 'quoteStatus', 'quoteNote', 'cadFile', 'fileKey', 'fileUrl'])
       );
```

and in the service, ignore client parts for legacy access unless the part was server-written:

```diff
-      .filter((p) => p.userId && p.projectId)
+      .filter((p) => p.userId && p.projectId && p.source === 'server')
```

### M4. Unauthenticated read of active vendors' full profile docs

**File:** `firestore.rules:51-55`

```
allow read: if (resource != null && resource.data.role in ['vendor','mechmaster'] && resource.data.isActive == true) || …
```

This needs no `isAuthenticated()`. Firestore rules can't restrict fields, so the **whole** `users/{uid}` document is returned. For vendors that includes `email`, `phone`, `location` (workshop address), `gstNumber`, `monthlyRevenue` and `preferences` (written by `src/app/api/vendors/[id]/approve/route.ts:50-64`).

**Exploitation:** with the public web config (`NEXT_PUBLIC_FIREBASE_*`), anyone runs `getDocs(query(collection(db,'users'), where('role','in',['vendor','mechmaster']), where('isActive','==',true)))` and dumps every vendor's PII and revenue figures.

**Fix**: publish a separate, minimal `vendorProfiles/{uid}` document (name, specializations, rating, city) written by the server on approval, and lock `users` down:

```diff
-      allow read: if (resource != null &&
-                      resource.data.role in ['vendor', 'mechmaster'] &&
-                      resource.data.isActive == true)
-                  || isOwner(userId)
-                  || isAdmin();
+      allow read: if isOwner(userId) || isAdmin();
+    }
+    match /vendorProfiles/{vendorId} {
+      allow read: if true;              // public card only: no email/phone/GST/revenue
+      allow write: if false;            // written by the approve route (Admin SDK)
```

### M5. Vendor-reminder cron endpoint is public when its secret is unset

**File:** `src/app/api/vendors/reminders/route.ts:19-27`. `if (cronSecret) { … }` fails open, and `.env.local` has no `CRON_SECRET`.

**Exploitation:** `curl -X POST https://<host>/api/vendors/reminders` in a loop triggers `runVendorReminderCron()` each time, so vendors are spammed, Resend quota is burned and the sending domain's reputation drops.

**Fix**

```diff
-  const cronSecret = process.env.CRON_SECRET;
-  if (cronSecret) {
-    const provided = req.headers.get('x-cron-secret');
-    if (provided !== cronSecret) {
-      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
-    }
-  }
+  const cronSecret = process.env.CRON_SECRET;
+  const provided = req.headers.get('x-cron-secret') ?? '';
+  if (!cronSecret || provided.length !== cronSecret.length ||
+      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(cronSecret))) {
+    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
+  }
```

### M6. Over-permissive Firestore rules on secondary collections

**File:** `firestore.rules`

| Line | Collection | Problem | Exploitation |
|---|---|---|---|
| 287-295 | `notifications` | The owner can `update` **any** field, including `userId`, `title`, `message` and `link` | The attacker edits their own notification to `userId: <victim>` with a phishing `link`, so it appears in the victim's in-app feed as a MechHub notice |
| 249-262 | `negotiations/{id}/messages` | Create needs no `senderId == auth.uid` or role check | The customer posts messages as the vendor or as "admin" |
| 231-245 | `negotiations` | Any party may update any field (`customerId`, `vendorId`, amounts) | The parties can rewrite the agreed terms |
| 273-281 | `reviews` | Anyone signed in can create a review for any vendor (`customerId == self` is the only check). `read` allows **all** authenticated users to read non-public reviews | Fake reviews, and private reviews leak |
| 75-101 | `rfqs` | The owner and assigned vendor can update **every** field (price, status, assignment) | Legacy collection: same price/status tampering as C1 if anything still reads it |
| 372-383 | `blog_comments` | Only `userId` is checked, so `authorName`, `authorRole` and `isAdmin` are free text | Impersonating staff in public comments |
| 354-363 | `blog_stats` | Any user sets `likes`/`views` to any number | Metric tampering |
| 443-458 | `vendorApplications` | Duplicate `match` block (harmless but confusing) | n/a |

**Fix (excerpt)**

```diff
     match /notifications/{notificationId} {
-      allow read, update: if isAuthenticated() && resource.data.userId == request.auth.uid;
+      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
+      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid &&
+        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']);
@@
         allow create: if isAuthenticated() && (
-          get(/databases/$(database)/documents/negotiations/$(negotiationId)).data.customerId == request.auth.uid ||
-          get(/databases/$(database)/documents/negotiations/$(negotiationId)).data.vendorId == request.auth.uid ||
-          isAdmin()
-        );
+          request.resource.data.senderId == request.auth.uid &&
+          request.resource.data.createdAt == request.time && (
+            get(/databases/$(database)/documents/negotiations/$(negotiationId)).data.customerId == request.auth.uid ||
+            get(/databases/$(database)/documents/negotiations/$(negotiationId)).data.vendorId == request.auth.uid ||
+            isAdmin()));
@@
     match /reviews/{reviewId} {
-      allow read: if resource.data.isPublic == true || isAuthenticated();
-      allow create: if isAuthenticated() && isOwner(request.resource.data.customerId);
+      allow read: if resource.data.isPublic == true || isOwner(resource.data.customerId) || isAdmin();
+      allow create: if false; // created by a server route that checks a completed project
@@
     match /rfqs/{rfqId} {
-      allow update: if isAuthenticated() && ( … );
+      allow update: if isAdmin();   // legacy; no client writes
@@
     match /blog_comments/{commentId} {
-      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
+      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid &&
+        request.resource.data.keys().hasOnly(['userId', 'slug', 'content', 'createdAt']) &&
+        request.resource.data.content is string && request.resource.data.content.size() <= 2000;
```

### M7. Email verification issues a custom token in the URL (a long-lived magic login link)

**File:** `src/app/api/v1/auth/verify/route.ts:78-82`

After the verification token is checked, the route redirects to `/login?token=<Firebase custom token>&…`. That custom token signs in as the user (`signInWithCustomToken`, `src/app/login/page.tsx:94`). It lands in browser history, server/CDN access logs, Vercel Analytics page-view URLs (`@vercel/analytics` is installed), and the `Referer` of any third-party request from `/login`. On top of that, the verification link itself (valid 24 h) becomes a login link: corporate mail scanners that pre-fetch links, or anyone the email gets forwarded to, get a session.

**Exploitation:** the attacker reads a log, analytics export or forwarded email containing `/api/v1/auth/verify?token=…` (unused) or `/login?token=eyJ…` (valid ~1 h), opens it, and is signed in as the victim.

**Fix**: verify the email and send the user to sign in normally. Don't mint a login credential.

```diff
-    const customToken = await adminAuth.createCustomToken(uid, { email_verified: true });
-    const destination = encodeURIComponent('/dashboard?tab=projects');
-    return NextResponse.redirect(
-      `${APP_URL}/login?token=${customToken}&redirect=${destination}&verified=true`
-    );
+    // The user signs in with their own credentials; the client calls
+    // user.getIdToken(true) to pick up email_verified.
+    const destination = encodeURIComponent('/dashboard?tab=projects');
+    return NextResponse.redirect(`${APP_URL}/login?verified=true&redirect=${destination}`);
```

Also make the GET idempotent against link scanners: show a "Confirm verification" page that POSTs the token, instead of verifying on GET.

### M8. Suspension isn't enforced across the API, and sessions survive logout

**Files:** `src/lib/auth-middleware.ts:70-82` returns `status` but doesn't enforce it, and it defaults a missing profile to `'active'` (line 81). Only `quote.controller.ts:35`, `cad.controller.ts:28`, `projects/[id]/accept`, `projects/[id]/quotations` POST and `status` (partly) check it. Payment, order, shop, upload and file routes don't. `src/app/api/v1/auth/session/route.ts:141-154` (DELETE) only clears the cookie. The session cookie stays valid for 5 days and is never revoked.

**Exploitation:** a suspended customer or vendor keeps placing orders, uploading files and downloading project files. A session cookie stolen before logout (shared computer, malware) keeps working for up to 5 days after the victim "logs out".

**Fix**

```diff
--- a/src/lib/auth-middleware.ts
+++ b/src/lib/auth-middleware.ts
-    const userDoc = await adminFirestore.collection('users').doc(decodedClaims.uid).get();
-    const userData = userDoc.data();
+    const userDoc = await adminFirestore.collection('users').doc(decodedClaims.uid).get();
+    const userData = userDoc.data();
+    const status = userData?.status || 'active';
+    if (status === 'suspended' || status === 'banned' || status === 'deleted') {
+      return { success: false, error: 'Account is not active', status: 403 };
+    }
```

```diff
--- a/src/app/api/v1/auth/session/route.ts
+++ b/src/app/api/v1/auth/session/route.ts
-export async function DELETE() {
+export async function DELETE(req: NextRequest) {
+  const cookie = req.cookies.get('session')?.value;
+  const { adminAuth } = getFirebaseAdmin();
+  if (cookie && adminAuth) {
+    try {
+      const { sub } = await adminAuth.verifySessionCookie(cookie);
+      await adminAuth.revokeRefreshTokens(sub); // invalidates every session cookie for the user
+    } catch { /* already invalid */ }
+  }
```

Call `adminAuth.revokeRefreshTokens(uid)` in the admin "suspend user" action too.

### M9. Shop checkout: unpriced products are free, inactive items can be bought, and quantities can be fractional

**File:** `src/app/api/v1/shop/checkout/route.ts:26-33, 80-108`

`const price = product.salePrice || 0;`: a product with no `salePrice` (a "contact us" item, or a draft) is charged ₹0. `isActive` isn't checked. `quantity: z.number().min(1)` accepts `1.5`, and the array has no `.max()` (and zod 3 has an exhaustion advisory). Repeated ids skip the combined stock check. `CheckoutService.resolveShopItems` already does all of this correctly; this older route duplicates it badly.

**Exploitation:** the attacker posts `{"items":[{"id":"<cheap>","quantity":1},{"id":"<unpriced-or-draft>","quantity":5}], …}`, pays for the cheap item only, and `shop/verify` decrements the stock and marks the whole order paid.

**Fix**: reuse the hardened resolver.

```diff
-const CheckoutSchema = z.object({
-  items: z.array(z.object({ id: z.string(), quantity: z.number().min(1) })).min(1),
+const CheckoutSchema = z.object({
+  items: z.array(z.object({ id: z.string().min(1).max(128), quantity: z.number().int().min(1).max(1000) }))
+    .min(1).max(50),
@@
-    let subtotal = 0;
-    const validatedItems = [];
-    for (const item of items) { … }
+    const products = await ProductRepository.getProductsByIds(items.map((i) => i.id));
+    if (!products.success) return NextResponse.json({ error: 'Catalogue unavailable' }, { status: 503 });
+    let subtotal = 0;
+    const validatedItems = [];
+    for (const item of items) {
+      const product = products.data.get(item.id);
+      const price = Number(product?.salePrice);
+      if (!product || product.isActive === false || !Number.isFinite(price) || price <= 0) {
+        return NextResponse.json({ error: 'An item in your cart is unavailable' }, { status: 400 });
+      }
+      if (Number(product.inventory ?? 0) < item.quantity) { … }
+      subtotal += price * item.quantity;
+      validatedItems.push({ id: item.id, name: product.name, sku: product.sku, quantity: item.quantity, price });
+    }
```

and de-duplicate ids before the stock check, as `resolveShopItems` does.

### M10. Converter copies customer CAD files into the general bucket and exposes the URL without auth

**Files:** `cad-converter/main.py:1779-1841` (`_upload_to_s3` to `AWS_S3_BUCKET`, key `cad_uploads/{job_id}/{filename}` with the **raw multipart filename**), `main.py:1962-1968` (`GET /status/{job_id}` has no auth and returns `fileUrl`, `resultUrl` and the full STL as base64). In `studio/.env.local`, `AWS_S3_BUCKET=mechhub-product-images`, which `next.config.ts` serves directly to browsers, so it's very likely publicly readable. `src/lib/file-buckets.ts:8` also keeps legacy `rfq-designs/` in that bucket.

**Exploitation:** if the converter is deployed with the same `AWS_S3_BUCKET`, every STEP a customer previews is stored at a predictable `https://mechhub-product-images.s3.eu-north-1.amazonaws.com/cad_uploads/<uuid>/<name>.step`. Anyone holding a job id (browser history, logs, a shared screenshot) can call `/status/<id>`, get the link and download the customer's CAD file. If the bucket allows listing, no id is needed.

**Fix**: don't persist preview uploads, or write them to the private CAD bucket under a sanitised key, and never return a raw S3 URL:

```diff
-        step_s3_url = _upload_to_s3(step_bytes, f"cad_uploads/{job_id}/{filename}", "application/step")
-        if step_s3_url:
-            job_store.update_job(job_id, {"fileUrl": step_s3_url})
+        # Preview conversions are transient: the original never leaves this process.
@@
-                stl_s3_url = _upload_to_s3(stl_raw, f"cad_outputs/{job_id}.stl", "model/stl")
+                stl_s3_url = None  # result is returned inline via /status
```

Bind `/status/{job_id}` to the ticket's `sub` (store `caller` on the job and require the same ticket), and delete job docs after delivery or 1 h. Confirm `mechhub-product-images` has no `cad_uploads/`, `cad_outputs/` or `rfq-designs/` objects. If it does, move them to the private bucket.

---

## Low

**L1. Timing-unsafe HMAC comparisons.** `src/controllers/order.controller.ts:284`, `src/app/api/v1/payment/verify/route.ts:100` and `src/app/api/v1/shop/verify/route.ts:75` compare signatures with `!==`.
```ts
const a = Buffer.from(expectedSignature, 'hex'), b = Buffer.from(razorpay_signature, 'hex');
if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) { /* reject */ }
```
(or `validatePaymentVerification` from `razorpay/dist/utils/razorpay-utils`).

**L2. Verbose errors.** `payment/create-order/route.ts:212`, `payment/verify/route.ts:252`, `shop/checkout/route.ts:153` and `shop/verify/route.ts:140` return `err.message` (Firestore/Razorpay internals) on 500. `shop/checkout/route.ts:62-65`, `order.controller.ts:55-63` and `quote.controller.ts` return the full zod `format()`/`flatten()`. The converter returns `detail=str(exc)` (`main.py:1933, 1976, 2053`), and `converter-client.ts:117-121` relays that `detail` to the browser. Fix: return `'Internal server error'` plus a request id and log the details.

**L3. No Razorpay webhook or reconciliation.** `grep` finds no webhook route. A customer who pays and closes the tab before `/verify` runs stays "unpaid", and nothing alerts on paid-but-unrecorded orders. `payment/verify/route.ts:182` records `amount: rfq.finalPrice * 0.5`, which is wrong when only `quotedPrice` is set and ignores GST/shipping. Fix: add `POST /api/v1/payment/webhook` that verifies `x-razorpay-signature` over the **raw** body with a separate `RAZORPAY_WEBHOOK_SECRET` (`Razorpay.validateWebhookSignature(rawBody, sig, secret)`), handles `payment.captured`/`order.paid` idempotently by `razorpayOrderId`, and records `payment.amount / 100`.

**L4. Session hardening.** `auth/session/route.ts:46-108` mints a 5-day cookie from any non-revoked ID token and doesn't check `auth_time`, so a stolen 1-hour ID token becomes a 5-day session. Firebase recommends `if (Date.now()/1000 - decodedToken.auth_time > 5*60) return 401`. `secure` is set only when `NODE_ENV === 'production'`; prefer always (`localhost` is a secure context). `expectedRole` (line 33) is passed unvalidated (it's ignored for privilege today, but validate it with `z.enum(['customer','vendor'])`).

**L5. No security headers.** `next.config.ts` has no `headers()`: no CSP, HSTS, `frame-ancestors`/`X-Frame-Options` (clickjacking on the payment and admin pages), `Referrer-Policy` (which makes M7 worse) or `Permissions-Policy`.
```ts
async headers() { return [{ source: '/(.*)', headers: [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
]}]; }
```

**L6. Converter fetch allow-list and key reuse.** `cad-converter/service_auth.py:23` defaults to `.amazonaws.com`, which matches *any* S3 bucket and all EC2 public hostnames, so a leaked service token becomes a general-purpose fetcher. Set `FILE_URL_ALLOWED_HOSTS=mechhub-assets.s3.eu-north-1.amazonaws.com`. The same `CONVERTER_SERVICE_TOKEN` is both the bearer service credential and the HMAC key for user tickets (`convert-ticket.ts:37`, `convert_access.py:81-91`). Derive separate keys (`HMAC(token, "convert-ticket-v1")`) or use two secrets.

**L7. Quote ownership not checked at checkout.** `src/services/checkout.service.ts:98` discards the stored quote's `userId`. Any signed-in user with a quote ref can order it, and `GET /api/v1/quote/share/[ref]` is open to every signed-in user by design. Refs are random (`MH-` + 10 chars), so the risk is low, but if sharing isn't meant to allow ordering, add `if (_owner && _owner !== userId) return err(notFoundError('Quote', quoteRef))`. In the same function, `priceOrder` accepts `isAdvance` and `isBalance` together. Reject `isAdvance && isBalance` in `orderCreateSchema` (`.refine`), because `markAsPaid` would move a shipped project back to `in_production`.

**L8. Rate-limit identity collapses to `'unknown'`.** `src/lib/auth-safety.ts:165-181` returns `'unknown'` when the `X-Forwarded-For` chain is shorter than `TRUSTED_PROXY_HOPS`. All such clients then share one bucket, so 5 `/auth/session` attempts per minute lock *everyone* out of login. Confirm the real hop count on App Hosting and set `TRUSTED_CLIENT_IP_HEADER`. For anonymous routes, fall back to a per-route global limit instead of a shared key.

**L9. Supply chain and environment hygiene.**
- `cad-converter/Dockerfile:4` uses `FROM cadquery/cadquery:latest`. Pin by digest. There's no `requirements.txt` or lockfile for `pip-audit`.
- `studio/.env.local` points local dev at **production** Firebase, **live** Razorpay keys (`rzp_live_…`), the production S3 bucket and a live MongoDB Atlas URI. Any dev bug or test write hits real customers and money. Use a separate Firebase project and `rzp_test_` keys locally.
- Client fallbacks `'rzp_test_5W444444444444'` (`src/app/projects/[projectId]/page.tsx:734`) and `'rzp_test_dummy'` (`src/components/checkout/PaymentSection.tsx:63`) should fail loudly instead.
- `.env.local` defines `NEXT_PUBLIC_CONVERT_SERVICE_URL` twice. `APP_URL` holds two comma-separated values.

**L10. Unsanitised converter HTML in the browser.** `src/components/viewer/FlatPatternViewer.tsx:133` injects `flatPattern.svg` with `dangerouslySetInnerHTML`. Today the converter builds that SVG from numbers only (`main.py:1330-1395`), so it isn't exploitable. But any converter compromise, MITM (the URL is `http://` in dev), or future text in the SVG becomes stored XSS on the app origin. Sanitise with DOMPurify (`DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } })`) or render the bend lines from `flatPattern.bendLines` as JSX.

---

## Feature-by-feature notes

- **Register / login:** Firebase handles passwords and brute-force throttling. Registration goes through the client SDK and then `/api/v1/user/provision` (role is always `customer`, and an existing profile is never overwritten). Unverified emails can't get a session (except `vendor_pending`). `forgot-password` and `send-verification` don't reveal whether an account exists. Open redirect is guarded. Issues: M7, M8, L4, L8.
- **Cart / checkout:** cart totals in localStorage are **not** trusted. `CheckoutService.priceOrder` re-prices from saved quotes (expiry, DFM blocks, ±₹0.01 match), the product catalogue and the shipping registry, and that amount goes to Razorpay. The earlier lead ("checkout trusts cart totals from localStorage") **is fixed** in the current tree. Remaining issues: C1 (project price), H3, M9, L7.
- **Instant quote / CAD analysis:** the browser never calls `/analyze-*` directly. Analysis is server-to-server with a 10-minute presigned GET and a service token, results are zod-validated and stored per uid, and quotes reference `analysisId` (another user's id returns 404). Issues: M2, M10, L6, L10.
- **Payments:** the server computes the amount everywhere. Signatures are checked and bound to the stored Razorpay order id (except H3). Clients can't write order status (`orders` update is admin-only) or `paymentStatus` (rules). Issues: C1, H3, L1, L3.
- **Access control / IDOR:** checked `files/retrieve`, `files/download`, `files/upload-intent`, `quote/*`, `order/*`, `payment/*`, `shop/*`, every `projects/[projectId]/*` route, the `admin/*` routes (all check `role === 'admin'` on the server) and `vendors/*`. Issues: C1, H1, M1, M3, M5.
- **Injection:** no SQL. Firestore is accessed only through the SDK, with no string-built queries. Mongo/Mongoose is unused. HTML injection in email: H2. No `eval`/`new Function`. The other `dangerouslySetInnerHTML` uses are static JSON-LD and CSS.
- **CORS:** the Next API sets no CORS headers (same-origin only). The converter allows a fixed origin list, `allow_credentials=False`. Fine.

---

## What could not be verified from the repo alone

1. **Deployed Firestore rules.** The hand-over notes say the tightened `firestore.rules` were **not deployed** and never emulator-tested (Java 8 on this machine). If production still runs older rules, the protections credited above (protected price/payment/role fields, `orders` create:false, `uploaded_files` deny) may be missing and the risk is much higher. Check with `firebase firestore:rules:get` or in the console.
2. **S3 bucket policies, ACLs, Block Public Access and CORS** for `mechhub-assets` and `mechhub-product-images`: whether either is public, whether listing is allowed, and whether `cad_uploads/`, `cad_outputs/` or `rfq-designs/` objects exist in the public bucket (M10). Also the IAM policy of the app's AWS key (it should be scoped to `s3:PutObject`/`GetObject` on specific prefixes, not `s3:*`), and lifecycle rules.
3. **Razorpay dashboard:** whether webhooks are configured (L3), auto-capture settings, which key pair production uses, whether live keys were ever used outside production (they're in a developer's `.env.local`), and account-level fraud/limit settings.
4. **Production environment variables:** `CRON_SECRET` (M5), `FILE_ACCESS_LEGACY_FALLBACK` (M3), `TRUSTED_PROXY_HOPS`/`TRUSTED_CLIENT_IP_HEADER` (L8), `ADMIN_EMAILS`, `CONVERTER_SERVICE_TOKEN` strength (local is `mechhub-local-…`), `FILE_URL_ALLOWED_HOSTS` and `AWS_S3_BUCKET` on the converter (M10, L6), and whether `NEXT_PUBLIC_CONVERT_SERVICE_URL` is `https://` in production.
5. **Data state:** how many orders lack `razorpayOrderId` (H3), how many files lack `uploaded_files` records (M3), whether any `users` docs carry `role: 'admin'` that shouldn't, and whether any `quotations` were already price-overwritten by customers (C1). Query `quotations` where the last `negotiationHistory` entry has `party == 'customer'` and the project has `status == 'accepted'`.
6. **Infrastructure:** Firebase App Hosting/Cloud Run ingress, the CDN cache config for `/api/*`, Railway network exposure of the converter (is `/status`/`/convert` public, TLS?), WAF/DDoS protection, Firebase Auth settings (email enumeration protection, password policy, MFA for admins, authorised domains, App Check), Resend domain (SPF/DKIM/DMARC), and log retention and access.
7. **Exploitability of the dependency advisories** (C2, H4): I matched installed versions to advisories and confirmed the affected features are used, but didn't build exploits. The converter's Python dependencies weren't scanned (no `pip-audit` here). Run `pip-audit -r <(docker run --rm <image> pip freeze)` against the built image.
8. **Runtime behaviour:** nothing was exercised against a running server (`.env.local` targets production). Each finding comes from reading code and should be confirmed on a staging project before and after its fix.
