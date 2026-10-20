# packages/storage — object storage

**Purpose.** Abstraction over object storage for user assets & media.

**Responsibilities.** Store/serve binaries via signed URLs; lifecycle-tier.

**Dependencies.** core, logger.

**Best practices.** Opaque workspace-scoped keys; signed expiring URLs; type-check on ingest; FFmpeg in worker.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
