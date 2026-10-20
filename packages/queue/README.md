# packages/queue — BullMQ abstractions

**Purpose.** Typed queue/worker contracts over Redis (run, sweep, ingest, brief).

**Responsibilities.** Job contracts, idempotent processors, scheduling, DLQ.

**Dependencies.** logger; Redis.

**Best practices.** Jobs idempotent + resumable; carry {workspaceId, runId}; smooth provider rate limits.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
