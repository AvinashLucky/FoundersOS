import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ProjectManifest } from "@/server/validation/project-manifest.schema";

/**
 * Test fixtures: real temporary `projects/` trees on disk, so the registry and
 * eject verifier are exercised against a filesystem — never the network.
 */
export function manifest(overrides: Partial<ProjectManifest> = {}): ProjectManifest {
  return {
    schemaVersion: 1,
    id: "prj_demo",
    name: "Demo",
    domain: "developer",
    summary: "A clean, ejectable project.",
    layout: "single",
    apps: { frontend: { dir: ".", install: "npm install", dev: "npm run dev", port: 4310 }, backend: null },
    runtime: { node: ">=18.18", packageManager: "npm" },
    client: { name: "", contact: "" },
    delivery: { status: "in-progress", pricedUsd: null, deliveredAt: null },
    provenance: { blueprintRunId: null, createdAt: "2026-10-01T00:00:00Z", detailsDir: "details" },
    eject: { standalone: true, verifiedAt: null },
    ...overrides,
  };
}

export interface TempRoot {
  root: string;
  /** Write a file relative to the root, creating folders as needed. */
  write(rel: string, content: string): void;
  /** Create a clean project folder that passes every eject check. */
  cleanProject(slug: string, m?: ProjectManifest): string;
  cleanup(): void;
}

export function tempProjectsRoot(): TempRoot {
  const root = mkdtempSync(path.join(tmpdir(), "fos-projects-"));
  const write = (rel: string, content: string) => {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content, "utf8");
  };
  return {
    root,
    write,
    cleanProject(slug, m = manifest()) {
      write(`${slug}/project.json`, JSON.stringify(m, null, 2));
      write(`${slug}/package.json`, JSON.stringify({ name: slug, dependencies: { react: "^19.0.0" } }));
      write(`${slug}/README.md`, "# Demo\n\nnpm install && npm run dev\n");
      write(`${slug}/.env.example`, "API_KEY=\n# OPTIONAL_FLAG=true\n");
      write(`${slug}/src/main.ts`, 'import { x } from "./lib/x";\nconst k = process.env.API_KEY;\nconsole.log(x, k);\n');
      write(`${slug}/src/lib/x.ts`, "export const x = 1;\n");
      return path.join(root, slug);
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}
