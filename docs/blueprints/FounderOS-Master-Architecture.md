# FounderOS — Master System Architecture

### The Permanent Architecture Blueprint · Step 2 of the FounderOS Operating Document

**Document type:** Master System Architecture (Source of Truth for all engineering)
**Canonical name:** FounderOS · *Working title: AI Company OS*
**Version:** 1.0 · CONFIDENTIAL
**Companion documents:** `FounderOS-Product-Bible.md` (vision & constitution), `FounderOS-Architecture-Map.html` (visual companion)
**Owner:** Founder + FounderOS Architecture Board
**Last updated:** June 27, 2026

---

## How to read this document

This is the architecture Bible. The Product Bible answered *why* FounderOS exists; this answers *how it is built* — at the level of systems, boundaries, contracts, and trade-offs, never production code. Every later artifact (schemas, API specs, infra-as-code, the UI itself) must trace back to a decision here. When an implementation choice conflicts with this document, either the choice is wrong or this document needs a deliberate, versioned amendment.

It is written so a new staff engineer can read it once and understand the whole machine: first the design tenets that constrain every decision, then the high-level system, then each of the eleven core systems in depth, then the cross-cutting strategy (data, runtime, scalability, cost, security, and the ten-year evolution path).

**A note on the stack decisions baked in here.** Three were settled before writing: a **hybrid datastore** (MongoDB for flexible project/memory documents; PostgreSQL + pgvector for embeddings and the knowledge graph); a **hybrid runtime** (Next.js for the founder-facing surface and short reads; a dedicated worker/queue service for long-running multi-agent orchestration); and a **separate visual companion** for diagrams. Everything below is consistent with those three commitments.

---

## 1 · Architecture Principles & 10-Year Design Tenets

Before any box-and-arrow diagram, the constraints. These are the laws the architecture obeys; §1.2 is deliberately adversarial because a blueprint meant to last a decade must survive the death of today's assumptions.

### 1.1 The ten architectural tenets

**T1 — Orchestration over models.** The durable value is the layer *above* any model: decomposition, coordination, review, and memory. Models are commodities that arrive and depart; our orchestration and memory are the company. The architecture must let any model be swapped without touching business logic.

**T2 — Memory is the product, not a cache.** Memory is a first-class subsystem with its own lifecycle, governance, and evolution — not a vector store bolted onto a chatbot. Everything is designed so that the system measurably improves *per founder* over time.

**T3 — One surface, many minds.** The founder addresses one entity. Internal multiplicity (departments, agents, debate, review) is an implementation detail that must never leak unless explicitly summoned. Complexity is absorbed by the system.

**T4 — Cost is a design input, not a bill.** Every path through the system has a known, attributable cost. The cheapest capable path is the default; escalation is deliberate and logged. Token economy is engineered, not hoped for.

**T5 — Everything is an event.** State changes are recorded as immutable events. This gives us auditability, replayability, time-travel debugging, and the substrate for memory, the decision ledger, and the project timeline — for free, because they all read the same event log.

**T6 — Contracts at every boundary.** Departments, agents, the router, and memory communicate through typed, versioned contracts (schemas), never through shared mutable globals beyond the run blackboard. This is what lets us replace any component in isolation.

**T7 — Deterministic shell around probabilistic core.** LLMs are non-deterministic; the system around them is not. Routing, validation, gating, retries, budgets, and persistence are deterministic code. We never let a model decide something a rule should decide.

**T8 — Reversible by default.** Every autonomous action is reversible and logged. The founder can always undo, inspect, and override. Trust is earned through reversibility.

**T9 — Boring infrastructure, smart core.** The orchestrator and router are where the cleverness lives. Everything else — storage, queues, auth, billing — stays deliberately boring, proven, and replaceable.

**T10 — Design for the model we don't have yet.** Capability, context windows, price, and latency will all change by orders of magnitude. No interface may assume today's token limits, today's prices, or today's "best model." Abstractions are built for a landscape that does not yet exist.

### 1.2 Assumptions we deliberately challenge

A ten-year blueprint must name what it refuses to take for granted.

*"Agents should be long-lived autonomous loops."* — Rejected as the default. Long-running unsupervised loops burn tokens and drift. FounderOS agents are **stateless functions over shared memory**: they wake, read the blackboard and relevant memory, do one bounded job, write back, and sleep. Persistence lives in memory, not in a perpetually running agent. This is cheaper, more testable, and more reversible.

*"More agents = more intelligence."* — Rejected. Each agent activated is cost and latency. The COO activates the **minimum viable department set**. Intelligence comes from coordination and memory, not headcount.

*"The newest model is the best choice."* — Rejected. The best model is the cheapest one that clears the task's quality bar. The architecture treats "best" as a per-task scoring decision, not a global constant.

*"Vector search is memory."* — Rejected as incomplete. Embeddings give similarity; they don't give *reasoning over relationships*. That is why memory is paired with an explicit knowledge graph (§7). Retrieval blends semantic similarity, graph traversal, recency, and reuse value.

*"We must pick one database."* — Rejected. Forcing flexible, schema-fluid project memory and rigorous vector/graph workloads into one engine optimizes neither. We commit to a hybrid (§13) with a single access layer hiding the seam.

*"RAG solves memory."* — Rejected as a ceiling. Stuffing retrieved chunks into a prompt is the floor. Real memory is *curated, summarized, decaying, and graph-linked* — a managed asset, not a dump.

*"Build the intelligence engines early."* — Rejected. Design DNA and the Radars produce noise until real projects have populated memory and the graph. They are sequenced late on purpose (§19).

### 1.3 What "billion-dollar AI-native" means architecturally

It means three things concretely: (1) **leverage compounds in data, not headcount** — the moat is the founder's accumulated, graph-linked memory; (2) **unit economics are visible at the task level** — we can state the gross margin of a single agent run; and (3) **the system is model-sovereign** — no single vendor can hold the company hostage, because the routing and memory layers are ours and portable.

---

## 2 · High-Level System Architecture

### 2.1 The seven planes

FounderOS is organized as seven horizontal planes. Each plane depends only on the planes below it and talks upward only through contracts.

