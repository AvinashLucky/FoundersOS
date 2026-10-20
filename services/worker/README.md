# services/worker — orchestration runtime

**Purpose.** Executes multi-agent runs, scheduled radar/consolidation sweeps, media ingestion, and the Weekly Brief.

**Responsibilities.** Concurrency, retries, back-pressure, budget enforcement, resumability from the event log.

**Dependencies.** packages/agents, ai-providers, memory, queue, db, logger; Redis.

**Best practices.** Stateless workers; queue is the scaling unit; never run long jobs in apps/web.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
