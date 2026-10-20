# FounderOS — Engineering Standard

> The standing rules for every implementation session. Treat documentation as a
> first-class deliverable equal to source. Code and docs never drift.

This is the company-level bar. It applies to every feature, every session, forever.

## 1 · Non-negotiable rules

- **Production-ready only.** No prototype code, no placeholder logic, no `TODO` comments. Every function ships.
- **Reuse before create.** Search existing packages/components/utilities first; never duplicate logic.
- **Follow the approved architecture.** The Step 1–7 documents are the source of truth. Do not redesign without explaining a critical issue and the trade-offs first.
- **Clean, modular architecture.** Dependencies point inward (`apps → packages → core`); cross-package imports only via `index.ts` barrels.
- **Optimize for all axes:** readability, scalability, maintainability, performance, accessibility, security, cost.
- **Explain important decisions** before implementing; record them in the Decision Ledger.

## 2 · Definition of Done (every feature)

A feature is done only when: it **works** (runs, deployable behind a flag) · **tests** are green (unit + integration; e2e for UI) · **docs** are updated (the 10-doc set + the living docs in §4) · **architecture** deltas recorded · **memory/decisions** written · **tech debt** reviewed and logged. See `FounderOS-Step7-MVP-Roadmap.md` §1.

## 3 · The per-feature 10-doc set

Every feature/module carries its own documentation folder
(`docs/features/<feature>/`) containing exactly these files:

`README.md` · `Architecture.md` · `API.md` · `Database.md` · `Testing.md` ·
`Developer-Notes.md` · `Prompt-History.md` · `Decision-Log.md` · `Known-Issues.md` ·
`Implementation-Checklist.md`

A ready-to-copy template lives in `docs/_templates/feature/`.

## 4 · The living docs to update every session

Whenever code is generated, update — in the same change:

`docs/03-architecture.md` · `docs/05-api.md` · `docs/04-database.md` ·
`docs/07-components.md` · per-folder `README.md` (if structure changed) ·
`docs/13-roadmap.md` (status) · `docs/11-release-notes.md` (changelog) ·
`docs/08-project-decisions.md` (Decision Ledger) · reusable-knowledge notes ·
`docs/17-ai-prompt-library.md` (Prompt History) · `docs/PROGRESS.md` (Implementation Progress).

CI (`npm run docs:check`) fails the build when generated docs are stale or curated docs are past review.

## 5 · End-of-session Executive Review (required)

Every implementation session ends with a one-screen review from each internal role:
**CTO · Architecture · UX · Security · QA · Performance · Cost** — each stating: what shipped, the risk, and the call. Then **recommend the next module** per the roadmap.

## 6 · Conventions (quick reference)

- TypeScript strict; `noUncheckedIndexedAccess` on. Type-only imports marked.
- Naming: components `PascalCase`, hooks `useX`, files match export, barrels `index.ts`.
- No default exports except Next route files and React screens.
- Errors: typed `DomainError` + codes; never throw strings; never swallow errors.
- State: server→TanStack Query, ephemeral→local, global UI→Redux Toolkit.
- Security: authorize in the application layer; never trust the client; never log secrets/PII/prompts.
- Tests: pure logic unit-tested; data paths integration-tested; UI happy-path e2e.
