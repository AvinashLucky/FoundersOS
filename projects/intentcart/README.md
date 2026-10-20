# IntentCart

From browsing catalog pages to completing a purchase mission with merchant economics visible.

Mobile purchase missions and merchant execution.

| | |
|---|---|
| Product | 05 of 10 — Intent-Based Commerce + Merchant Agent Gateway |
| Kind | Mobile app (Expo) + API |
| Build order | #4 |
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
# 1 · backend  (API on http://localhost:4105)
cd backend
cp ../.env.example .env     # fill in DATABASE_URL and GEMINI_API_KEY
npm install
npm run dev

# 2 · frontend
cd ../frontend
npm install
npm run dev        # Expo on port 5105 — open with Expo Go or an emulator
```

## Standalone by design

This project depends on nothing outside its own folder. Copy it anywhere, install, and it
runs — FounderOS is the place it was built, not something it needs.
