# IntentCart — Intent-Based Commerce + Merchant Agent Gateway

> Product 05 of 10 · Mobile app (Expo) + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From browsing catalog pages to completing a purchase mission with merchant economics visible.**

Working name: IntentCart. Mobile purchase missions and merchant execution.

**Three references (research only — never copy, never name in product copy):** [Amazon](https://www.aboutamazon.com/news/retail/amazon-agentic-ai-gen-ai-shopping) · [Google UCP](https://developers.google.com/merchant/ucp) · [Shopify](https://www.shopify.com/)

## 2026 signal: observed, not predicted

Google introduced Universal Commerce Protocol; Amazon is deploying agentic shopping. A generic shopping chatbot is therefore not an early, uncontested opportunity. [Google UCP announcement, January 2026](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/).

## The 2027–2032 opportunity: hypothesis

Merchants may increasingly need to serve both human shoppers and outside buying agents. The opportunity is accurate offers, inventory, fit/context, delivery promises, and post-purchase execution—not only a new storefront.

## Current workflow

A shopper filters products, compares combinations, checks delivery and returns, and contacts support after purchasing.

## Proposed workflow

A shopper says “an outfit for this event, within this budget, arriving by Friday.” The app assembles a verifiable basket from live data, explains tradeoffs, obtains approval, then tracks fulfillment and returns.

## Buyer and route into the market

An established fashion or specialist retail operator, a multi-brand group, or a commerce software agency.

## Build now: a substantial proof product

- Mobile catalog, wishlists, checkout, tracking, exchanges, and merchant operations with real state transitions.
- A product/offer API readable by approved agents; one standards adapter where practical, with version negotiation rather than hard-coded assumptions.
- Inventory reservations, total-cost comparison, delivery constraints, return-policy validation, and user-approved substitutions.
- Merchant margin view plus return-risk or demand model evaluated against simple baselines; integrate one existing store.

## The UI/UX advantage

Show a small set of complete options, why they fit, total delivered price, arrival confidence, and exchange terms. Let users inspect and edit every item.

## The client demonstration

Use one retail niche and three simulated suppliers. Demonstrate a budget request, stock change before checkout, late delivery constraint, and partial exchange.

## Prove you are better than the current alternative

Compare task completion and time against the existing storefront. Measure stock/price errors, returns, support cost/order, contribution margin, and acquisition/retention separately. Conversion uplift needs live controlled traffic.

## Revenue and margin logic

Merchant setup + software subscription or clearly justified usage fee. A marketplace model must also fund customer acquisition, logistics, fraud, returns, and payouts; low coding cost is not the full margin.

## Why an incumbent does not automatically win

Niche merchandising, reliable availability, fit/return feedback, merchant relationships, and post-purchase execution. Strong UX earns attention; verified delivery and repeat purchase create a business.

## What would invalidate this bet?

Do not scale a new marketplace until merchants participate and buyers return. If incumbents cover your chosen niche equally well, narrow the workflow or sell integration services.

## Market maturity scenario—not your development schedule

2027–2028: merchants becoming agent-accessible. 2029–2032: richer purchase missions and interoperable post-purchase workflows, subject to ecosystem adoption.

## What can stay useful toward 2037

Product/order/return data contracts, inventory integrity, customer preference controls, merchant integrations, and lifecycle outcome data.

**Confidence in direction: High for agentic commerce investment; medium for which interfaces/protocols and business models win. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### 05 — IntentCart
Mobile shopping and merchant-agent gateway for one retail niche. References: Amazon agentic shopping (https://www.aboutamazon.com/news/retail/amazon-agentic-ai-gen-ai-shopping), Google UCP (https://developers.google.com/merchant/ucp), Shopify (https://www.shopify.com/). Study shopper intent, interoperability, and merchant operations; Google is an ecosystem/protocol reference. Build catalog/inventory/cart/payment sandbox/fulfillment/returns, an intent-to-basket planner, and a merchant margin view. Use Medusa's permitted core modules only after reviewing the exact license boundaries. Prove stock changes, delivery limits, and partial return reconciliation. Original brand, design, and product assets.

> This product has a short seed brief. Prompt A's first job is to expand it to the
> same depth as the LumaPath / LedgerWeave / VoxRelay briefs (screens, entities,
> workflow, worker contracts, proof moment, mandatory tests, exclusions).
