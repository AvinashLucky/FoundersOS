# packages/ai-providers — provider abstraction + Model Router

**Purpose.** Model sovereignty: one AIProvider port + the router; Claude/Gemini/OpenAI/local behind it.

**Responsibilities.** Score & route per task, fallback, cost accounting, adapter contract.

**Dependencies.** packages/core.

**Best practices.** Cheapest-capable default; escalate on failure; new provider = adapter + registry entry, zero logic change.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
