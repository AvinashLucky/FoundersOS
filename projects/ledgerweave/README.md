# LedgerWeave

From monthly document chasing to an always-current finance exception queue.

Continuous reconciliation and close readiness.

| | |
|---|---|
| Product | 03 of 10 — Continuous Finance Close & Cash Operations |
| Kind | Web app + API |
| Build order | #1 |
| Status | **Planned — not built yet.** There is no code in this folder. |

## What's here

| Path | What it is |
|---|---|
| `details/brief.md` | The product as the roadmap defines it: workflow, buyer, proof, tests, exclusions |
| `details/prompts.md` | Prompt A (plan) → B (build) → C (release audit) |
| `CLAUDE.md` | Binding rules for anyone (human or AI) building this project |
| `project.json` | Manifest FounderOS reads once the project is added to a workspace |
| `.env.example` | Every environment variable the apps will read |

## How it gets built

Open **this folder** in your coding agent and follow `CLAUDE.md` §4:
research → Prompt A (plan, approved by you) → Prompt B (build) → Prompt C (release audit).

## How it will run (once built)

Prerequisites: Node.js 20+, PostgreSQL (local, Docker, or a hosted free tier), and a
Gemini API key from https://aistudio.google.com/apikey — the Google AI Pro app
subscription is a different thing and doesn't include API quota.

```bash
# 1 · backend  (API on http://localhost:4103)
cd backend
cp ../.env.example .env     # fill in DATABASE_URL and GEMINI_API_KEY
npm install
npm run dev

# 2 · frontend
cd ../frontend
npm install
npm run dev        # → http://localhost:5103
```

## Standalone by design

This project depends on nothing outside its own folder. Copy it anywhere, install, and it
runs — FounderOS is the place it was built, not something it needs.