1. **Experience Plane** — the Next.js founder surface: the single conversational/executive view, the project workspace, the dashboards (memory, cost, radars, Design DNA). Streams agent activity in real time but presents one synthesized answer.
2. **Gateway Plane** — auth, session, rate limiting, request validation, workspace-level isolation (tenancy), and the SSE/stream endpoints. The deterministic front door.
3. **Orchestration Plane** — the COO Orchestrator, the task-graph engine, the run blackboard, the review-gate engine, and the synthesis step. This is the brain that turns intent into coordinated work.
4. **Department/Agent Plane** — the ten divisions and their specialist agents, each a stateless role-function with a system prompt, tools, default model tier, and review duties.
5. **Model Plane** — the Model Router, model registry, adapters, fallback, and the cost/quality governors. Every department reaches models *only* through here.
6. **Intelligence Plane** — Memory Engine, Knowledge Graph, Design DNA, Technology Radar, Opportunity Radar, Decision Ledger. The systems that make the company compound.
7. **Data & Infra Plane** — MongoDB, PostgreSQL+pgvector, object storage, the event log, the queue/worker fabric, secrets, and observability. Deliberately boring.

### 2.2 The two runtimes (and why)

Per the hybrid runtime decision, work splits by *duration and supervision*:

- **Interactive runtime (Next.js + serverless):** authentication, reads, light single-agent answers, streaming, dashboards. Optimized for latency and cost-per-read. Stateless.
- **Orchestration runtime (dedicated worker/queue service):** any multi-agent run, long jobs, scheduled radar sweeps, memory consolidation, and Design DNA extraction. Owns concurrency, retries, budgets, and back-pressure. A request that needs the *company* (not just an agent) is enqueued here and streamed back to the Experience Plane as it progresses.

The seam between them is the **Run** object: created at the gateway, executed by the orchestration runtime, observed live by the experience runtime over SSE, and persisted to the event log.

### 2.3 The canonical request path (one sentence, then unpacked)

*A founder's intent enters the gateway, becomes a Run, is decomposed by the COO into a typed task graph, executed by the minimum set of departments against a shared blackboard with the router picking the cheapest capable model per task, gated by cross-department review, synthesized by the CEO agent into one answer, and written back to memory, the graph, and the decision ledger — while the founder watches one calm surface.*

Every later section is a zoom into one stretch of that path.

### 2.4 Eventing backbone (the spine of T5)

All planes emit events to an append-only **event log** (e.g. a durable stream). Events are the single source of truth for: the project timeline, memory writes, the decision ledger, cost accounting, and replay. Read models (Mongo collections, Postgres tables, the graph) are *projections* of this log and can be rebuilt. This is what makes the system auditable and time-travelable a decade from now.

---

## 3 · Company Architecture — The Virtual Software Company

This is the heart of the product: FounderOS is modeled as a real company with divisions, reporting lines, and review culture. The org chart *is* the runtime topology.

### 3.1 The Executive Office

The Executive Office is the only layer the founder perceives. Three executives translate between human intent and the operational org.

- **CEO Agent** — owns the founder relationship and the *single voice*. Receives intent, sets the acceptance bar, arbitrates trade-offs surfaced by divisions, and performs final synthesis. The CEO never executes specialist work; it decides and speaks.
- **COO Agent (Orchestrator)** — owns *how the work gets done*: decomposition into a task graph, activation of the minimum department set, scheduling, review-gate enforcement, and budget governance. (Full design in §4.)
- **CTO Agent** — owns the *technical bar*: stack and architecture decisions, the standard against which Engineering, Architecture, and Security review is judged, and escalation authority on technical trade-offs.

The Executive Office holds **arbitration authority**: when two divisions disagree (e.g. Design wants an animation Performance flags as costly), the relevant executive resolves it and records the decision in the ledger.

### 3.2 The ten divisions

| Division | Mandate | Core agents |
|---|---|---|
| **Executive Office** | Direction, arbitration, the single voice | CEO, COO, CTO |
| **Product Division** | What to build and why; scope, PRDs, prioritization, acceptance criteria | Product Manager, Business Analyst |
| **Design Division** | How it looks and feels; flows, IA, visual design, Design DNA application | UX Lead, UI Designer |
| **Engineering Division** | How it's built; architecture, implementation guidance, technical reviews | System Architect, Senior Developer |
| **QA Division** | Whether it's correct; test strategy, edge cases, automated suites, acceptance gates | QA Engineer, Automation Tester |
| **Security Division** | Whether it's safe; threat modeling, dependency/secret hygiene, security gates | Security Architect |
| **Knowledge Division** | What we remember; writes, indexes, curates, and retrieves memory and the graph | Memory Manager, Knowledge Curator |
| **Research Division** | What's out there; competitor scans, market and viability analysis, tech scouting | Competitor Researcher, Research Analyst |
| **Growth Division** | How it reaches people; positioning, copy, docs, GTM, opportunity scoring | Content Writer, Growth Strategist |
| **Automation Division** | How it runs itself; pipelines, scheduled sweeps, deploy/monitor automation, agent tooling | DevOps/Automation Engineer, Cost Controller |

Each agent is a **configurable role**: system prompt, allowed tools, default model tier, input/output contract, and explicit *review duties* toward sibling divisions.

### 3.3 How information flows

Information flows through the **run blackboard** — a shared, structured working memory scoped to a single Run, not through agents calling each other directly. This is a deliberate choice (avoids N² coupling and runaway chatter):

1. The COO writes the task graph and acceptance criteria to the blackboard.
2. Each activated agent reads only the blackboard slices relevant to its task plus retrieved long-term memory, does its bounded job, and writes a typed artifact back.
3. Reviewing agents read the artifact and write a *review verdict* (pass / revise / block + rationale).
4. The CEO reads the accepted artifacts and synthesizes.

Long-term information (across runs) flows through the **Memory Engine and Knowledge Graph**; the blackboard is ephemeral and discarded after the Run is persisted to the event log.

### 3.4 How decisions get approved (the review-gate model)

Nothing reaches the founder un-reviewed. Approval is modeled as **gates**, each owned by a division, each with explicit acceptance criteria:

- **Product gate** — does the artifact satisfy the PRD and acceptance criteria?
- **Architecture gate (CTO/Engineering)** — is it sound, scalable, maintainable?
- **Design gate** — is it on-Design-DNA, accessible, coherent?
- **QA gate** — are edge cases and tests addressed?
- **Security gate** — any threat, secret, or dependency risk?
- **Cost gate (Automation/Cost Controller)** — did the run stay within budget; is the proposed solution cost-sane?

