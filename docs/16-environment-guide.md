---
title: Environment Guide
source: curated
owner: devops
lastReviewed: 2026-07-13
status: living
---

# Environment Guide

Local setup and environment variables.

```bash
cd apps/web
cp .env.example .env.local   # fill keys; the app runs with ZERO keys (Echo provider)
npm install
npm run dev                  # http://localhost:3000
```

## Model providers — the free-first ladder

The Model Router prefers the cheapest capable model. Free providers sit at
cost 0, so they win automatically when reachable; anything unreachable falls
back gracefully (a run never hard-fails).

| Provider | Env | Cost | What it unlocks |
|---|---|---|---|
| **Echo** (built-in) | — none — | $0 | Deterministic offline output; tests run on this |
| **Ollama** (local) | `OLLAMA_URL` (default `http://localhost:11434`), `OLLAMA_MODEL` (default `llama3.1`) | $0 | A real local model, no account. Install from ollama.com, then `ollama pull llama3.1` and keep `ollama serve` running |
| **Gemini free tier** | `GEMINI_API_KEY` (aistudio.google.com/apikey) | $0 | Hosted real models: `gemini-1.5-flash` (fast seats) + `gemini-1.5-pro` (CEO/frontier seats) |
| **Anthropic** | `ANTHROPIC_API_KEY` | paid | Claude haiku/sonnet/opus tiers |

**Verify a real run:** start Ollama (or set `GEMINI_API_KEY`) → `npm run dev` →
open a project → run "Design the onboarding flow". A real model's answer is
prose that varies run to run; the Echo fallback always produces the same
templated sentences. The side-channel shows which model actually served each
department. Note: `npm test` intentionally ignores all real providers (Echo
only) so suites stay deterministic.

## Other services

| Purpose | Env |
|---|---|
| Research agent (live web search) | `TAVILY_API_KEY` — offline fixture briefs without it |
| MongoDB persistence | `MONGODB_URI` — in-memory repositories without it |
| Session signing (production) | `AUTH_SECRET` |
| Run budget ceiling | `RUN_BUDGET_USD` (default 0.05) |

Env contract is `apps/web/.env.example`; never commit real `.env*`. Secrets via vault in production.
Planned for later phases: Postgres+pgvector, Redis (BullMQ workers), object storage.
