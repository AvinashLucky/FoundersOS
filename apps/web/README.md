# FounderOS

> Your virtual AI software company — an elite org, calm on one surface.

This is the React/Next.js implementation of FounderOS, built on the **Strata** design
language and a clean, modular architecture. It is not a dashboard, an admin panel, or a
generic SaaS app — it's a *command surface* where intent becomes outcome.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev      # → http://localhost:3000
```

The app runs without any API keys (providers are stubbed behind the Model Router seam).

## What's here

- **Strata design system** — `src/shared/ui`, `src/shared/config/themes.ts`, `src/app/globals.css`.
  Three typographic voices (company = serif · system = sans · machine = mono), an 8pt rhythm,
  depth-not-shadow surfaces, and an **adaptive theme system**: one substrate, seven project
  identities (FinTech, Healthcare, Creative, Media, E-commerce, Developer, Founder) that re-tune
  every accent live via CSS variables.
- **The Command Surface** — `src/features/command-surface`. The flagship screen: one intent line →
  agent collaboration animation → one executive answer with reasoning, cost, and reversibility →
  the Founder Intelligence brief, with a live theme switcher.
- **Modular engines** — `src/modules/*`, each its own clean-architecture slice:
  Model Router (AI provider abstraction), Agent Engine (the 16-agent roster + gates),
  Memory Engine, Knowledge Graph, **Founder Intelligence Layer** (the third pillar:
  Learning Tracker, Decision Journal, Productivity Insights, Knowledge Reuse, Weekly Brief).

## Design principles (Strata)

Calm by default, alive on intent · one focal plane · depth over density · motion is meaning ·
progressive disclosure · three voices one system · adaptive identity / constant substrate ·
reversible & legible. Full rationale and the interactive demo: `../FounderOS-Design-Showcase.html`.

## Architecture

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the layer rule, folder structure, module
contracts, the AI provider abstraction, state philosophy, queues, security, testing, and CI/CD.

## The three pillars

1. **Build software faster** — the agent org (Product → Engineering → QA → Security).
2. **Remember & compound** — Memory Engine + Knowledge Graph + Design DNA.
3. **Improve the founder** — the Founder Intelligence Layer (`src/modules/founder-intelligence`).

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `format` · `test`

---

FounderOS · Strata v1.0 — built to feel right in ten years, not just today.