Gates run **in parallel** where independent and **block** on dependencies. A gate returns `pass`, `revise` (with specific asks, routed back to the owning agent), or `block` (escalated to the Executive Office for arbitration). The set of gates activated is itself chosen by the COO based on task type — a copy tweak doesn't wake the Security Architect.

### 3.5 How reviews happen (without infinite loops)

Review is bounded by three governors so the company can't argue forever: a **max-revision count** per artifact (after which it escalates to an executive, never loops silently), a **budget ceiling** per Run (the Cost Controller can force "ship the best current draft with caveats"), and a **confidence threshold** (high-confidence artifacts skip redundant gates). Disagreements that can't be resolved by revision become an **arbitration event** decided by the CEO/CTO and written to the Decision Ledger — so the *reasoning* is remembered even when the loser was a division.

### 3.6 How the final response is generated (synthesis)

The CEO Agent performs synthesis: it reads all accepted artifacts and review verdicts, resolves residual tension into a single coherent position, strips internal mechanics, and produces **one executive answer** in the founder's voice and the company's standards. Crucially, synthesis also produces a **structured side-channel** (which divisions ran, which models, what they decided, what it cost, what was written to memory) that powers "show your work," the dashboards, and the ledger — present but invisible by default (T3).

### 3.7 Why this topology lasts

Because divisions are roles over a blackboard and memory, not hard-wired services, the company can **grow new divisions** (e.g. a future "Legal/Compliance Division") without re-plumbing, **swap the brains** of any division via the router, and **scale horizontally** by running more stateless agent workers. The org chart is data, not code.

---

## 4 · Agent Orchestrator — The COO

The COO Orchestrator is the deterministic brain that turns one prompt into coordinated company work and one answer back. It is the most important piece of IP in the system and is engineered as deterministic code wrapping probabilistic agents (T7).

### 4.1 Responsibilities

Understand intent → plan the minimum work → activate only required departments → schedule and run them affordably → coordinate review → synthesize one answer → persist everything. It owns budget, concurrency, and the run lifecycle end to end.

### 4.2 The orchestration loop (conceptual)

```
Run = create(intent, founder, project)
context = MemoryEngine.retrieve(intent, project)        // graph + vector + recency + reuse
plan = COO.decompose(intent, context)                   // typed task graph + acceptance criteria
departments = COO.selectMinimumSet(plan)                // cost-aware activation
budget = CostController.allocate(Run, plan)
while plan.hasReadyTasks() and budget.ok():
    batch = plan.readyTasks()                           // dependency-respecting
    parallel for task in batch:
        model = ModelRouter.pick(task)                  // cheapest capable
        artifact = Agent[task.role].run(model, blackboard, context)
        blackboard.write(artifact)
    verdicts = ReviewGateEngine.run(batch.artifacts)    // parallel gates
    plan.applyVerdicts(verdicts)                         // pass / revise / block→arbitrate
answer = CEO.synthesize(blackboard.accepted())
KnowledgeDivision.persist(Run, blackboard, decisions)   // memory, graph, ledger, timeline
return answer (+ side-channel)
```

This loop is **resumable** (it can be reconstructed from the event log if a worker dies) and **bounded** (budget and max-revision governors guarantee termination).

### 4.3 Intent understanding & request classification

The first COO step classifies the request along axes that determine cost and topology: **type** (question, build, review, research, decision, fix), **scope** (single-discipline vs cross-functional), **novelty** (reuse-eligible vs net-new), **risk** (does it touch security/data/cost), and **stakes** (throwaway vs architectural). Classification picks the *template task graph* and the *gate set*, and is the single biggest lever on token spend — a misclassified "quick question" that wakes ten agents is the canonical waste we engineer against.

### 4.4 Minimum-viable-department activation (the token-economy core)

The COO never activates a division unless the plan requires its artifact. Activation is driven by: the task graph's declared roles, the risk/stakes classification (gates), and a **reuse check** — if memory already holds a high-confidence answer/asset, the COO retrieves and adapts it instead of regenerating (cheapest token is the one never spent). The default posture is *minimal*; the founder or the CEO can request "full board review" explicitly for high-stakes work.

### 4.5 Scheduling, concurrency & the blackboard

The COO runs independent tasks in parallel up to concurrency and provider rate limits, joining on dependencies. The **blackboard** is the run-scoped shared state (facts, drafts, decisions, verdicts) — typed, append-mostly, and the only place agents coordinate. After the Run, the blackboard is serialized into the event log and the durable read models, then discarded.

### 4.6 Review coordination & conflict resolution

The COO invokes the Review-Gate Engine, collects verdicts, and applies the three governors from §3.5. It routes `revise` asks to the right agent, escalates `block`s to the Executive Office, and records arbitration outcomes. It guarantees the loop terminates and the founder never sees the sausage being made.

### 4.7 Synthesis & the single answer

The COO hands accepted artifacts to the CEO Agent for synthesis (§3.6), attaches the structured side-channel, streams the result to the Experience Plane, and triggers Knowledge Division persistence. One answer out; the company is smarter than before.

### 4.8 Failure, degradation & resumability

If an agent fails, the router retries on a fallback model; if a division stalls, the budget governor can ship the best current draft *with explicit caveats* rather than hang; if a worker crashes, the Run resumes from the event log. The system degrades gracefully toward "an honest partial answer," never toward silence or an infinite spend.

---

## 5 · Model Router — The Model-Sovereignty Layer

The router is what makes T1 and T10 real: every department reaches intelligence only through here, so models are swappable commodities and the company is owned by no vendor.

### 5.1 Model Registry

A declarative catalog of every available model — Claude, Gemini, OpenAI, open-source/local, and *whatever ships next* — each described by a uniform record: provider, capabilities (reasoning, vision, long-context, tool-use, code), context window, modality, latency class, cost per input/output token, quality scores per task type, privacy/residency class (e.g. "local-only for sensitive data"), and health/availability. The registry is **data, not code** — adding a future model is a registry entry plus an adapter, never a logic change.

### 5.2 Tiered capability bands

Models are grouped into cost/capability bands so routing reasons about *tiers*, not vendors:

