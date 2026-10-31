# MechHub Outbound Playbook

**Version:** v1
**Last updated:** 2026-10-31
**Status:** Ready for founder review. Nothing has been sent. Items marked `[CONFIRM]` need a founder decision before use.

## The Plan in Brief

- **Motion:** founder-led outreach, with an instant price on one part as the offer.
- **Volume:** 10 to 20 well-chosen contacts a week. With 10+ active MechMasters, capacity matters more than reach, so raise volume only when delivery holds.
- **Order of channels:** warm introductions first, LinkedIn second, cold email third.
- **Success measure:** replies, then first orders. Opens are not measured.

## Who to Target

**ICP:** Indian teams making custom metal parts in low volumes, who are iterating on real hardware and need parts faster than their current vendors deliver.

| Pass | Fail |
|------|------|
| Builds physical products in India | Software only |
| Uses sheet metal, CNC or finishing | Needs only PCBs or plastic moulding at volume |
| Prototype or low-volume stage (1 to 1,000+ parts) | High-volume contracts only |
| A named mechanical, hardware or founder contact | No identifiable person |
| No certified supply chain requirement we can't meet | Needs aerospace or medical certification today |

### Segments, in Priority Order

| Segment | Who to contact | Signal to look for | Sender |
|---------|----------------|--------------------|--------|
| 1. Hardware startups (robotics, drones, EV) | Founder or head of mechanical | Funding, product launch, mechanical hiring | Ujjwal Jha |
| 2. College clubs (Formula Bharat, BAJA, robotics, drones) | Team captain or manufacturing lead | New build season, new competition rules | Divyanshu Ranjan |
| 3. Businesses and industrial buyers | R&D, design or procurement lead | New product line, plant expansion | Ujjwal Jha |

Why this order: startups repeat orders and can pay, clubs bring future engineers and word of mouth, and industrial buyers take longer to close.

## How to Find Them

1. **Warm paths first.** Ask your 100+ repeat customers who else they know. Check the founders' LinkedIn connections against the target list.
2. **Signals each week.** Read the Entrackr weekly funding report and pull out hardware companies.
3. **Hiring.** Search job boards for "mechanical design engineer" at startups.
4. **Events.** Use Formula Bharat and BAJA team lists, and college club pages.
5. **Your own product.** Follow up on signups from company domains. This is the strongest signal you have, and the new `sign_up` and `part_added` events show when it happens.

### Signal Freshness

| Signal | Act within |
|--------|-----------|
| Signup from a company domain | Same day |
| Funding | 30 to 60 days. After that, don't mention it |
| Job post | While it's open, up to about 60 days |
| Product launch | 30 days |

### Rules for the List

- Public business contacts only: the company's site, or a licensed data tool.
- Never scrape LinkedIn or Google Maps.
- Verify every email before sending, and keep bounces under 2%.
- Record the source and date for every contact.
- Keep a suppression list, and never email anyone who opted out.
- Student emails: use published team addresses, not personal ones.

India's data protection law (DPDP Act) may affect how contact data is stored. This is from general knowledge and hasn't been reviewed for MechHub, so check it with your legal adviser.

## The Offer

**Upload one part and see a live price with DFM feedback in minutes.**

It already exists, so it takes no free engineer time and scales with outreach. It's also useful to an engineer even if they never order.

- Instant pricing covers CNC machining, sheet metal and 3D printing. Our engineers quote anything else.
- `/quote/instant` needs a free account, so say that plainly when you send the link.
- Don't put the link in the first email. Send it when they reply, with UTM tags from `docs/tracking-plan.md`.

## Proof You Can Use

- 500+ orders delivered
- 100+ repeat customers
- 72 hours typical turnaround
- Verified MechMasters working under full NDA contracts

Never use the placeholder testimonials, name a customer without permission, or claim ISO certification until it's approved.

## Sending Setup

1. **Don't send cold email from `mechhub.in`.** It carries your invoices, password resets and order emails.
2. Buy one secondary domain that is clearly yours, and redirect it to `mechhub.in`.
3. Set up SPF, DKIM and DMARC, with one mailbox each for Ujjwal Jha and Divyanshu Ranjan.
4. Warm up for 3 to 4 weeks. Start cold sends at 5 to 10 a day per mailbox.
5. Plain text only: no images, no attachments, and no link in the first email.
6. Turn off open and click tracking.
7. Every email carries the opt-out line and postal address.

**While the domain warms up,** use warm introductions and LinkedIn from the founders' own profiles. Personal LinkedIn messages are written by hand, without automation.

**Stop rules:** pause if bounces pass 2% or spam complaints reach 0.1%. A reply on any channel stops every other channel for that person.

## Sequence 1: Hardware Startups

From Ujjwal Jha, to a founder or head of mechanical. Replace every bracket with something specific to that company, or don't send.

**Email 1, day 0**
Subject: `{robot} parts`

> Hi {name},
>
> {Specific detail about their product}. Teams at this stage usually change the frame every few weeks, and each change means chasing the shop again.
>
> You can upload one part to MechHub and see a live price with DFM feedback in minutes.
>
> Want the link for your next revision?
>
> Ujjwal

