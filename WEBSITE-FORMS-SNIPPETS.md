# Opticwise.com — Form Builder Snippets

This is the hand-off doc for the **Opticwise.com cursor project** (the `/payload` site deployed to Vercel). The 5 forms below were created in the OW Form Builder backend (https://ownet.opticwise.com/forms) and are routed into the **Landing Pages Leads** pipeline, owned by Bill (`bill@opticwise.com`). Each submission auto-creates a Person + Organization + Deal in the CRM and emails Bill.

The marketing-site work is just two things:

1. **Replace the hardcoded React form components** with `<FormEmbed slug="..." />` wrappers (3 files).
2. **Add new FormEmbed CMS blocks** to the `/contact` and `/ppp-audit` pages via the Payload Admin (2 blocks).

Each snippet below is tagged with **`TARGET FILE:`** so the other agent knows exactly where it goes.

---

## Form Inventory

| Slug | Form Name | Where it appears | Stage in CRM |
|---|---|---|---|
| `schedule-review` | Schedule Your Review | Popup triggered from CTAs across the entire site | Landing pages |
| `inbound-contact` | Send a Message | `/contact` page | OW website inbound |
| `ppp-audit-request` | PPP Audit Request | `/ppp-audit` page (replaces broken `href="#"` CTA) | PPP book leads |
| `ppp-starter-kit` | PPP Starter Kit Download | Home page lead-magnet section + `leadMagnet` CMS block | PPP book leads |
| `insights-newsletter` | Insights Newsletter | Footer + optional `/insights` index | Landing pages |

All forms use the OpticWise platform's CORS-enabled public API:
- `GET https://ownet.opticwise.com/api/public/forms/{slug}` — definition
- `POST https://ownet.opticwise.com/api/public/forms/{slug}/submit` — submission

The existing `<FormEmbed />` component in `/payload/src/components/FormEmbed.tsx` already handles both calls — these snippets just wire the right slug to the right surface.

---

## Snippet 1 — Schedule Your Review (popup)

**TARGET FILE:** `payload/src/components/ScheduleReviewPopup.tsx`
**ACTION:** Replace the entire file contents below. Drops the hardcoded form + `/api/schedule-review` POST and uses `FormEmbed` inside the existing modal shell.

```tsx
"use client";

import { useState } from "react";
import { FormEmbed } from "./FormEmbed";

export function ScheduleReviewButton({
  className = "btn btn-white btn-lg",
  label = "Schedule Your Review",
}: {
  className?: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className={className}>
        {label}
      </button>
      {isOpen && <ScheduleReviewPopupInner onClose={() => setIsOpen(false)} />}
    </>
  );
}

function ScheduleReviewPopupInner({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Your Review</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Complimentary CRE Data &amp; Digital Review Session
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form fields, validation, success/error states, honeypot, and submission
            are all handled by FormEmbed against the schedule-review form
            definition in the OW Form Builder. */}
        <div className="p-2 sm:p-4 -mx-2 sm:-mx-4 [&_.ow-section]:py-0 [&_.ow-section]:bg-transparent [&_.ow-container]:px-4">
          <FormEmbed formSlug="schedule-review" alignment="left" theme="light" />
        </div>
      </div>
    </div>
  );
}
```

> **Why the wrapper styling overrides:** `FormEmbed` renders an `ow-section` band by default. Inside the modal we kill the section padding so the form sits flush with the header. No new CSS file needed — Tailwind arbitrary variants do it inline.

---

## Snippet 2 — PPP Starter Kit (lead magnet)

**TARGET FILE:** `payload/src/components/LeadMagnetForm.tsx`
**ACTION:** Replace the entire file contents below. Removes the hardcoded form + `/api/lead-magnet` POST. Visually identical because the dark-theme `FormEmbed` styling matches the section background.

```tsx
"use client";

import { FormEmbed } from "./FormEmbed";

export function LeadMagnetForm() {
  // Renders a dark-theme, left-aligned FormEmbed sized to fit inside the
  // existing lead-magnet section (which already provides the dark background,
  // heading, bullet points, and book image). FormEmbed only renders the form
  // card here — heading/description are intentionally suppressed since the
  // section above already shows them.
  return (
    <div className="[&_.ow-section]:py-0 [&_.ow-section]:bg-transparent [&_.ow-container]:px-0 [&_.max-w-2xl]:max-w-none [&_.max-w-2xl]:mx-0">
      <FormEmbed formSlug="ppp-starter-kit" alignment="left" theme="dark" />
    </div>
  );
}
```

> **No call-site changes needed.** `LeadMagnetForm` is consumed in two places — the static home page (`payload/app/(frontend)/(main)/page.tsx`) and the `LeadMagnetRenderer` block in `payload/src/components/BlockRenderer.tsx`. Both keep working with the new implementation because the export signature is unchanged.

---

## Snippet 3 — Contact page (Send a Message)

The `/contact` page is a Payload CMS page (rendered via `app/(frontend)/(main)/[...slug]/page.tsx`). The cleanest way to add the new form is to add a `formEmbed` block to its layout via the Payload Admin.

**TARGET LOCATION:** Payload Admin → **Pages** collection → `/contact` page → **Layout** field
**ACTION:** Add a new **Form Embed** block at the position where the existing "Send a Message" form sits. Configure as:

```json
{
  "blockType": "formEmbed",
  "formSlug": "inbound-contact",
  "eyebrow": "Send a Message",
  "heading": "Tell Us What You're Working On.",
  "description": "We respond within one business day. Required fields: first name, last name, and email. Everything else is helpful context, not a gate.",
  "theme": "light",
  "alignment": "left"
}
```

> If the contact page currently has a hardcoded HTML form embedded in a Content block, **delete that block** when you add the FormEmbed above it. The existing CMS-rendered form is not wired to the CRM and would create duplicate copies.

**Optional — code-level alternative:** If the team prefers a dedicated code page over the CMS catch-all for `/contact`, drop in this file. It will take precedence over the CMS slug:

**TARGET FILE (optional):** `payload/app/(frontend)/(main)/contact/page.tsx`

```tsx
import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { FormEmbed } from "@/components/FormEmbed";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact OpticWise | One Real Person. One Business Day.",
  description:
    "Get in touch with OpticWise. Real person responds within one business day. Discuss owner-controlled CRE data & digital infrastructure.",
};

export const revalidate = 300;

export default function ContactPage() {
  return (
    <>
      <SubpageHero
        title="One Real Person. One Business Day."
        lead="OpticWise works with CRE owners, asset managers, and operators. Reach out by form, by email, or by phone — a real member of the OpticWise team responds within one business day."
        badge="Get in Touch"
      />

      <FormEmbed
        formSlug="inbound-contact"
        eyebrow="Send a Message"
        heading="Tell Us What You're Working On."
        description="Goes directly to the OpticWise CRM. Real person responds within one business day. Required: first name, last name, email. Everything else is helpful context."
        theme="light"
        alignment="left"
      />

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
```

---

## Snippet 4 — PPP Audit Request

The `/ppp-audit` page (CMS page id `3`) currently has a CTA button linking to `href="#"` — the CTA goes nowhere. Add a FormEmbed block to the page so the CTA actually captures leads.

**TARGET LOCATION:** Payload Admin → **Pages** collection → `/ppp-audit` page → **Layout** field
**ACTION:** Add a new **Form Embed** block, ideally between the "What You Get" / "Three Deliverables" section and the closing quote. Configure as:

```json
{
  "blockType": "formEmbed",
  "formSlug": "ppp-audit-request",
  "eyebrow": "Schedule Your Audit",
  "heading": "Request Your PPP Audit\u2122",
  "description": "One building. One working session. Map who owns what, where data lives, and where operational burden stacks up against your KPIs.",
  "theme": "light",
  "alignment": "center"
}
```

Then update the existing "Schedule Your PPP Audit →" CTA button to anchor-link to the form. If the button is rendered from a `cta` block, set its `buttonHref` to `#schedule-your-audit` (Tailwind anchors auto-derive from headings — or add an `id` via a Content block placed just above the FormEmbed).

---

## Snippet 5 — Insights Newsletter (footer)

Add a lightweight email-only signup to the site footer so every page captures newsletter intent.

**TARGET FILE:** `payload/src/components/SiteFooter.tsx`
**ACTION:** Add the newsletter row above the existing 4-column grid. Insert the marked block, no other changes needed.

```tsx
import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { FormEmbed } from "./FormEmbed";

export function SiteFooter() {
  return (
    <footer className="bg-ow-navy text-white/60">
      <div className="ow-container py-16">

        {/* === BEGIN newsletter row (NEW) ============================== */}
        <div className="pb-12 mb-10 border-b border-white/10">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-center">
            <div>
              <h3 className="text-xl font-extrabold text-white mb-2">
                Stay updated with OpticWise insights
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                The latest on owner-controlled data &amp; digital infrastructure,
                AI readiness, and NOI strategy. Delivered weekly. No spam.
              </p>
            </div>
            <div className="[&_.ow-section]:py-0 [&_.ow-section]:bg-transparent [&_.ow-container]:px-0 [&_.max-w-2xl]:max-w-none [&_.max-w-2xl]:mx-0 [&_.rounded-xl]:p-4 [&_.rounded-xl]:lg:p-5">
              <FormEmbed formSlug="insights-newsletter" alignment="left" theme="dark" />
            </div>
          </div>
        </div>
        {/* === END newsletter row ====================================== */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* ... existing 4-column footer (logo, Explore, Products, Resources) — UNCHANGED ... */}
        </div>
        {/* ... existing copyright row — UNCHANGED ... */}
      </div>
    </footer>
  );
}
```

> Optionally also add the same newsletter FormEmbed block to the bottom of `/insights` index page (via Payload Admin) using `theme: "light"`, `alignment: "center"`.

---

## Cleanup checklist (after wiring snippets above)

- [ ] **Delete legacy API routes** in `/payload`: `app/api/schedule-review/route.ts` and `app/api/lead-magnet/route.ts` (if they exist) — submissions now go directly to `ownet.opticwise.com`.
- [ ] **Delete the hardcoded `/contact` form block** in the Payload CMS once the FormEmbed block is live.
- [ ] **Update the `/ppp-audit` page CTA** so it scrolls to the new FormEmbed block (or remove the dead `href="#"` button entirely).
- [ ] **Verify CORS** — the FormEmbed component uses `NEXT_PUBLIC_OPTICWISE_PLATFORM_URL` (defaults to `https://ownet.opticwise.com`). Confirm that env var is set in Vercel for the production deployment.
- [ ] **Verify env**: `NEXT_PUBLIC_OW_API_URL` (used by older `ScheduleReviewPopup`) is no longer required after Snippet 1; safe to remove.

---

## How submissions flow (for reference)

```
Visitor on opticwise.com
  → submits FormEmbed
  → POST https://ownet.opticwise.com/api/public/forms/{slug}/submit
  → OW backend processes:
      • honeypot check (rejects bots)
      • upserts Organization (by name)
      • upserts Person (by email)
      • creates Deal in pipeline=Landing Pages Leads, stage=<per form>, owner=Bill
      • adds Person as primary stakeholder on the Deal
      • emails Bill with the new submission
  → marketing site shows success message from form's `successMessage`
```

All forms can be edited at https://ownet.opticwise.com/forms without redeploying the marketing site — the marketing site fetches the live definition each time.