| Tier | Cost | Typical role | Example class |
|---|---|---|---|
| **Tier 0 — Local** | $0 | Privacy-sensitive, high-volume, offline, embeddings | Local Llama-class |
| **Tier 1 — Fast** | $ | Classification, extraction, simple drafts, routing decisions | Small fast hosted |
| **Tier 2 — Balanced** | $$ | Most specialist work: design, dev, QA, research | Mid frontier |
| **Tier 3 — Frontier** | $$$ | Hard reasoning, architecture, final synthesis, arbitration | Top frontier |

Tiers are an abstraction over the registry; when a new model arrives it simply joins a band, and all routing logic benefits without modification.

### 5.3 Routing Engine

For each task the engine scores candidate models on a weighted function of **capability match** (can it do the job at all — vision? long context? tool-use?), **quality bar** (does its task-type score clear the task's required threshold), **cost**, **latency budget**, and **privacy class**. It selects the **lowest-cost candidate that clears the bar**, not the strongest model. Routing weights are themselves configurable per workspace and per task type, and the decision is logged for cost analytics and "show your work."

### 5.4 Fallback & resilience

Each task carries an ordered fallback chain (e.g. balanced → alternate balanced → frontier). On error, rate-limit, timeout, or a failed quality check, the engine escalates along the chain. Provider outages are isolated by the adapter layer; a single vendor going dark degrades quality or cost, never availability. Local models are the ultimate floor for privacy-critical or offline operation.

### 5.5 Cost-optimization rules

Beyond "cheapest capable": **prompt/result caching** (identical or near-identical sub-tasks reuse prior outputs), **context minimization** (send the smallest sufficient slice of memory, never the whole project), **batch and parallel economy**, **escalate-only-on-failure** (never start at frontier), **reuse-before-generate** (the Memory Engine answers first when confident), and **budget envelopes** per Run enforced by the Cost Controller. The router exposes a real-time cost meter to the founder.

### 5.6 Quality rules

Quality is enforced, not assumed: per-task **minimum-quality thresholds**, **automatic escalation** when an output fails validation or a review gate, **self-consistency / cross-model check** for high-stakes outputs (a cheap second model verifies a frontier answer, or vice-versa), and **golden-set regression** so we can detect when a model or prompt change degrades real outcomes.

### 5.7 Future plug-in architecture

New models, providers, and even new modalities (audio, video, 3D, agents-as-models) are integrated through a stable **adapter contract**: implement `capabilities()`, `cost()`, `invoke()`, `stream()`, `health()`, and register. No core change. This is the single most important interface for ten-year longevity (T10) — the router is built for a model market that doesn't exist yet, including the possibility that the "best brain" for a task in five years is another orchestrated system reached over the same adapter.

---

## 6 · Memory Engine — The Company That Never Forgets

Memory is the moat made mechanical (T2). It is a managed, evolving asset — curated, summarized, decaying, and graph-linked — not a chunk dump.

### 6.1 What is stored

Per project: business decisions, architecture, code knowledge, design knowledge, components, screenshots, videos, assets, research, testing knowledge, lessons learned, reusable patterns, decision history, and the project timeline. Across projects: founder-level patterns, Design DNA, and the knowledge graph that links it all.

### 6.2 The four memory layers

1. **Working memory (run-scoped)** — the blackboard of a single Run. Ephemeral; serialized to the event log on completion.
2. **Project memory** — everything a project accumulates over its life. The primary unit of "a project has its own company."
3. **Founder memory** — cross-project, lifelong knowledge of how this founder thinks, decides, and builds. This is what makes the OS *yours*.
4. **Knowledge graph** — the relational connective tissue across all of the above (§7).

### 6.3 Storage strategy (hybrid Mongo + Postgres)

Per the data decision, memory is split by *shape and workload*:

- **MongoDB** holds the flexible, schema-fluid documents: project memory entries, decision records, lessons, timelines, artifact metadata, research notes, and links to large assets. Document flexibility matches memory's heterogeneous, evolving structure.
- **PostgreSQL + pgvector** holds the **embeddings** for every memorable item and the **knowledge-graph edges** (materialized in relational tables), with row-level security per workspace. This is the retrieval and reasoning substrate.
- **Object storage** holds the heavy binaries — screenshots, videos, design files, exports — referenced by Mongo metadata, parsed into structured insight (see §6.6) before storage so the *meaning* lives in memory, not just the file.

A single **Memory Access Layer** hides this seam: callers ask "remember this" / "recall relevant to X" and never know which store answered. This is what lets us re-balance stores later (T6/T9) without touching agents.

### 6.4 Writing memory (curation, not capture)

The Knowledge Division's Memory Manager doesn't dump transcripts. On each Run it **extracts** durable items (decisions, patterns, assets, lessons), **summarizes** them at multiple granularities, **scores** them for reuse value and confidence, **deduplicates** against existing memory, **embeds** them, and **links** them into the graph. Capture is cheap; curation is the craft — bad curation poisons future retrieval, so curation itself is a reviewed step.

### 6.5 Retrieving memory (blended, not just vector)

Retrieval blends four signals: **semantic similarity** (pgvector), **graph proximity** (related projects/components/decisions), **recency** (decayed by age), and **reuse value** (how often/successfully this memory has helped before). The Memory Access Layer returns a small, ranked, *budget-aware* context — the smallest set that maximizes usefulness — because over-retrieval is both a cost and a quality problem.

### 6.6 Multimodal memory

Screenshots are parsed by vision models into structured UI critique and design tokens; videos/flow recordings are segmented into steps and friction points feeding UX and QA; uploaded references feed Design DNA. The **artifact** is stored, but so is its *structured meaning* — that's what becomes retrievable and reusable.

### 6.7 How memory evolves over months and years

This is the heart of the moat and is engineered explicitly:

- **Consolidation.** Periodically (a scheduled Automation sweep), related memories are merged and re-summarized into higher-order patterns — the way a senior engineer's "lessons" compress experience. Raw detail is retained but de-prioritized.
- **Decay & salience.** Unused, low-value memories decay in retrieval rank (never deleted outright; archived and still searchable). Frequently useful memories gain salience. Memory has a metabolism.
- **Promotion.** A pattern that recurs across projects is *promoted* from project memory to founder memory (and may inform Design DNA or a Radar). This is how the system generalizes.
- **Archival.** Completed/abandoned projects are archived — cold-stored but fully searchable and graph-connected, so a three-year-old decision still surfaces when relevant.
- **Forgetting on purpose.** Stale tech facts and superseded decisions are marked *superseded* (with a pointer to what replaced them) rather than silently lingering, so the system doesn't recommend yesterday's best practice.

Over years, the founder's FounderOS becomes a compressed, navigable model of *how they build* — denser, faster, and more valuable every month. That trajectory is the product.

### 6.8 Governance & privacy

Memory is workspace-isolated (RLS), founder-owned, exportable, and deletable. Sensitive items can be pinned to **local-only** models for processing. Memory is never silently shared across founders; cross-founder learning (if ever offered) is opt-in and aggregate-only.

---

## 7 · Knowledge Graph — Reasoning Across Everything

The graph is what lifts FounderOS from "search" to "reasoning." Embeddings find *similar*; the graph finds *related, dependent, and causal*.

### 7.1 Nodes and edges

**Nodes:** projects, technologies, components, business ideas, competitors, design patterns, architectures, libraries, AI models, reusable assets, decisions, lessons, founders. **Edges (typed, directional, weighted):** `uses`, `depends-on`, `reuses`, `replaces`, `inspired-by`, `competes-with`, `solved-by`, `caused`, `belongs-to`, `evolved-from`. Edges carry weight (strength/confidence) and provenance (which Run created them).

### 7.2 Storage & access

The graph is **materialized in Postgres edge tables** alongside the pgvector embeddings (per the hybrid decision), so a single query can combine *"semantically similar to X"* with *"and connected to projects that used React 19"*. For deep multi-hop reasoning we keep the option open to project the graph into a dedicated graph engine later — the Memory Access Layer makes that swap invisible (T6). Heavy graph nodes' documents live in Mongo; the graph stores their IDs and relationships.

### 7.3 How FounderOS reasons across knowledge

Four reasoning patterns run over the graph:

- **Solution transfer.** "This new project needs auth + billing." → traverse to past projects with those components, retrieve the reusable assets and the decisions behind them, adapt rather than rebuild.
- **Impact analysis.** "Should I migrate off library Y?" → traverse `depends-on` edges to see every project/component affected, weighted by importance, before recommending.
- **Pattern discovery.** Recurring subgraphs (the same architecture shape solving the same problem) are detected and promoted into reusable patterns and Design DNA.
- **Opportunity & risk surfacing.** Gaps and dense clusters in the graph feed the Opportunity and Technology Radars (§8, §9) — e.g. "you keep rebuilding the same dashboard; here's a reusable module," or "three of your projects depend on a now-deprecated library."

### 7.4 Graph hygiene

The graph is grown by the Knowledge Division during persistence and pruned by scheduled sweeps: weak/stale edges decay, superseded nodes are marked, and contradictory edges trigger a reconciliation (often an arbitration recorded in the ledger). A healthy graph is curated, not merely accumulated.

---

## 8 · Design DNA — The Founder's Personal Visual Language

Design DNA learns *how the founder's work should look and feel* and applies it automatically — **by extracting principles, never by copying designs** (a hard legal and ethical constraint, consistent with the Product Bible's ethics stance).

