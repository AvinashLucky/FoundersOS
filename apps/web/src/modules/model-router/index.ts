/**
 * Model Router — PUBLIC API (the only surface other modules may import).
 * Internals (infrastructure/providers, scoring) stay private behind this barrel.
 */
export type {
  AIProvider, ModelRecord, TaskSpec, Tier, Capability,
  CompletionRequest, CompletionResult, PrivacyClass,
} from "./domain/types";
export { ModelRouter } from "./application/ModelRouter";
export { ClaudeProvider } from "./infrastructure/providers/claude";
