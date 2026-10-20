# FounderOS — Post-Fable State & Gap Audit

**Date:** July 7, 2026 · Reviewed after your Fable session.

## What you added (verified working — 59/59 logic files valid TypeScript)

- Projects: **search, sort (Recent/A–Z), Active/Archived filter, archive/restore**, pagination.
- **⌘K command palette** (jump anywhere, create, sign out).
- **Toasts + optimistic updates** with rollback.
- **SSE streaming runs** — watch departments light up live.
- **Governed agent loop v2** — activation planning (only needed departments run), budget governor, ETHOS ethics clause, memory injection.
- **Idea Agent** — 5 scored sellable ideas (demand/effort/fit/monetization) with price + platforms.
- **Freelance Studio** (`/freelance`) — listings board + platform tracker (Gumroad/Contra/Fiverr).
- **Analytics** — 14-day spend trend, spend-by-model, recent runs.
- **Security** — signed session cookie, rate limiting, same-origin (CSRF) checks on mutations.

This is a genuinely impressive, coherent system. The core loop is real and end-to-end.

## Gaps vs the dream (prioritized) — the "missing things"

| # | Gap | What's there now | To reach the dream |
|---|-----|------------------|--------------------|
| 1 | **Live web/Google research** | Idea Agent uses model knowledge (or offline templates) | Add a search API (Serper/Bing/Tavily) + a Research service so the agent truly searches, cites competitors, growth signals, pros/cons — then documents them. |
| 2 | **Marketing / Reviews / Automation agents** | PM · Architecture · Design · QA+Security · CEO | Add a **Growth/Marketing** department (activates on sell/launch/pricing intents) + an explicit **Reviewer** pass. Feels like a fuller team. |
| 3 | **Deploy / publish** | Freelance Studio *tracks* where you posted | Auto-package (Storefront Export) + optional one-click deploy of built sites. |
| 4 | **Real hosting** | Runs locally; in-memory or your MongoDB | Deploy to Vercel + a managed MongoDB to have a live URL customers can reach. |
| 5 | **Real auth** | Dev email sign-in (secure cookie) | Magic-link / OAuth before real customers. |
| 6 | **Automated tests in CI** | Vitest suites exist | Wire GitHub Actions to run them on every push. |

## Straight answers to your questions

- **Can you launch / sell?** You can *use it to build and plan sellable projects today*, and sell those projects on Gumroad/Fiverr/Contra now. The **app itself** isn't a hosted product for paying customers yet — it needs deploy + real DB + real auth (gaps 4–5). Small, known steps.
- **Is one idea → start, all routed, all useful?** Yes. Every feature is wired and purposeful; no dead ends. The workflow map documents each click.
- **Does the agent feel like a real team?** Meaningfully yes — a COO plans, specialist departments run in parallel and stream live, a CEO synthesizes, with a budget governor + ethics. Adding gap #2 makes it feel like a *fuller* company (marketing/reviews).
- **Google research agent?** Partially — ideas are generated and scored, but true live web search is gap #1 (needs a search API key + integration).
- **Claude Code handoff?** Great plan. Have it read `ENGINEERING.md` → `PROJECT-STRUCTURE.md` → `docs/CROSS-CHECK-AUDIT.md` → the target feature, then continue in the same patterns and update docs as it goes.

## Recommended next (in order)
1. **Live Research agent** (gap #1) — your headline dream feature.
2. **Growth/Marketing + Reviewer agents** (gap #2) — the fuller team feel.
3. **Deploy** (gaps 4–5) — a live URL + real auth so it's launch-ready.
