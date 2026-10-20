---
title: Database
source: curated ← FounderOS-Step6-Foundation
owner: database-architect
lastReviewed: 2026-06-28
status: seed
---

# Database

> Canonical: \`/FounderOS-Step6-Foundation.md\` §11–14.

**Hybrid:** MongoDB (flexible docs) + Postgres/pgvector (embeddings, graph, RLS) + object storage +
event log. Collections: workspaces, users, projects, runs, memory_items, decisions, lessons, assets,
timelines, design_dna, radar_signals, prompts, cost_entries, founder_intelligence.
Index strategy and relationships: see Foundation §13–14. Migrations are forward-only and logged here.
