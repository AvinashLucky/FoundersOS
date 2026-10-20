# LedgerWeave — Continuous Finance Close & Cash Operations

> Product 03 of 10 · Web app + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From monthly document chasing to an always-current finance exception queue.**

Working name: LedgerWeave. Continuous reconciliation and close readiness.

**Three references (research only — never copy, never name in product copy):** [BlackLine](https://www.blackline.com/products/financial-close/) · [FloQast](https://www.floqast.com/lp/ai-powered-close-management) · [Numeric](https://www.numeric.io/)

## 2026 signal: observed, not predicted

SAP is connecting AI with procurement and finance processes, reflecting investment in operational rather than purely conversational AI. [SAP connected spend management, May 2026](https://news.sap.com/2026/05/enabling-autonomous-spend-management-ai-connected-processes/).

## The 2027–2032 opportunity: hypothesis

As extraction and categorization become common, the opportunity shifts to keeping books close-ready every day and resolving missing evidence before period end.

## Current workflow

Documents accumulate; staff collect them, reconcile statements, investigate discrepancies, and discover problems during close.

## Proposed workflow

New records continuously trigger extraction, deterministic matching, discrepancy detection, document requests, and accountant review. Approved changes sync to the accounting system.

## Buyer and route into the market

CA firms serving many businesses, outsourced finance providers, or multi-entity SME finance teams.

## Build now: a substantial proof product

- Versioned transaction ledger, source-document links, deterministic matching, duplicates/credit-note handling, and period locking.
- Client portal with authorized document requests and an exception queue prioritized by materiality and deadlines.
- Cash-flow forecasts compared with simple baselines, with explicit assumptions and uncertainty.
- One accounting export/API, tenant isolation, approvals for postings/payments, and reconciliation after external actions.

## The UI/UX advantage

A finance owner sees “what prevents this period from closing,” with amount, source evidence, proposed correction, and reviewer responsibility.

## The client demonstration

Replay 90 days of synthetic invoices and statements, including partial payments and missing documents. Show how exceptions are resolved before the close date.

## Prove you are better than the current alternative

Compare time to close, reviewer effort, false matches, unsupported postings, overdue evidence, and total cost/client against accounting software plus basic automation.

## Revenue and margin logic

Onboarding + active-entity/document-volume subscription. Expand to accountant-approved accounts-payable operations only after demonstrating reliable preparation.

## Why an incumbent does not automatically win

Deep fit with one accounting environment and a reusable exception-handling process. Extraction alone is unlikely to sustain differentiation.

## What would invalidate this bet?

Stop if review effort exceeds manual work or accountants cannot trace every financial assertion. Do not bundle unreviewed tax advice or autonomous filings.

## Market maturity scenario—not your development schedule

2027–2028: continuous reconciliation and evidence collection. 2029–2032: coordinated close, payables, and cash planning.

## What can stay useful toward 2037

Financial invariants, source provenance, chart-of-accounts mappings, review history, and versioned integration contracts.

**Confidence in direction: High for continuous finance assistance; medium for broad execution authority. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### Product brief 03 — LedgerWeave: finance exception resolution

Append this brief to Prompt A. Code name only.

**References — study all three:**
- BlackLine: https://www.blackline.com/products/financial-close/ — reconciliations, matching, and evidence.
- FloQast: https://www.floqast.com/lp/ai-powered-close-management — close ownership and review.
- Numeric: https://www.numeric.io/ — finance data and reconciliation workflow reference.

**Buyer:** a CA firm or outsourced finance provider handling recurring small-business clients.

**Product promise:** Documents become traceable reconciliations and a reviewer-ready exception queue rather than another spreadsheet to chase.

**10-day release scope:** two organizations; client workspaces; invoice and statement upload; PDF/CSV extraction; deterministic transaction matching; duplicate/partial-payment exceptions; accountant decisions; balanced export; document-request drafts; close checklist. One agreed accounting CSV format. No automatic tax filing or funds movement.

**Core workflow:** upload -> parse -> validate values and units -> propose matches -> apply explicit matching rules -> collect unresolved evidence -> accountant approves/rejects -> export -> verify totals and lock version.

**Screens:** client portfolio; close-readiness view; document viewer with source highlights; reconciliation workbench; request queue; accountant approval/history; export results.

**Entities:** Organization, ClientEntity, AccountingPeriod, SourceDocument, ExtractedField, Transaction, Invoice, MatchCandidate, ReconciliationDecision, DocumentRequest, Approval, ExportBatch, AuditEvent.

**Worker contracts:** Reader extracts with document location; Matcher uses deterministic tolerances; Investigator retrieves permitted source records and drafts explanations; Requester prepares follow-up without sending it by default; Reviewer authorizes export; Verifier checks totals, duplication, and provenance. Use integer minor units/decimal arithmetic for money, explicit currency, and explicit accounting conventions.

**Proof moment:** import mixed invoices/statements containing a duplicate, credit note, partial payment, and missing record; show correct exceptions and a reproducible approved export.

**Mandatory tests:** cross-client exposure; duplicated uploads; decimal precision; currency mismatch; false match; credit note; partial payment; attempted export without approval; repeat export; malformed source. Evaluate 200 seeded records, with a held-out split and field-level extraction metrics.

**Defer:** broad tax/regulatory advice, autonomous journal posting, payroll, every accounting integration, and unsupported cash-flow predictions.

**Distinct commercial artifact:** finance document/reconciliation accelerator and a CA onboarding service. Measure review effort, false matches, extraction error by field, missing-evidence aging, and total cost/client.
