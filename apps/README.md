# apps/ — deployable applications

**Purpose.** User-facing deployable apps. Today: `web` (Next.js). Apps compose packages; they hold no business logic.

**Responsibilities.** Routing, presentation, thin API route handlers, delegation to packages.

**Dependencies.** packages/* (ui, core types, auth client). Never depended on by packages.

**Best practices.** Server Components for reads; enqueue long work; feature-sliced organization.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
