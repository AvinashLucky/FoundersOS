---
title: FounderOS Documentation
owner: architecture-board
lastReviewed: 2026-06-28
---

# FounderOS — Documentation

Every project automatically carries its documentation, and these docs **evolve as the
project grows**. This folder is the human-readable mirror of the system's own memory.

## Index

| # | Doc | Source type |
|---|-----|-------------|
| 01 | [Business Vision](01-business-vision.md) | curated ← Product Bible |
| 02 | [Product Requirements](02-product-requirements.md) | curated |
| 03 | [Architecture](03-architecture.md) | curated ← Master Architecture |
| 04 | [Database](04-database.md) | curated ← Step 6 Foundation |
| 05 | [API](05-api.md) | generated + curated |
| 06 | [UI Design](06-ui-design.md) | curated ← Strata |
| 07 | [Components](07-components.md) | generated ← packages/ui |
| 08 | [Project Decisions (ADR)](08-project-decisions.md) | event-fed |
| 09 | [Meeting Notes](09-meeting-notes.md) | curated |
| 10 | [Development Logs](10-development-logs.md) | event-fed |
| 11 | [Release Notes](11-release-notes.md) | event-fed |
| 12 | [Known Issues](12-known-issues.md) | curated |
| 13 | [Roadmap](13-roadmap.md) | curated |
| 14 | [Testing Reports](14-testing-reports.md) | generated |
| 15 | [Deployment Guide](15-deployment-guide.md) | curated |
| 16 | [Environment Guide](16-environment-guide.md) | curated |
| 17 | [AI Prompt Library](17-ai-prompt-library.md) | generated ← packages/prompts |
| 18 | [Memory Archive](18-memory-archive.md) | event-fed |

## How these evolve

1. **Generated** (05, 07, 14, 17) — built from source by `tooling/` scripts in CI; code & docs can't drift.
2. **Event-fed** (08, 10, 11, 18) — appended from the same event log that powers project memory.
3. **Curated** (the rest) — human-owned via PRs; `npm run docs:check` flags stale or past-review files.

Each file carries front-matter `{ source, owner, lastReviewed }`. Diagrams live in `assets/` as source (Mermaid/SVG) so they diff.