**Email 2, day 4**
Subject: `one revision`

> Hi {name},
>
> Most of the delay on a revision is usually the wait for a quote and the handoffs between cutting, bending and finishing.
>
> We take one order for all of it, and parts typically arrive in 72 hours. 100+ customers have come back to reorder.
>
> Which part is slowing your next build the most?
>
> Ujjwal

**Email 3, day 9**
Subject: `your cad files`

> Hi {name},
>
> Founders often ask me who sees their design. Every MechHub partner has signed a full NDA contract before they get a file.
>
> Happy to send you the NDA policy if that's useful for your team.
>
> Ujjwal

**Email 4, day 16**
Subject: `closing this out`

> Hi {name},
>
> I'll stop here so I'm not filling your inbox. If custom parts become a bottleneck later, reply to this and I'll pick it up.
>
> Ujjwal

## Sequence 2: College Clubs

From Divyanshu Ranjan, to a team captain or manufacturing lead.

**Email 1, day 0**
Subject: `{team} build season`

> Hi {name},
>
> {Specific detail about their car, robot or drone}. With {competition} coming up, I'd guess the machining and sheet metal schedule is already tight.
>
> You can upload one part from this year's build to MechHub and see a live price with DFM feedback in minutes.
>
> Want the link?
>
> Divyanshu

**Email 2, day 5**
Subject: `one order`

> Hi {name},
>
> Teams usually lose time moving parts between cutting, bending and anodizing shops. We take all of that as one order, and you can order a single part.
>
> Is there a part on your list that's been hard to get made?
>
> Divyanshu

**Email 3, day 12**
Subject: `next build`

> Hi {name},
>
> I'll leave it here for now. If parts get tight before the event, reply here and I'll help where I can.
>
> Divyanshu

**Sponsorship:** clubs will often ask for it. `[CONFIRM]` Decide your answer before you send: a fixed credit, a discount, or no.

## Sequence 3: Businesses and Industrial Buyers

From Ujjwal Jha, to an R&D, design or procurement lead.

**Email 1, day 0**
Subject: `{product} prototypes`

> Hi {name},
>
> {Specific detail about their new product or line}. Production vendors rarely want a batch of 10, so prototypes tend to get stuck.
>
> We handle small runs across cutting, machining, bending and finishing on one order, and you can see a live price on a part in minutes.
>
> Want the link to try one prototype part?
>
> Ujjwal

**Email 2, day 6**
Subject: `small batch vendor`

> Hi {name},
>
> A question from our side: who handles your small batches today?
>
> We've delivered 500+ orders through verified partners who work under full NDA contracts, so we usually sit alongside the production vendor.
>
> Is that gap worth a short call?
>
> Ujjwal

**Email 3, day 14**
Subject: `closing this out`

> Hi {name},
>
> I'll stop here. If a small batch comes up, reply to this and I'll send the link.
>
> Ujjwal

## Signature

Add this to every email:

```
{Name}, {Title}, MechHub
A unit of Synchubb Innovations Pvt Ltd
Atal Incubation Centre - Raise, Coimbatore, Tamil Nadu, India
If this isn't relevant, reply "no" and I won't follow up.
```

`[CONFIRM]` The site shows this address. Use the company's registered postal address if it's different.

## LinkedIn

1. Follow the person and react to one recent post, a day or two before connecting.
2. Send a connection request with no note, or one short line about their product.
3. Message only after they accept, and never paste the email copy.

Example: "Saw {detail}. We make custom parts for hardware teams in India. Would a live price on one part be useful?"

## Handling Replies

Reply to interested people within an hour during work hours.

| Reply | Action |
|-------|--------|
| Interested | Send the instant quote link, and offer two call times |
| Wants details | Answer in two lines, then send the link |
| "We have a vendor" | "Makes sense. Is there a part they don't like doing?" Then stop |
| "Too expensive" | Ask which part, and send a real price |
| Not now | Ask when to return, and set a reminder |
| Referral | Thank them and ask for an introduction |
| Unsubscribe | Add to the suppression list the same day. No reply needed |

## Measuring It

| Metric | Early target | Source |
|--------|--------------|--------|
| Positive reply rate | 3% or more over 100+ contacts | Your sending tool |
| Signups from outbound | Count weekly | GA4 `sign_up`, after going live |
| Quote requests from outbound | Count weekly | GA4 `quote_requested`, after going live |
| First orders from outbound | Count monthly | Razorpay and GA4 `purchase` |

The 3% is a starting target of mine, not a benchmark taken from MechHub data. Replace it after your first 100 contacts.

Links in later emails use the UTM convention in `docs/tracking-plan.md`.

## Weekly Routine

| Day | Task |
|-----|------|
| Monday | Pull signals and add 10 to 20 new contacts |
| Tuesday | Research each contact and write the specific line |
| Wednesday | Send, and work LinkedIn |
| Friday | Review replies and note what worked |

Run one sequence at a time until you have a few hundred touches before judging it.
