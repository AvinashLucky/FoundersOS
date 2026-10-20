# LumaPath — Diagnostic Network Orchestrator

> Product 01 of 10 · Web app + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From tracking reports to coordinating the entire diagnostic journey across labs, collection teams, and patients.**

Working name: LumaPath. Diagnostic work completed with evidence.

**Three references (research only — never copy, never name in product copy):** [CrelioHealth](https://creliohealth.com/) · [LabWare](https://www.labware.com/industries/healthcare) · [LabVantage](https://www.labvantage.com/informatics/)

## 2026 signal: observed, not predicted

Healthcare vendors are embedding AI into existing work and connecting clinical and operational information. [Microsoft healthcare agents, August 2026](https://www.microsoft.com/en-us/microsoft-cloud/blog/healthcare/2026/08/11/building-the-foundation-for-agentic-ai-in-healthcare/).

## The 2027–2032 opportunity: hypothesis

As basic report drafting becomes easier, the remaining problem may be getting a test completed correctly and on time across disconnected organizations. Build the coordinator of that journey.

## Current workflow

Staff check sample statuses, call branches, reconcile identities, chase unsigned reports, and manually update patients.

## Proposed workflow

An event-driven case follows the order through collection, processing, authorized review, delivery, and requested follow-up. The system handles routine coordination and exposes unresolved exceptions.

## Buyer and route into the market

A regional diagnostic chain, hospital lab network, or LIS vendor with multiple branches.

## Build now: a substantial proof product

- One order/case engine spanning three simulated branches, home collection, sample tracking, and report approval.
- Predict likely turnaround-time breaches; propose approved routing or escalation, with capacity and transport constraints.
- Secure report delivery, patient identity checks, consent records, and an exception inbox with a named owner.
- One real LIS adapter plus versioned APIs, webhook replay, audit history, and failed-job recovery.

## The UI/UX advantage

One patient-journey timeline shows the next dependency, responsible team, expected completion, and evidence. Staff act on exceptions rather than opening six status screens.

## The client demonstration

Inject a missing sample, a duplicate patient record, and a delayed review. Show which work is completed automatically, which action is withheld, and how the case recovers without losing history.

## Prove you are better than the current alternative

Compare manual touches/order, turnaround-time prediction error, overdue orders, false identity matches, and total operating cost/completed order. Compare against the same LIS plus ordinary rules/reminders.

## Revenue and margin logic

Sell network onboarding plus per-branch or completed-order fees. The economic claim is reduced coordination and rework, not cheaper laboratory testing.

## Why an incumbent does not automatically win

Win through local lab integrations, accurate identity handling, regional-language communication, and reliable recovery. Reporting UI alone is easily copied.

## What would invalidate this bet?

Pause predictive routing if the customer cannot supply reliable capacity/status data or will not allow operational integration.

## Market maturity scenario—not your development schedule

2027–2028: branch exception coordination. 2029–2032: cross-network capacity and referral coordination, if partners participate.

## What can stay useful toward 2037

Canonical order/sample/report events, integration adapters, clinical approval boundaries, and a labeled exception dataset.

**Confidence in direction: High for workflow integration; medium for cross-network coordination. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### Product brief 01 — LumaPath: diagnostic operations

Append this brief to Prompt A. Code name only.

**References — study all three:**
- CrelioHealth: https://creliohealth.com/ — diagnostic lab operations and patient journey.
- LabWare: https://www.labware.com/industries/healthcare — sample lifecycle and diagnostic workflows.
- LabVantage: https://www.labvantage.com/informatics/ — configurable lab operations and information flow; broader adjacent reference.

**Buyer:** diagnostic chain operations manager; first scope is one lab's operational exceptions.

**Product promise:** Every diagnostic order has a clear state, next action, accountable owner, and verified completion evidence.

**10-day release scope:** order import; sample/report status; turnaround deadlines; pending/exception queue; report approval; consent-aware delivery preparation; patient status page; supervisor evidence view. Two tenant organizations and three seeded branches prove boundaries. One read-only LIS/CSV adapter plus a controlled notification sandbox. Use synthetic patient records.

**Core workflow:** CSV/order intake -> validate identity and order -> track states -> detect overdue dependency -> prepare action -> staff approval when required -> queue action -> verify adapter result -> append audit event -> update UI.

**Screens:** operational overview; work queue; case timeline; source/report viewer; approval inbox; integration health; patient status page. Do not rebuild every LIS module.

**Entities:** Organization, Branch, UserRole, PatientReference, Order, SampleEvent, ReportVersion, Consent, Case, Approval, DeliveryAttempt, AuditEvent, IntegrationRun.

**API capabilities:** create/import orders; list tenant-scoped cases; append validated status event; upload report version; approve report; request delivery; inspect/reconcile delivery; fetch patient-safe status. Define endpoint paths and request/response contracts before building.

**Worker contracts:** Reader extracts fields with source evidence; Coordinator chooses among allowed exception actions; Policy service checks scope/consent/approval; Executor invokes the adapter with idempotency; Verifier checks the resulting state. Report medical authorization belongs to qualified staff. No generated diagnostic results.

**Proof moment:** introduce a delayed report, duplicate delivery event, and unsigned report; demonstrate overdue ownership, a single delivery attempt, and blocked release of unsigned results.

**Mandatory tests:** tenant leakage; ambiguous patient identifier; invalid state transition; unsigned report delivery; duplicate delivery; worker restart; adapter timeout and reconciliation. Seed 100 normal/exception scenarios and reserve at least 20 unseen cases. Show denominators and error categories.

**Defer:** clinical diagnosis, autonomous medical decisions, production WhatsApp outreach, instrument interfacing, claims adjudication, and broad multi-lab routing optimization.

**Distinct commercial artifact:** diagnostic operations accelerator + deployment service, with backend and simulator included. Case-study metrics: touches/order, overdue backlog, erroneous matches, review minutes, and cost per completed operational case.
