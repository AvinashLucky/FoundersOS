/**
 * Branded identifier types. A WorkspaceId is structurally a string but the brand
 * stops you from accidentally passing a ProjectId where a WorkspaceId is required —
 * the compiler enforces correctness with zero runtime cost.
 */
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type WorkspaceId = Brand<string, "WorkspaceId">;
export type UserId = Brand<string, "UserId">;
export type ProjectId = Brand<string, "ProjectId">;
export type RunId = Brand<string, "RunId">;
export type MemoryId = Brand<string, "MemoryId">;
export type DecisionId = Brand<string, "DecisionId">;

/** Each entity's id prefix — single source of truth used by the id generator. */
export const ID_PREFIX = {
  workspace: "wsp",
  user: "usr",
  project: "prj",
  run: "run",
  memory: "mem",
  decision: "dec",
} as const;

export type IdPrefix = (typeof ID_PREFIX)[keyof typeof ID_PREFIX];
