# packages/agents — Agent Engine

**Purpose.** The COO orchestration loop, the 16-role roster, the review-gate engine, synthesis.

**Responsibilities.** Decompose→activate-min-set→schedule→gate→synthesize→persist.

**Dependencies.** core, ai-providers, memory.

**Best practices.** Deterministic shell around probabilistic agents; bounded; resumable; agents stateless.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
