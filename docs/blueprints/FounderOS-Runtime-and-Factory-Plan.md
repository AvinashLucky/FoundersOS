# FounderOS Runtime + Product Factory — plan (2026-10-16)

## 1 · How projects live inside FounderOS

- **Registered, not nested.** Every product stays in `projects/<slug>/` with its own
  `project.json`. FounderOS *registers* it (it already does, through *Built projects*);
  it never becomes a FounderOS workspace. That keeps "take your code and leave" true.
- **One download, many projects.** Use **pnpm** inside `projects/`. pnpm keeps one global
  store and hard-links packages into each project, so 10 projects ≈ one copy of React on
  disk. Each project still has its own `node_modules` and still ejects cleanly. Free.
- **Open the app inside FounderOS.** The project runner starts a project on its own port
  (`51NN` / `41NN`). A *Preview* tab shows it in a frame next to the agents, with live
  logs, test results and screenshots.

## 2 · Runtime (what Claude/Codex do, scoped to `projects/` only)

| Stage | Build | Free? |
|---|---|---|
| R1 Runner | install · test · dev · build per project, live logs over SSE, port check | yes |
| R2 Sandbox | each run inside a Docker container mounted on that project folder only; command allowlist; no delete/force-push/reset | yes: Docker Engine is free; Docker Desktop is free for personal use and small businesses (check the licence terms) |
| R3 Browser tool | Playwright: open, click, screenshot, check the five states | yes |
| R4 MCP client | official MCP SDK; connect filesystem (project-scoped), Playwright, GitHub | yes |
| R5 Tool loop | model asks for a tool → policy check → run → result back; human approval for file writes; receipt per call | yes (uses your free keys) |

## 3 · Hosting and "our bots maintain it"

- **Client takes the code:** the eject check proves it runs anywhere. They deploy it
  themselves, or we hand over a deploy guide.
- **We host it:** run **Coolify** (open-source, self-hosted, free software), a
  Vercel/Heroku-style panel, on one server. It gives push-to-deploy, Docker, SSL, databases
  and backups. Start on a free VM (Oracle Always Free, when capacity allows) and move to a
  paid VM (~₹500–1,500/month) once a client pays.
- **Kubernetes: not now.** It only pays off at dozens of services. Docker + Coolify covers
  the first 20–50 client apps.
- **Maintenance bots:**
  - GitHub Actions (free minutes on private repos) for tests and dependency updates.
  - An uptime monitor (free tier).
  - The FounderOS agent opens a pull request for each fix. A human merges.
  - Billing: the client pays hosting at cost plus a monthly maintenance fee.

## 4 · Product factory: speed without losing quality

"7 projects in 7 days" isn't realistic at Gati's quality bar (Gati took 6 cycles).
What *is* realistic once the factory exists: **one small, sellable product every 2–3 days.**

**Week 1 (the factory itself):**
1. A starter kit, extracted from Gati: auth, roles, data store, API seam, five states,
   tests, Docker, CI, README.
2. Runner R1 + browser tool R3.
3. design-director in the loop (3 directions → tokens).
4. Deploy recipe (Coolify or Railway).

**After week 1:** each product = brief (1 h) → research DNA (2 h) → 3 build cycles on the
starter kit → verify → listing.

## 5 · What big service companies build, and our simpler, repeatable versions

| Their work (TCS / Infosys / Google-type) | Our productised version for local and mid-size clients |
|---|---|
| Legacy modernisation | "Old website/app → fast modern app" package |
| CRM / ERP implementation | Lead + WhatsApp + follow-up mini-CRM for one niche |
| Cloud migration + managed services | Coolify hosting + maintenance retainer |
| Enterprise search / AI assistants | "AI assistant on your company documents" (RAG) |
| Analytics & BI | One-page live dashboard on the client's existing data |
| Testing as a service | Automated QA report (Playwright) for any website |
| Flagship platforms | One public showcase product (Gati or RaKeGa) to attract clients |

## 6 · Order

1. Runner R1.
2. Browser R3.
3. pnpm switch for `projects/`.
4. Starter kit.
5. Sandbox R2.
6. MCP R4.
7. Tool loop R5.
8. Coolify hosting.

RaKeGa and the service packages above are built *on* the starter kit as soon as it exists.

## 7 · Stacks and design packs (added 2026-10-16)

**Starter kits** are added one at a time; each one is declared in `project.json` as `"stack"`:

| Kit | Stack | Good for |
|---|---|---|
| web-react | React + Vite + Express + TypeScript (from Gati) | dashboards, internal tools |
| web-next | Next.js (App Router) | SEO sites, SaaS, RaKeGa |
| web-static | HTML + CSS + JS | landing pages, fast client sites |
| java-spring | Spring Boot + React | enterprise clients, banks, colleges |
| web-vue / web-angular | Vue 3 / Angular | clients already on those stacks |

**Design packs:**
- design-director already outputs CSS variables. Every stack can read CSS variables, so
  a *reskin* swaps one `tokens.css` file plus the layout skeleton.
- A pack holds:
  - colour themes
  - type pairings
  - layout skeletons: dashboard, landing, store, course, chat
  - motion level
  - an optional 3D layer (Three.js / React Three Fiber)
- One "Design agent" picks a pack from the brief. The founder can switch packs, and the
  contrast checks run again on every switch.

**Research boundary (unchanged):**
- We study public pages, docs, help centres, engineering blogs and our own logged-in use.
- We never use pirated content, leaked or purchased personal data, or any company's hidden
  APIs or keys.
