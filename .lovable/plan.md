# Final Proposal Generator Audit — Client Data Integrity + Closing Quality

Scope: proposal document layer only. Consultant Engine, SOP Package, feature recommendation logic, database, and Order Brief structure are not touched.

## Findings (verified in code)

1. Internal email leaks. `src/lib/ai-conversation.server.ts` generates `ai-<session>@leads.kerjaku.space` when a lead gives no email. `loadProposalDoc` passes that value straight through, and the PDF client card prints it as the customer email.
2. Empty labels. `clientCard` in `src/lib/proposal-pdf.ts` falls back to `"-"` for client, contact, and contact value, and prints the label `"WhatsApp / Email"` even when only one exists.
3. Long business names get cut. The client card is a fixed 96pt box with `.slice(0, 3)` line clamp; the summary title clamps to 2 lines, so `Furniture & Interior Custom Workshop (Fadly Furniture Interior)` truncates.
4. Total Investment mixes scopes. `pricingTable` computes `coreTotal + optionalTotal` as TOTAL INVESTMENT, even though invoice generation (`src/lib/billing.server.ts`) correctly bills core scope only. The proposal therefore overstates the amount the customer is committing to.
5. Next Steps uses internal wording ("bersama Team KERJAKU") in `proposal-from-brief.ts`.
6. Overlapping recommendations can both appear (e.g. Riwayat Project and Database Customer) with similar benefit text.
7. Budget Alignment is prose only; there is no explicit phased implementation block when the price exceeds the stated budget range.

## Changes

### 1. Customer contact validation
Add a shared helper `customerEmail()` / `customerContact()` in `src/lib/proposal-doc.ts` that rejects an email when it: uses a `kerjaku.space` (or `leads.kerjaku.space`) domain, starts with a generated prefix (`ai-`, `ai-sess`, `lead-`, `guest-`), is a placeholder (`-`, `n/a`, `none`, `noreply@…`), or fails a basic address check. Rejected values become `null`.
Apply in `src/lib/proposal.functions.ts` when building `ProposalDocData` so the PDF, preview, and WhatsApp payload all see the same clean value.

### 2. Client card clean format
Rewrite `clientCard` in `src/lib/proposal-pdf.ts`:
- Build the field list dynamically: Nama Bisnis, Nama Client, WhatsApp, Email — each rendered only when a real value exists.
- Separate WhatsApp and Email into their own labelled fields (no combined `WhatsApp / Email` label, no `|` join, no `-`).
- Card height computed from wrapped line count instead of a fixed 96pt, with full multi-line wrap (no 3-line clamp), so long business names wrap instead of truncating.
- Same wrap treatment for the proposal title in `summaryBox`.

### 3. Core Solution sells the outcome
In `coreFeaturesFromBrief` (`src/lib/admin/proposal-from-brief.ts`), keep the Order Brief feature names verbatim but compose the description as a business-outcome sentence from the existing Industry Context Library (`describeFeatureForIndustry`), preferring the industry-flow wording over the generic library `fn` fallback. The `MENJAWAB MASALAH` line stays as-is. No new features, no changed names.

### 4. De-duplicate similar recommendations
In `enhancementsFromBrief`, add a benefit-overlap guard on top of the existing name check: when two items resolve to the same consultant-library id or their benefit text overlaps above a threshold, keep the higher-priority one. Also sharpen the description focus for the known overlap pair (project history = pekerjaan/project, customer database = pelanggan/follow-up/repeat order) using existing library copy.

### 5. Budget alignment with phased recommendation
When `budgetCeiling` is below the base price, `budgetAlignmentFromBrief` additionally emits a `REKOMENDASI IMPLEMENTASI BERTAHAP` block: Tahap Awal (core features answering the main problems) and Tahap Pengembangan (phase-2 recommendations), derived from data already in the insight.

### 6. Optional never becomes a bill
In `pricingTable`:
- TOTAL INVESTMENT = core subtotal only, labelled `Total Investment (Scope Utama)`.
- Optional block re-titled `Pengembangan Opsional`, each row showing name, estimated price, priority, and phase, with its own subtotal marked `belum termasuk total`.
- Add a one-line note: optional items enter the invoice only after customer approval and admin confirmation.
Invoice generation already excludes optional items; no change there.

### 7. Customer-oriented Next Steps
Replace the Next Steps bullets with: Review proposal dan prioritas fitur / Finalisasi scope pengerjaan / Persetujuan penawaran / Kick-off project. Internal phrasing removed.

## QA
Render a Furniture & Interior Custom Workshop sample proposal to PDF, convert pages to images, and inspect: no internal email, no `-` in contacts, no truncated business name, core scope total matches invoice scope, optional shown separately, no duplicate recommendations, no mid-page section breaks. Run the existing consultant regression tests to confirm the engine is unchanged.

## Files touched
`src/lib/proposal-doc.ts`, `src/lib/proposal.functions.ts`, `src/lib/proposal-pdf.ts`, `src/lib/admin/proposal-from-brief.ts`.
