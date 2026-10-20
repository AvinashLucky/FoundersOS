# packages/auth — authN/Z

**Purpose.** Identity, sessions, workspace-scoped RBAC, policies, key vault access.

**Responsibilities.** Sign-in, verify, authorize, switch workspace.

**Dependencies.** core, db.

**Best practices.** Authorize in application layer; server-enforced tenancy (RLS); rotating sessions; never trust client IDs.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
