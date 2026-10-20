# WardWeave — Hospital Patient-Flow & Administrative Coordination

> Product 02 of 10 · Web app + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From departmental dashboards to a shared system that resolves administrative blockers across the patient journey.**

Working name: WardWeave. Hospital administrative dependencies resolved.

**Three references (research only — never copy, never name in product copy):** [Oracle Health](https://www.oracle.com/health/clinical-suite/ai-agents/) · [Qventus](https://www.qventus.com/) · [LeanTaaS](https://leantaas.com/)

## 2026 signal: observed, not predicted

Microsoft and Oracle describe embedded healthcare agents and administrative workflow coordination; feature availability differs by product and region. [Oracle Health AI Agents](https://www.oracle.com/health/clinical-suite/ai-agents/).

## The 2027–2032 opportunity: hypothesis

If documentation becomes less burdensome, delays between departments remain. A system that coordinates verified actions across admission, discharge paperwork, insurer queries, and appointments could become valuable.

## Current workflow

A coordinator chases billing, pharmacy, reports, transport, and follow-up teams through calls and separate portals.

## Proposed workflow

The system builds a dependency graph, detects missing administrative prerequisites, requests completion from the right team, and tracks verified outcomes. Clinical decisions remain with clinicians.

## Buyer and route into the market

Hospital group COO, discharge operations lead, or hospital-software integration partner.

## Build now: a substantial proof product

- Patient episode timeline plus department queues, owners, dependencies, escalation rules, and a review console.
- Document-completeness extraction with source references and hospital-specific administrative checklists.
- A discrete-event simulation of department queues to test staffing or schedule changes before implementation.
- One approved hospital interface; a synthetic FHIR adapter for demonstration, and robust manual fallback.

## The UI/UX advantage

A coordinator sees “what is delaying this case” and can inspect each source record. Patients receive a simple next-step view rather than internal hospital complexity.

## The client demonstration

Replay a day of synthetic episodes; compare ordinary checklists against active dependency coordination. Introduce a missing document, delayed bill, and interface outage.

## Prove you are better than the current alternative

Measure administrative completion time after clinical clearance, touches/case, rework, and errors. Validate simulation predictions against real operations before selling the simulation as a planning tool.

## Revenue and margin logic

Department pilot → site license + integration support. Quantify staff effort and actual delay-related impact without assuming each saved minute creates revenue.

## Why an incumbent does not automatically win

Interoperability and a hospital-specific operating model are the advantage. A better-looking hospital management system does not establish this advantage.

## What would invalidate this bet?

Do not expand if departments refuse shared ownership or the system cannot access authoritative status. Avoid claims of autonomous clinical discharge.

## Market maturity scenario—not your development schedule

2027–2028: administrative dependency resolution. 2029–2032: broader coordination and validated capacity simulation.

## What can stay useful toward 2037

Patient-episode data contracts, clinical/administrative separation, permissions, audit evidence, and integration mappings.

**Confidence in direction: High for administrative agents; medium for cross-department orchestration and simulation adoption. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### 02 — WardWeave
Hospital administrative dependency coordinator. References: Oracle Health (https://www.oracle.com/health/clinical-suite/ai-agents/), Qventus (https://www.qventus.com/), LeanTaaS (https://leantaas.com/). Study administrative coordination, case ownership, and capacity planning respectively; these are overlapping and adjacent references, not identical substitutes. Build episode/checklist/department ownership, document completeness, approved discharge-packet preparation, and audit/recovery. Clinicians determine medical readiness. Prove a missing dependency is detected and resolved. Defer hospital-wide rollout and autonomous clinical decisions.

> This product has a short seed brief. Prompt A's first job is to expand it to the
> same depth as the LumaPath / LedgerWeave / VoxRelay briefs (screens, entities,
> workflow, worker contracts, proof moment, mandatory tests, exclusions).
