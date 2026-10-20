# ProofGate — Agent Assurance & Delegated-Action Evidence

> Product 10 of 10 · Web app + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From checking chatbot answers to proving that delegated actions stay within authority.**

Working name: ProofGate. Evidence that delegated actions stay within authority.

**Three references (research only — never copy, never name in product copy):** [Patronus AI](https://www.patronus.ai/) · [Giskard](https://www.giskard.ai/) · [Lakera](https://www.lakera.ai/)

## 2026 signal: observed, not predicted

Payment networks emphasize agent permission and traceability; AI research roles demand empirical evaluation, and NIST provides risk-management guidance. [Mastercard Agent Pay controls](https://www.mastercard.com/us/en/business/artificial-intelligence/mastercard-agent-pay.html).

## The 2027–2032 opportunity: hypothesis

When agents can spend money, change records, or contact other systems, buyers may require reproducible evidence of authorization, failure containment, and correct outcomes—not only a model accuracy score.

## Current workflow

A team runs a few prompts and relies on a general safety filter, without testing the entire action chain.

## Proposed workflow

A defined threat model produces repeatable end-to-end tests; every action is linked to authority, input evidence, policy checks, and a verified result. Release decisions include limitations and unresolved risks.

## Buyer and route into the market

AI product teams, fintech/healthcare software vendors, and enterprises approving agent releases.

## Build now: a substantial proof product

- Evaluation runner for indirect prompt injection, privilege boundaries, cross-tenant access, revoked permissions, and fabricated records.
- Versioned test sets, held-out cases, repeated trials, human labeling, trace replay, and release regression reports.
- Measurements for unauthorized-action rate, legitimate task success, false refusal, review effort, cost, and latency.
- An experimental comparison of defenses such as server-side permission checks, approval gates, and model-based checks; no tested model as the sole judge.

## The UI/UX advantage

A release owner sees concrete failure cases and coverage gaps. A customer sees what was authorized and actually executed. Do not expose an opaque “100% safe” badge.

## The client demonstration

Attack your own commerce, banking sandbox, or voice workflow through malicious retrieved content. Compare a baseline and several defenses on held-out cases, then publish reproducible findings.

## Prove you are better than the current alternative

Predefine success metrics, report uncertainty and false positives, include ablations, and distinguish test coverage from a guarantee. A dashboard alone does not establish research ability.

## Revenue and margin logic

Bounded evaluation engagements + release monitoring. Sell evidence quality and useful remediation, not universal certification or guaranteed safety.

## Why an incumbent does not automatically win

Domain-specific action tests, reproducible methods, and evidence customers can audit. Durable research value requires original or carefully replicated empirical work.

## What would invalidate this bet?

Do not market “alignment solved.” Stop claims that exceed evaluation coverage. Seek independent technical feedback before selling high-stakes assurance.

## Market maturity scenario—not your development schedule

2027–2028: action-level evaluation and authorization evidence. 2029–2032: richer assurance for delegated workflows and collaborating agents.

## What can stay useful toward 2037

Threat models, labeled failures, reproducible test infrastructure, authority records, and a disciplined experimental process.

**Confidence in direction: High for growing evaluation needs; uncertain for future regulation, standards, and buyer procurement requirements. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### 10 — ProofGate
Delegated-action evaluation and release evidence. References: Patronus (https://www.patronus.ai/), Giskard (https://www.giskard.ai/), Lakera (https://www.lakera.ai/). Build an authorized sandbox evaluation runner, threat model, held-out scenarios, trace replay, human labeling, and regression report. Test document injection, revoked permissions, fabricated records, and cross-tenant access against your own applications. Compare defenses and report both task success and attack success with uncertainty. Research extension: reproduce a published method and write a controlled experiment report. No “AGI,” “alignment solved,” or blanket certification claims.

> This product has a short seed brief. Prompt A's first job is to expand it to the
> same depth as the LumaPath / LedgerWeave / VoxRelay briefs (screens, entities,
> workflow, worker contracts, proof moment, mandatory tests, exclusions).
