# plugins/ — extensibility

**Purpose.** First-party + future plug-in modules contributing routes/features/agents/model-adapters/radar-sources.

**Responsibilities.** Extend the platform at stable extension points without core refactor.

**Dependencies.** core + public package barrels only.

**Best practices.** Typed manifest + declared permissions; sandboxed; failing plugin degrades to disabled, never crashes host.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
