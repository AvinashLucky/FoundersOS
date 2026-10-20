# packages/logger — observability

**Purpose.** Structured, correlated JSON logging + telemetry across web, worker, packages.

**Responsibilities.** Correlated logs, domain events to the event log, metrics.

**Dependencies.** none.

**Best practices.** Never log secrets/PII/prompts (log hashes); run ID threads everything; cost is a logged metric.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
