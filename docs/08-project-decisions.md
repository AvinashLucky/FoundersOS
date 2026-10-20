---
title: Project Decisions (ADR Log)
source: event-fed
owner: architecture-board
lastReviewed: 2026-06-28
status: seed
---

# Project Decisions (ADR Log)

Architecture Decision Records — one entry per major decision, appended from the **same event log**
that feeds the Decision Ledger. Format per entry: _Decision · Reason · Alternatives · Trade-offs ·
Impact · Review date · Status (accepted/superseded→link)._

### ADR-0001 · Hybrid Mongo + Postgres datastore
**Decision:** Mongo for flexible memory docs; Postgres+pgvector for embeddings & graph.
**Reason:** right tool per workload, seam hidden by the access layer. **Status:** accepted.

### ADR-0002 · npm workspaces monorepo (plain)
**Decision:** plain npm workspaces over Turborepo/Nx for now. **Reason:** simplest; add caching only
if build times demand. **Status:** accepted; revisit when build > a few minutes.
