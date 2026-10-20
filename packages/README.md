# packages/ — shared platform core

**Purpose.** Versioned internal libraries holding ALL business logic. Each is an independent clean-architecture module with one barrel.

**Responsibilities.** Domain contracts, use-cases, infrastructure adapters, shared UI.

**Dependencies.** Lower packages + core only; never apps/services.

**Best practices.** Import only via index.ts barrels; dependency direction strictly inward.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
