# SourceWeave — Procurement & Supplier Coordination Agents

> Product 07 of 10 · Web app + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From contract storage and purchase forms to coordinated sourcing with bounded commercial authority.**

Working name: SourceWeave. Evidence-backed procurement and obligations.

**Three references (research only — never copy, never name in product copy):** [SAP](https://news.sap.com/2026/05/enabling-autonomous-spend-management-ai-connected-processes/) · [Coupa](https://docs.coupa.com/en/supplier-documentation/coupa-for-suppliers/the-coupa-supplier-portal-or-csp/features-and-processes-in-the-csp/invoices/create-or-edit-an-invoice-in-the-csp/ai-invoice-upload-for-suppliers) · [Zip](https://zip.com/)

## 2026 signal: observed, not predicted

SAP is investing in agents embedded in procurement and connected spend workflows. [SAP autonomous spend management, May 2026](https://news.sap.com/2026/05/enabling-autonomous-spend-management-ai-connected-processes/).

## The 2027–2032 opportunity: hypothesis

When buying agents can communicate with supplier systems, accurate specifications, negotiation limits, and contract obligations become important. Begin with internal quote coordination before assuming suppliers will expose agents.

## Current workflow

Staff email vendors, chase missing details, compare incompatible quotations, route approvals, and separately track contract obligations.

## Proposed workflow

A structured requirement produces approved requests, normalized quotes, comparable total costs, missing-information follow-ups, and an approval-ready purchase recommendation.

## Buyer and route into the market

A multi-site service company, manufacturer’s procurement team, or distributor handling repeated quote requests.

## Build now: a substantial proof product

- Requirement-to-quote workspace, vendor identities, source-grounded extraction, and comparable price/lead-time/terms tables.
- Human-set negotiation boundaries; drafts and simulated supplier agents before any authorized external communication.
- Contract versioning, obligation/renewal tracking, approval matrices, and purchase-order/invoice linkage.
- One procurement integration with document provenance and change detection.

## The UI/UX advantage

Show comparable offers, assumptions, missing terms, negotiated changes, and the exact authority the buyer has granted. Preserve the source quotation next to every extracted claim.

## The client demonstration

Run five simulated suppliers with conflicting units, revised lead times, hidden exclusions, and a price above the approval limit. Demonstrate accurate normalization and an approval stop.

## Prove you are better than the current alternative

Measure time to comparable quotes, unsupported term extraction, approved sourcing cycle time, and realized total cost after quality/delivery effects. Savings require like-for-like specifications.

## Revenue and margin logic

Workflow setup + team or transaction subscription. Price around avoided coordination and reliable procurement execution rather than promised negotiation savings.

## Why an incumbent does not automatically win

Supplier mappings, category-specific constraints, customer playbooks, and evidence-backed comparisons. Contract summarization alone is easy to commoditize.

## What would invalidate this bet?

Do not claim an agent network exists until suppliers participate. Stop execution if quote terms cannot be reliably normalized or authority is ambiguous.

## Market maturity scenario—not your development schedule

2027–2028: internal sourcing and obligations assistance. 2029–2032: bounded buyer–supplier agent coordination where interfaces and trust mature.

## What can stay useful toward 2037

Commercial authority model, specification schema, supplier identity, contract history, and auditable sourcing decisions.

**Confidence in direction: High for procurement assistance; medium-low for broad autonomous cross-company negotiation. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### 07 — SourceWeave
Quote normalization, procurement approvals, and contract-obligation coordination. References: SAP spend workflows (https://news.sap.com/2026/05/enabling-autonomous-spend-management-ai-connected-processes/), Coupa supplier invoice workflow (https://docs.coupa.com/en/supplier-documentation/coupa-for-suppliers/the-coupa-supplier-portal-or-csp/features-and-processes-in-the-csp/invoices/create-or-edit-an-invoice-in-the-csp/ai-invoice-upload-for-suppliers), Zip (https://zip.com/). Build requirements, quote versions, comparable totals/units, missing-term requests, approval matrix, and obligations calendar. Prove conflicting quote units, changed terms, and approval limits. External emails or commercial commitments require authorization. No assumption that supplier-agent interoperability already exists.

> This product has a short seed brief. Prompt A's first job is to expand it to the
> same depth as the LumaPath / LedgerWeave / VoxRelay briefs (screens, entities,
> workflow, worker contracts, proof moment, mandatory tests, exclusions).
