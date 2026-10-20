---
title: Release Notes
source: event-fed
owner: release
lastReviewed: 2026-06-28
status: seed
---

# Release Notes

Versioned changelog, appended on release events.

### Unreleased
- Foundation: monorepo + database design + docs system.
- **Sprint 1 · Projects (UI/UX):** projects list/create/open screens, adaptive theming on open,
  Redux UI slice + React Query data hooks, providers wired, in-memory adapter (backend pending).
- **Phases 2-3 (full-stack):** cookie auth + workspace scoping; project workspace + per-project memory notes.
- **Phase 4 (full-stack):** Model Router (Echo offline + Claude adapter, cheapest-capable + fallback),
  4-department agent run → one answer with cost, runs persisted + decision written to memory.
- **Flagship addons:** Analytics Overview (activity + spend + spend-by-model), per-run cost intelligence.
- **Phase 5 (full-stack):** Visual memory — capture screenshots (client-resize) into a project's
  visual record with captions + gallery; assets repo + API (object-storage ready).
- **Hardening:** switched server id generation to node:crypto; full syntax verification of all server/data files.