### 8.1 Inputs

Previous projects, uploaded references, saved screenshots, component libraries, and templates. Each is analyzed by vision/structure models into *abstract* attributes — never stored or reproduced as a copy of someone else's work.

### 8.2 What is extracted (principles, not pixels)

Spacing systems and rhythm, visual hierarchy rules, interaction patterns, typography scale and pairing logic, component patterns (structure, not literal markup), and animation philosophy (timing, easing, restraint). The output is a **token-and-rules profile**: an abstract specification of taste, not an asset library of clones.

### 8.3 Anti-copying guarantee (by design)

Extraction is **lossy and generalizing by construction**: references contribute to statistical/abstract parameters (e.g. "prefers 8px spacing rhythm, high contrast, minimal motion") that cannot reconstruct the source. The system refuses to reproduce a specific source design and records provenance so influence is auditable. This is enforced at the architecture level, not left to a prompt.

### 8.4 How it becomes a personal design language

As projects accumulate, the profile converges from many weak signals into a confident, founder-specific **Design DNA** that the Design Division applies to every new screen by default — so the founder's tenth project looks unmistakably *theirs* without them re-specifying taste each time. Design DNA is versioned (it evolves) and overridable (the founder can fork a per-project variant). It is sequenced after real projects exist (§19), because taste extracted from an empty portfolio is noise.

---

## 9 · Technology Radar — Staying Current Without Churning

