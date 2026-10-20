# packages/cache — caching

**Purpose.** Redis + in-process cache abstraction.

**Responsibilities.** Cache read-heavy projections, prompt/result pairs, registry/health.

**Dependencies.** logger; Redis.

**Best practices.** Workspace-scoped keys; event-driven invalidation; never cache secrets or auth; read-side only.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
