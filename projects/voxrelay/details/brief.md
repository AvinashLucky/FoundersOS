# VoxRelay — Voice Resolution Platform with Back-Office Execution

> Product 08 of 10 · Web app with browser voice + API
> Source: `Product-Research-Engine/projects/Future_AI_Projects_Roadmap.html` (updated 26 Sep 2026) — extracted as written. Everything below is the founder's
> research plan: hypotheses to validate with buyers, not established facts.

**From an AI that talks to an AI service that completes the customer’s request.**

Working name: VoxRelay. Speech to verified business action.

**Three references (research only — never copy, never name in product copy):** [Sierra](https://sierra.ai/) · [PolyAI](https://poly.ai/use-cases) · [Decagon](https://decagon.ai/)

## 2026 signal: observed, not predicted

Amazon Connect supports agentic voice and digital self-service; its assistance tools can retrieve information and take actions in external applications. [AWS agentic assistance documentation](https://docs.aws.amazon.com/connect/latest/adminguide/agentic-assistance.html).

## The 2027–2032 opportunity: hypothesis

As voice quality improves, buyers may care more about verified resolution, repeat contact, and correct handoff than whether the voice sounds impressive. The product is a complete service workflow with voice as one interface.

## Current workflow

A bot answers FAQs or transfers the call. A person then books the appointment, checks a report, processes a return, or updates the system.

## Proposed workflow

A caller states the request; the agent verifies identity as needed, retrieves current data, completes a permitted action, confirms the result, and transfers exceptions with context and evidence.

## Buyer and route into the market

A diagnostic chain, appointment-heavy service business, ecommerce operator, or contact-center provider.

## Build now: a substantial proof product

- Inbound voice for one vertical with interruption handling, latency monitoring, multilingual test cases, and a human transfer path.
- Two bounded actions: for example reschedule an appointment and check report status, or track an order and prepare a return.
- Durable workflow state across voice, message, and staff inbox; tool timeouts, idempotency, and explicit action confirmation.
- Supervisor console with transcripts, executed actions, resolution evidence, redaction, QA sampling, and escalation reasons.

## The UI/UX advantage

Customers should not have to repeat the story after a handoff. Supervisors see the requested outcome, verified facts, attempted actions, and the next unresolved step.

## The client demonstration

Test interruptions, accents, background noise, an unavailable slot, a tool outage, an ambiguous identity, and a caller changing their mind. Show real sandbox updates—not only a scripted conversation.

## Prove you are better than the current alternative

Measure verified resolution, repeat contact within an agreed window, wrongful actions, escalation quality, customer satisfaction, latency, and total cost/resolved case. Include telephone, model, QA, rework, and human fallback costs.

## Revenue and margin logic

Integration/setup + platform/usage fee. If pricing per resolution, agree on how resolution is verified and how repeat contacts count. Sell back-office integration as the differentiated value.

## Why an incumbent does not automatically win

Vertical-specific action correctness, quality controls, regional-language performance, and seamless handoff. A generic voice wrapper is already a crowded proposition.

## What would invalidate this bet?

Do not expand if bot containment rises but repeat contacts or mistakes worsen. Confirm call recording, consent, and outreach requirements for each deployment; start with inbound use.

## Market maturity scenario—not your development schedule

2027–2028: bounded voice-to-action workflows. 2029–2032: consistent case completion across voice, messaging, and multiple business systems.

## What can stay useful toward 2037

Case state, identity and authorization, integration adapters, conversation/action evaluation datasets, and outcome evidence.

**Confidence in direction: High for voice-to-action demand direction; uncertain for attainable autonomy in each vertical. Product economics and demand remain to be validated with buyers.**

---

## Starting brief (append to Prompt A in `prompts.md`)

Source: `Product-Research-Engine/projects/AI_PRODUCT_STARTER_PROMPTS.md`.

### Product brief 08 — VoxRelay: speech to completed work

Append this brief to Prompt A. Code name only.

**References — study all three:**
- Sierra: https://sierra.ai/ — business-action customer experience reference.
- PolyAI: https://poly.ai/use-cases — voice booking, identity, and order scenarios.
- Decagon: https://decagon.ai/ — continuity across customer-service channels.

**Buyer:** an appointment-heavy business or contact-center operator. Its first vertical is lab/clinic scheduling, reusing a documented LumaPath adapter while remaining a separately deployable service product.

**Product promise:** A spoken request produces a verified business-system update or a context-rich human handoff.

**10-day release scope:** browser microphone voice session; text fallback; two operations—check authorized case status and reschedule an appointment; caller identity boundary; explicit confirmation; durable session/case state; interruption handling; supervisor inbox; action trace; per-session cost limit. Optional inbound phone number only if approved credentials/telephony are ready. Browser voice is a valid explicit v1 scope, not a fake phone integration.

**Core workflow:** voice input -> speech recognition -> intent + tenant-authorized context -> action plan -> server-side policy check -> confirmation -> scheduler/status adapter -> verify result -> spoken confirmation -> record receipt. Escalate when identity, authority, or outcome is uncertain.

**Screens:** customer voice widget; agent configuration with allowed actions; live/recent sessions; source and tool trace; handoff queue; quality/cost dashboard; integration status.

**Entities:** Organization, AgentConfiguration, VoiceSession, Turn, Case, IdentityCheck, Appointment, ActionIntent, ToolAttempt, Confirmation, Handoff, OutcomeVerification, CostEvent.

**Worker contracts:** Listener turns audio into attributed user input; Planner selects only permitted tools; Policy validates role, tenant, confirmation, and limits; Executor uses an idempotency key; Verifier reads authoritative state; Handoff summarizes verified facts and unresolved work. The model cannot grant itself authority.

**Proof moment:** a caller reschedules, interrupts to change the date, encounters an unavailable slot, and then faces an adapter timeout. Show correct final booking or an honest unresolved handoff without duplicate action.

**Mandatory tests:** denied identity; cross-tenant retrieval; ambiguous dates/timezones; interrupted confirmation; changed user intent; duplicate callback; stale appointment; retry after uncertain response; prompt injection in retrieved material; failed human transfer. Evaluate at least 30 scripted conversation scenarios plus varied audio samples; report the actual measured latency and outcomes rather than a promised number.

**Defer:** outbound campaigns, autonomous collection calls, unlimited actions, diagnosis, arbitrary browser control, and unverified language-support claims.

**Distinct commercial artifact:** a configurable voice-action kit and two-action integration service. Measure verified resolution, repeat contact, wrong actions, handoff completion, latency, and cost per resolved case including human work.
