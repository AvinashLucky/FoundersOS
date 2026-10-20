# Feature: Projects (Sprint 1)

> UI/UX: **done** (built by Claude). Backend: **your task**. This is the spec you implement.

## 1 · What this feature does
Create, list, and open projects. Opening a project re-themes the whole app to that
project's domain identity. Each project will own its own memory and AI company later.

## 2 · Where the code lives (UI — already built)
```
apps/web/src/features/projects/
├─ ProjectsScreen.tsx              # the screen (list + states)
├─ components/ProjectCard.tsx      # one project card
├─ components/CreateProjectDialog  # create form (name + domain)
├─ projectsSlice.ts               # Redux: UI state (active project, dialog open)
├─ hooks.ts                       # React Query: useProjects / useCreateProject
├─ api.ts                         # ← THE SEAM you plug your backend into
└─ types.ts                       # Project shape = the frontend⇄backend contract
apps/web/src/app/projects/page.tsx # route /projects
apps/web/src/shared/store/         # Redux store + typed hooks
apps/web/src/shared/providers/AppProviders.tsx  # Redux + Query + Theme
```
Right now `api.ts` uses an **in-memory adapter**, so the UI runs today with no backend.
When your API is ready, change one line in `api.ts`: `new LocalProjectsApi()` → `new HttpProjectsApi()`.

## 3 · The contract (don't change the shape)
Your API must return objects matching `types.ts`:
```ts
Project = { id, name, domain, status: "active"|"archived", summary, createdAt, updatedAt }
// domain ∈ founder | fintech | health | creative | media | commerce | developer
CreateProjectInput = { name, domain, summary? }
```

## 4 · Backend to build (your task)

### Database — `projects` collection (MongoDB)
Fields: `_id`(→id), `workspaceId`, `name`, `domain`, `status`, `summary`, `stage`,
`createdAt`, `updatedAt`, `schemaVersion`. (See `docs/blueprints/FounderOS-Step6-Foundation.md` §12.)
Index: `{ workspaceId: 1, status: 1, updatedAt: -1 }`.

### API — `/api/v1/projects` (Next.js route handlers)
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/v1/projects` | — | `Project[]` (active first) |
| POST | `/api/v1/projects` | `CreateProjectInput` | `Project` (201) |
| GET | `/api/v1/projects/:id` | — | `Project` |

Rules: validate the body with **zod**; scope every query to the caller's `workspaceId`
(comes from the session — Sprint 2); return the typed `Project` shape; on bad input return
`400` with `{ code, message }`.

### Suggested files (your code)
```
apps/web/src/app/api/v1/projects/route.ts        # GET list, POST create
apps/web/src/app/api/v1/projects/[id]/route.ts   # GET one
packages/db/...                                   # mongo client + projects repository
```

## 5 · How the UI binds to your backend
1. UI calls `useProjects()` / `useCreateProject()` (React Query) →
2. those call `projectsApi` in `api.ts` →
3. `HttpProjectsApi` fetches `/api/v1/projects` →
4. your route handler reads/writes MongoDB and returns `Project` JSON.

No UI changes needed when you switch the adapter — that's the point of the seam.

## 6 · Done when
GET/POST work against MongoDB; the in-memory adapter is swapped for HTTP; creating a
project persists and appears after refresh; bad input returns 400. Tests: a route test +
a repository test (see `ENGINEERING.md`).

## 7 · Decisions
- **Project list lives in React Query, not Redux** — server data has one home (the server);
  Redux holds only UI state (which project is active, is the dialog open). This avoids
  two-copies-out-of-sync bugs.
- **Adapter seam in `api.ts`** — lets the UI ship before the backend and swap with one line.
