# services/gateway — optional API/edge gateway

**Purpose.** Reserved. Only built if apps/web route handlers outgrow their home.

**Responsibilities.** Auth, rate-limit, routing, SSE if split from web.

**Dependencies.** packages/auth, core, logger.

**Best practices.** Do not build prematurely; prefer web route handlers until proven insufficient.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
