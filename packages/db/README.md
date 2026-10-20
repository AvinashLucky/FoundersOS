# packages/db — data access (hybrid)

**Purpose.** Mongo + Postgres/pgvector clients, repositories, the event log, and zod schemas.

**Responsibilities.** Persist & project; enforce RLS; one schema definition reused everywhere.

**Dependencies.** core, logger.

**Best practices.** Repository pattern; no raw queries outside db; commit to event log first; forward-only migrations.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.

> **Status (2026-10-12): not started.** This package has no source yet, so it has no
> `typecheck`/`test` scripts. With them, `npm run typecheck` and `npm run test` at the
> repo root failed on an empty folder. Add the scripts back with the first `src/index.ts`.
