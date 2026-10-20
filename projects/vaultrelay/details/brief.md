# VaultRelay — Personal Finance App with a Permissioned Money Agent

> Product 04 of 10 · Mobile app (Expo) + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From navigating banking menus to completing a financial objective under explicit limits.**

Working name: VaultRelay. Mobile financial intent with explicit authority.

**Three references (research only — never copy, never name in product copy):** [Revolut](https://www.revolut.com/) · [Cleo](https://web.meetcleo.com/) · [Kasisto](https://kasisto.com/)

## 2026 signal: observed, not predicted

Visa and Mastercard are developing infrastructure for agent-initiated transactions, including permission, authentication, and payment controls. [Visa Intelligent Commerce](https://corporate.visa.com/en/products/intelligent-commerce.html).

## The 2027–2032 opportunity: hypothesis

More agents may request permission to spend or act financially. A user-facing control layer that makes intent, limits, receipts, reversals, and disputes understandable could matter as much as the chat interface.

## Current workflow

The customer checks balances, opens bill pages, chooses a payment, sets reminders, and contacts support separately.

## Proposed workflow

The customer states an objective such as “prepare these bills while preserving my minimum balance.” The app assembles a plan, validates it with deterministic rules, requests confirmation, and tracks permitted execution.

## Buyer and route into the market

A licensed fintech’s product team, bank technology partner, or financial-software vendor; start with an authorized service workflow.

## Build now: a substantial proof product

- Original mobile UI with accounts, statements, transfers, bills, service requests, and a clearly labeled sandbox ledger.
- Intent and permission records: allowed payees, maximum amount, validity period, revocation, and step-up confirmation.
- Double-entry accounting, idempotent execution, webhook reconciliation, pending/reversed states, and receipt history.
- Staff console for disputes and exceptions; AI retrieves and explains records while code calculates balances and enforces limits.

## The UI/UX advantage

A plan preview shows total cost, resulting balances, actions that will occur, and how permission can be revoked. Offer normal controls alongside conversation.

## The client demonstration

Ask the agent to prepare three bills; inject a changed amount, duplicate callback, revoked permission, and misleading transaction description. Show no unauthorized spending.

## Prove you are better than the current alternative

Measure successful task completion, user understanding of consent, unauthorized actions, duplicate execution, recovery time, and support effort. Use synthetic funds publicly.

## Revenue and margin logic

Sell a partner integration or licensed software component. Avoid assuming a public demo can offer regulated banking or access live payment-network programs automatically.

## Why an incumbent does not automatically win

Verifiable intent, accessible UX, clear financial state, and exception handling across supported providers. “Bank app plus chatbot” is not a strong enough distinction.

## What would invalidate this bet?

Proceed with real money only through appropriate partners and approved interfaces. If users do not understand the consent model, redesign before expanding autonomy.

## Market maturity scenario—not your development schedule

2027–2028: supervised financial service actions. 2029–2032: more granular delegated financial permissions where institutions support them.

## What can stay useful toward 2037

Ledger correctness, identity, authorization, revocation, transaction evidence, and swappable provider adapters.

**Confidence in direction: High for payment-agent infrastructure; medium for consumer willingness to delegate broader financial actions. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### 04 — VaultRelay
Mobile finance interface with explicit delegated-action permissions. References: Revolut (https://www.revolut.com/), Cleo (https://web.meetcleo.com/), Kasisto (https://kasisto.com/). Study account UX, conversational money context, and financial-service action controls. Build a synthetic double-entry ledger, plan preview, permission amount/payee/expiry limits, revocation, idempotent transfers, receipts, and dispute simulation. Show changed amounts and revoked authority being blocked. No live bank or payment-network access is implied. Use the same mobile framework as products 05 and 06.

> This product has a short seed brief. Prompt A's first job is to expand it to the
> same depth as the LumaPath / LedgerWeave / VoxRelay briefs (screens, entities,
> workflow, worker contracts, proof moment, mandatory tests, exclusions).
