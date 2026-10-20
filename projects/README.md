# projects/ — the products, built standalone

Every folder here is a **complete, independent product**. None of them is part of
FounderOS's npm workspaces, none imports FounderOS code, and each one runs from a bare
copy with FounderOS deleted. They live here so they are easy to find, not because they
need FounderOS.

## How we work (projects-first)

1. **Build each product directly.** Open the product's folder in your coding agent;
   its own `CLAUDE.md` is the rulebook. Engines: Gemini (your API key) plus any free
   OpenAI-compatible tier (Groq, OpenRouter `:free`, xAI Grok).
2. **FounderOS keeps evolving in parallel**, reshaped by what each real build teaches us.
3. **When a product is done**, FounderOS absorbs it: Projects → *Built projects* →
   *Add to workspace* → *Run eject check*. The eject receipt is the proof of no lock-in.

## The ten products + Gati Rides

| Build order | # | Project | Folder | Kind | Frontend | Backend | Status |
|---|---|---|---|---|---|---|---|
| — | — | Gati Rides | `gati-rides/` | Single web app | 3001 | (same) | v1 ready · paused 2026-10-12 |
| — | 11 | **RaKeGa** | `rakega/` | Web + API + live + video | 5111 | 4111 | planned · active |
| 1 | 03 | LedgerWeave | `ledgerweave/` | Web + API | 5103 | 4103 | planned |
| 2 | 08 | VoxRelay | `voxrelay/` | Web + voice + API | 5108 | 4108 | planned |
| 3 | 01 | LumaPath | `lumapath/` | Web + API | 5101 | 4101 | planned |
| 4 | 05 | IntentCart | `intentcart/` | Mobile (Expo) + API | 5105 | 4105 | planned |
| 5 | 06 | MealMesh | `mealmesh/` | Mobile (Expo) + API | 5106 | 4106 | planned |
| 6 | 04 | VaultRelay | `vaultrelay/` | Mobile (Expo) + API | 5104 | 4104 | planned |
| 7 | 02 | WardWeave | `wardweave/` | Web + API | 5102 | 4102 | planned |
| 8 | 07 | SourceWeave | `sourceweave/` | Web + API | 5107 | 4107 | planned |
| 9 | 09 | FleetLens | `fleetlens/` | Web + API + ML | 5109 | 4109 | planned |
| 10 | 10 | ProofGate | `proofgate/` | Web + API | 5110 | 4110 | planned |

**Port rule:** product number `NN` → frontend `51NN`, backend `41NN`. FounderOS is 3000,
Gati Rides 3001. Every product can run at the same time without clashes.

**Build order** follows `docs/blueprints/FounderOS-Product-Factory-Plan.md` §6: simplest
shape first (web only, clear correctness rules), mobile once the web pattern is proven,
ProofGate last because it evaluates the others.

## What every product folder contains

| File | Job |
|---|---|
| `CLAUDE.md` | The binding rulebook for building this product (stack, eject invariants, models, standards, definition of done) |
| `details/brief.md` | The product as the roadmap defines it, with the reference links |
| `details/prompts.md` | Prompt A (plan) → B (build) → C (release audit) |
| `project.json` | The manifest FounderOS reads; `delivery.status` tracks progress |
| `.env.example` | Every variable the apps read; nothing secret in frontend variables |
| `README.md` | How to run it standalone |

`frontend/` and `backend/` don't exist yet — they are created when Prompt B starts, so no
folder ever holds empty scaffolding.

## Housekeeping

- `.owners.json` (created by FounderOS on first *Add to workspace*) maps folders to
  FounderOS workspaces. It sits here, outside every product, so ejected copies stay clean.
- Each product has its own `node_modules`; that is correct here. `mono-doctor` only
  checks FounderOS's workspaces and ignores this folder.
- Research from the Product-Research-Engine goes into each product's
  `details/research/` once the crawler's 7-run gate has passed
  (`Product-Research-Engine/gate/README.md`).