A continuously updated view of the tools that matter, with intelligent, *non-disruptive* migration advice (Product Bible principle P7: evolve, don't churn).

### 9.1 What it tracks

AI models, the React ecosystem, Next.js, Node, MongoDB, Supabase/Postgres, cloud, open source, security, testing, design systems, and developer tooling — the founder's actual stack first, the broader landscape second.

### 9.2 How it works

Scheduled Automation sweeps ingest public, reputable sources (engineering blogs, release notes, conference talks, open docs, community signal), the Research Division distills them, and findings become **technology nodes** in the graph with maturity, momentum, risk, and fit signals. The Radar then **joins the landscape to the founder's graph**: a new tool only matters if it touches what the founder actually uses or plans.

### 9.3 Intelligent migration recommendations

A recommendation fires only when the benefit is *meaningful and net-positive after switching cost*. The Radar runs an **impact analysis** over the graph (§7.3) to estimate effort and blast radius, weighs it against the gain, and presents a reasoned proposal — adopt, watch, hold, or retire — recorded in the Decision Ledger with a review date. It actively resists novelty for its own sake; "your stack is fine" is a valid, common output.

---

## 10 · Opportunity Radar — Discovering What to Build Next

The proactive engine: it surfaces opportunities drawn from the founder's portfolio plus the open world.

### 10.1 What it discovers

Business opportunities, AI trends, developer trends, automation ideas, revenue opportunities, SaaS/agency/freelancing opportunities — scored and contextualized to *this* founder.

### 10.2 How recommendations are generated

Three signal sources are fused: **internal** (graph gaps and dense clusters — what the founder keeps rebuilding, what their assets enable cheaply), **external** (trend and demand signals from the same vetted public sources as the Tech Radar), and **fit** (alignment with the founder's demonstrated skills, Design DNA, and past wins). Each candidate gets a transparent score across *demand, effort, fit, timing,* and *reuse leverage*, with the reasoning shown. Opportunities become first-class graph nodes and can seed a new project — closing the loop back to §12.

### 10.3 Guardrails

The Radar suggests; it never auto-starts work (T8). Recommendations carry confidence and rationale, decay if ignored, and are tuned by founder feedback so the signal sharpens over time rather than nagging.

---

## 11 · Decision Ledger — Institutional Memory of Judgment

Every major decision is recorded as a durable, structured, queryable record. This is how the company remembers *why*, not just *what* — and how it avoids re-litigating settled questions.

### 11.1 Anatomy of a decision record

Decision, reason, alternatives considered, trade-offs, expected impact, **review date**, reusable knowledge extracted, and future recommendations. Plus provenance: which Run, which divisions, which arbitration (if any), and the cost of making it.

### 11.2 How it's produced and used

Decisions are emitted as events (T5) during runs and arbitrations, projected into a Mongo collection, embedded and graph-linked so they surface in future retrieval ("last time you chose X over Y because Z"). On the **review date**, the Automation Division resurfaces the decision for re-evaluation against new context — decisions have a shelf life. Superseded decisions are marked, not deleted, with a pointer to their replacement, so the reasoning chain is always traceable.

### 11.3 Why it compounds

The ledger turns one-off judgment into reusable institutional knowledge: the founder's hundredth decision is informed by the ninety-nine before it, and the system can warn when a new choice contradicts a past one without good reason.

---

## 12 · Project Lifecycle — Idea to Evolution as One Continuum

Every project moves through thirteen stages, each owned by clear divisions, each transitioning naturally to the next because the prior stage's output is the next stage's input — and the end feeds back into the beginning.

### 12.1 The stages

| # | Stage | Lead divisions | Output that seeds the next stage |
|---|---|---|---|
| 1 | **Idea** | Executive, Product | Framed intent + initial graph context |
| 2 | **Research** | Research, Product | Market/competitor/viability brief |
| 3 | **Planning** | Product, Executive | PRD, scope, acceptance criteria |
| 4 | **Architecture** | Engineering, Security | System design + decision records |
| 5 | **UX** | Design | Flows, IA, wireframes |
| 6 | **UI** | Design | Screens on Design DNA |
| 7 | **Development** | Engineering | Implementation guidance + components |
| 8 | **Testing** | QA, Automation | Test suites, acceptance verdicts |
| 9 | **Deployment** | Automation, Security | Release + runbook |
| 10 | **Monitoring** | Automation | Live signals, incidents |
| 11 | **Evolution** | All, Executive | Improvement proposals (Evolution Engine) |
| 12 | **Archive** | Knowledge | Cold-stored, searchable, graph-linked |
| 13 | **Continuous Improvement** | Knowledge, Research | Promoted patterns → founder memory & Radars |

### 12.2 Natural transitions & gates

Each transition is a **gate**: the next stage cannot begin until the prior stage's acceptance criteria pass (the same review-gate machinery from §3.4). Stages can run partially in parallel where dependencies allow (UX and architecture often overlap). Every transition emits events, writes memory, and may create decision records — so the project timeline is a free projection of the lifecycle.

### 12.3 Projects never truly finish

Stages 11–13 feed the beginning: evolution proposals become new ideas, archived projects remain retrievable, and promoted patterns sharpen Design DNA and the Radars. A project is a *loop*, not a line — which is exactly why memory compounds.

---

## 13 · Data Architecture — The Hybrid Datastore

The committed data strategy is **hybrid Mongo + Postgres**, chosen because the system has two fundamentally different workloads that no single engine serves well.

### 13.1 Division of responsibility

- **MongoDB (flexible document store)** — project memory entries, decision records, lessons, timelines, research notes, artifact metadata, agent/department configs, and run records. Memory is heterogeneous and evolves in shape constantly; documents absorb that change without migrations.
- **PostgreSQL + pgvector (rigorous relational + vector + graph)** — embeddings for all memorable items, the knowledge-graph edge tables, workspace/identity/billing, the decision-ledger index, and anything needing transactions, joins, or row-level security. RLS enforces per-workspace isolation at the database, not just the app.
- **Object storage** — screenshots, videos, design files, exports, large binaries; referenced by Mongo metadata, with structured meaning extracted into memory before storage.
- **Event log (durable stream)** — the append-only source of truth (T5); Mongo, Postgres, and the graph are all projections of it and can be rebuilt.

### 13.2 The Memory/Data Access Layer (the seam-hider)

A single internal access layer exposes intent-level operations — `remember(item)`, `recall(query, budget)`, `link(a, edge, b)`, `record(decision)`, `timeline(project)` — and decides internally which store(s) to touch, embeds and graph-links on write, and blends signals on read. **No agent, department, or API route ever talks to Mongo or Postgres directly.** This is the contract (T6) that lets us re-balance, re-shard, or even replace a store in five years without touching the company logic above it.

### 13.3 Consistency model

Writes to the event log are the commit point; projections are eventually consistent and idempotently rebuildable. Within a Run, the blackboard is strongly consistent (single owner). Cross-store writes (e.g. a Mongo decision doc + its Postgres embedding + graph edge) are coordinated through the persistence step and reconciled by sweeps — we favor *recoverable eventual consistency* over distributed transactions, because memory tolerates seconds of lag and must never lose data.

### 13.4 Why not one database

Forcing schema-fluid memory into Postgres means constant migrations; forcing vector/graph/transactional workloads into Mongo means fighting the engine on its weakest axes. The hybrid pays a small operational cost (two engines, one access layer) for a large fit-and-longevity gain. The access-layer contract caps that cost and keeps the option to consolidate later if one engine grows to cover both well.

---

## 14 · Runtime & API Architecture

The committed runtime is **hybrid**: an interactive Next.js surface plus a dedicated orchestration worker/queue service.

### 14.1 Interactive runtime (Next.js + serverless)

Serves the Experience Plane and Gateway Plane: auth, session, dashboards, reads, light single-agent answers, and the SSE streams that show the company working. Stateless, latency-optimized, horizontally trivial to scale. It **never** runs a long multi-agent job inline; it enqueues one and subscribes to its stream.

### 14.2 Orchestration runtime (worker/queue)

A dedicated service (Node-based, separate from Next.js) consumes a durable queue and runs the COO loop: multi-agent runs, scheduled radar/consolidation sweeps, Design DNA extraction, and any long or bursty job. It owns **concurrency, retries, back-pressure, budget enforcement, and resumability** from the event log. Workers are stateless and scale by count; the queue absorbs spikes and smooths provider rate limits.

### 14.3 API surface (thin, typed, streaming)

A thin, end-to-end-typed surface: REST/RPC for CRUD on projects, memory, decisions, and configs; **SSE/streaming** for live Run progress; and **webhooks/schedules** that trigger Automation sweeps. Contracts are versioned; the founder-facing API and the internal agent/department contracts are separate layers so internal evolution never breaks the surface.

### 14.4 Why this shape

It matches the work to the machine: cheap, fast reads on serverless; controlled, recoverable long jobs on workers. It also maps cleanly onto cost (idle costs near zero; heavy runs are isolated and metered) and onto the ten-year tenets (the orchestration runtime can grow far more sophisticated without the founder surface ever changing).

---

## 15 · Scalability Strategy

### 15.1 Dimensions of scale

FounderOS scales along four independent axes, and each is handled separately: **founders/workspaces** (tenancy), **projects per founder** (memory volume), **concurrent runs** (compute), and **memory depth over years** (data growth and retrieval quality).

### 15.2 How each is handled

- **Workspaces** — full isolation via RLS in Postgres and workspace scoping in Mongo; stateless app tiers scale horizontally behind the gateway; no founder's load or data touches another's.
- **Concurrent runs** — the queue + stateless worker pool is the scaling unit; add workers to add throughput. Provider rate limits are smoothed by the queue and the router's fallback/load-spreading.
- **Memory volume** — consolidation, decay, and archival (§6.7) keep the *hot* retrieval set small even as raw history grows unbounded; cold data moves to cheaper storage but stays searchable. Retrieval cost stays roughly flat as memory deepens — a deliberate design goal.
- **Graph size** — partitioned per workspace; multi-hop reasoning bounded by depth limits and salience pruning; option to offload to a dedicated graph engine if a power-user's graph outgrows relational traversal.

### 15.3 Stateless-core principle

Because agents are stateless functions over shared memory (§1.2) and workers are stateless consumers, horizontal scale is the default and there is no single bottleneck node holding run state. The only stateful tiers are the datastores, which scale by their own proven mechanisms (replication, sharding, read replicas) — kept boring on purpose (T9).

---

## 16 · Cost-Optimization Strategy

Cost is a first-class architectural concern (T4), engineered at five layers.

### 16.1 The five cost layers

1. **Don't run it** — reuse-before-generate: the Memory Engine answers from existing high-confidence memory/assets instead of invoking models at all. The cheapest token is the one never spent.
2. **Run the smallest department set** — the COO's minimum-viable activation and request classification (§4.3–4.4) prevent waking the whole company for a small ask.
3. **Run the cheapest capable model** — the router defaults to the lowest tier that clears the bar, escalating only on failure (§5.3, §5.5).
4. **Send the least context** — budget-aware retrieval sends the smallest sufficient memory slice; caching reuses identical sub-results (§5.5, §6.5).
5. **Stop in time** — per-Run budget envelopes and the Cost Controller force "ship the best current draft with caveats" before spend runs away (§3.5).

### 16.2 Visibility & governance

Every Run carries an attributable cost (which task, which model, how many tokens). The founder sees a live cost meter and per-project/per-month spend. **Bring-your-own-key** keeps inference at cost on every tier. Budgets are configurable and enforced deterministically, not suggested.

### 16.3 The structural advantage

Because most work routes to Tier 0–2 and only genuinely hard reasoning reaches frontier, blended inference cost runs dramatically below a "frontier-everywhere" baseline (the Product Bible's ≈70% savings target). This is not a discount — it's an architectural property of routing + memory + minimal activation, and it improves as memory deepens (more reuse, less generation).

---

## 17 · Security Strategy

Security is a division *and* a cross-cutting plane. The posture: assume every model output is untrusted, every workspace is hostile to every other, and every secret is a liability.

### 17.1 Tenancy & data isolation

Workspace isolation is enforced at the database (Postgres RLS) and in every Mongo query scope — defense in depth, not app-layer trust alone. Memory, graph, and assets are never shared across founders without explicit, auditable opt-in.

### 17.2 Secrets & keys

BYO model keys and any project secrets are encrypted at rest, scoped to the workspace, never written to memory or logs, and never sent to a model. The Security Division's gate scans artifacts for leaked secrets and risky dependencies before anything is delivered or stored.

### 17.3 Prompt-injection & untrusted-content defense

Because the system ingests public web content (Radars), uploaded files, and screenshots, all external content is treated as untrusted: it's sandboxed, never executed, and never allowed to issue privileged instructions to agents. Tool access is allow-listed per agent (T7 — a rule decides what an agent may touch, not the model). Retrieved web content informs, it does not command.

### 17.4 Auditability & reversibility

The event log gives a complete, immutable audit trail of every action, decision, model call, and cost. Every autonomous action is reversible (T8). Security findings, like all decisions, are recorded in the ledger with review dates.

### 17.5 Privacy-tiered routing

Sensitive data can be pinned to **local/Tier-0 models** so it never leaves the founder's environment — a routing rule, enforced by the deterministic shell, not a best-effort prompt. This is also the foundation for future enterprise self-host and residency requirements (Product Bible Phase 4).

---

## 18 · Founder Experience Philosophy (Architecture in Service of Feel)

Architecture exists to produce a feeling: *working with an elite company, not operating a chatbot.* Three experience invariants constrain the technical design.

### 18.1 One calm surface

No matter how many divisions, agents, and models ran, the founder sees **one executive answer** in one voice. The streaming "company at work" view is reassurance, not work the founder must do. All multiplicity is opt-in to inspect (T3). Every architectural choice that would leak internal complexity to the surface is, by definition, a bug.

### 18.2 Reduce mental effort, increase confidence, improve decisions

The system carries the cognitive load: it remembers so the founder doesn't, it reviews so the founder can trust, it shows reasoning and cost so the founder feels in control, and it surfaces decisions and trade-offs rather than raw output. Confidence comes from **reversibility, transparency-on-demand, and consistency** — all architectural properties, not UI veneer.

### 18.3 Mid-context, never from zero

Because memory and the graph persist, the founder always resumes inside context — the OS already knows the portfolio, the Design DNA, the open decisions. The experience of "it already knows me" is the direct, felt output of the Memory Engine and is the single biggest differentiator from a chatbot.

### 18.4 The UI/visual language (from your provided design)

The founder surface adopts the dark-luxury system from your blueprint — Space Grotesk display, Manrope body, JetBrains Mono labels; an iris/indigo (`#7c6cf7`) and cyan (`#22d3ee`) accent palette on near-black (`#0a0a10`); glassmorphism, floating panels, premium gradients, and minimal high-end motion (Framer Motion / GSAP, restrained). These are captured as **design tokens** so every UI agent stays on-brand automatically — the visual layer is itself governed by Design DNA. The provided HTML layouts are the canonical reference; implementation should reuse and elevate them, never regress below that bar.

---

## 19 · Long-Term Evolution Strategy (Built to Last 10 Years)

### 19.1 What we assume will change — and how we're insulated

| Force of change | Insulation |
|---|---|
| Models get 10× cheaper/smarter; new providers and modalities arrive | Router + adapter contract (§5.7); nothing assumes today's "best model" or prices (T1, T10) |
| Context windows grow enormous | Retrieval stays *curated and budget-aware* anyway — bigger windows lower cost, never replace memory governance |
| Agent frameworks churn | Agents are stateless role-functions over contracts; the framework is replaceable (§1.2) |
| Datastores evolve / one engine catches up | The access-layer seam (§13.2) lets stores be re-balanced or consolidated invisibly |
| The founder's needs grow from solo → studio → enterprise | Org-as-data + tenancy + RLS scale from one founder to teams without re-architecture (Product Bible Phases) |
| New divisions become necessary (legal, finance, etc.) | New roles are added as data, not re-plumbed services (§3.7) |

### 19.2 The build sequence (dependency-ordered, not excitement-ordered)

Foundation first, intelligence last — because the engines are empty until memory compounds.

1. **Memory Engine + Model Router** (the foundation everything reads from / pays through).
2. **COO Orchestrator + the core divisions** (coordination that makes agents affordable and reviewed).
3. **Project Workspace surface + lifecycle** (the founder-facing loop; can begin in parallel with late orchestration work).
4. **Knowledge Graph + Decision Ledger** (relational reasoning over accumulated memory).
5. **Design DNA + Technology Radar + Opportunity Radar** (deferred until real projects have populated memory and the graph; building earlier yields empty, low-signal output).
6. **Evolution & autonomy + teams/governance** (the proactive, multi-seat future).

The critical path **Memory → Router → Orchestrator** is strictly sequential; everything else layers on once it exists.

### 19.3 The Evolution Engine (closing the loop)

In the mature system, a scheduled Evolution Engine reads the graph, ledger, and Radars to *propose* improvements across the founder's portfolio — and, with permission and full reversibility, apply them. This is where the lifecycle's "Evolution" stage (§12) becomes proactive: the company doesn't just answer, it tends the founder's whole body of work. It is sequenced last because it is only trustworthy once memory, the graph, and review gates are mature.

### 19.4 The north of all of it

Every evolution decision is bounded by the same constraints as the vision: more autonomy, never less command; more memory, never less transparency; more capability, never less frugality. The architecture is allowed to grow in power only in directions that keep those three guarantees intact.

---

## 20 · Architecture Decision Summary

| # | Decision | Rationale | Revisit when |
|---|---|---|---|
| AD-1 | Orchestration + memory are the moat; models are commodities | Survives model churn (T1) | A model vendor offers irreplaceable lock-in value (resist) |
| AD-2 | Agents are stateless functions over shared memory | Cheaper, testable, reversible (§1.2) | Genuine need for long-lived autonomous loops emerges |
| AD-3 | Hybrid Mongo + Postgres behind one access layer | Right tool per workload; seam hidden (§13) | One engine convincingly covers both workloads |
| AD-4 | Hybrid Next.js + worker/queue runtime | Match work to machine; recoverable long jobs (§14) | Serverless gains durable long-run + queue semantics |
| AD-5 | Everything is an event; read models are projections | Audit, replay, free timeline/ledger/memory (T5) | — (foundational) |
| AD-6 | Cheapest-capable routing, escalate on failure | Token economy as architecture (§5, §16) | Frontier becomes uniformly cheap (then simplify) |
| AD-7 | Design DNA extracts principles, never copies | Legal/ethical hard constraint (§8.3) | — (non-negotiable) |
| AD-8 | Intelligence engines sequenced last | They're noise until memory compounds (§19.2) | — (sequencing law) |

---

## 21 · Glossary

- **Run** — one unit of company work: created at the gateway, executed by the orchestration runtime, persisted to the event log.
- **Blackboard** — run-scoped shared working memory; the only place agents coordinate.
- **Department/Division** — a role group (Product, Engineering, etc.) composed of specialist agents.
- **Gate** — a division-owned acceptance check (pass / revise / block) before work advances or ships.
- **Access Layer** — the single internal interface over Mongo + Postgres + storage; hides the datastore seam.
- **Tier** — a model cost/capability band: Local ($0) → Fast ($) → Balanced ($$) → Frontier ($$$).
- **Promotion** — moving a recurring pattern from project memory up to founder memory.
- **Consolidation** — periodic merging/re-summarizing of related memories into higher-order patterns.
- **Side-channel** — the structured "show your work" record (divisions, models, decisions, cost) attached to every answer.

---

## 22 · Amendment Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-06-27 | Initial Master System Architecture. Commits: hybrid Mongo+Postgres data layer, hybrid Next.js+worker runtime, event-sourced core, model-sovereign router, four-layer memory, materialized knowledge graph, principle-extracting Design DNA, dependency-ordered build sequence. | Founder + FounderOS Architecture Board |

> **Next step in the operating document:** Step 3 — translate this blueprint into concrete schemas (Mongo collections + Postgres/pgvector tables + graph edges), the COO orchestration spec, and the Model Router contract, starting with the Memory → Router → Orchestrator critical path.

*This is the permanent architecture blueprint. No UI or code should be designed that contradicts it; amend it deliberately, never drift from it silently.*

