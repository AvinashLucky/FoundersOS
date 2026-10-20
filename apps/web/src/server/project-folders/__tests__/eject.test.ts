import { rmSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseEnvExample, verifyEject } from "../eject";
import { manifest, tempProjectsRoot, type TempRoot } from "./fixtures";

let t: TempRoot;
beforeEach(() => {
  t = tempProjectsRoot();
});
afterEach(() => t.cleanup());

const failedChecks = async (dir: string, m = manifest()) =>
  (await verifyEject(dir, m)).checks.filter((c) => !c.ok).map((c) => c.id);

describe("verifyEject", () => {
  it("passes a clean, standalone project", async () => {
    const dir = t.cleanProject("demo");
    const report = await verifyEject(dir, manifest());
    expect(report.ok).toBe(true);
    expect(report.violations).toEqual([]);
    expect(report.filesScanned).toBeGreaterThan(0);
  });

  it("catches an @founderos/* import", async () => {
    const dir = t.cleanProject("demo");
    t.write("demo/src/bad.ts", 'import { logger } from "@founderos/logger";\n');
    expect(await failedChecks(dir)).toContain("no-founderos-imports");
  });

  it("catches a relative import that escapes the project", async () => {
    const dir = t.cleanProject("demo");
    t.write("demo/src/bad.ts", 'import x from "../../../apps/web/src/server/http";\n');
    expect(await failedChecks(dir)).toContain("no-escaping-imports");
  });

  it("catches workspace: and out-of-project file: dependencies", async () => {
    const dir = t.cleanProject("demo");
    t.write(
      "demo/package.json",
      JSON.stringify({ name: "demo", dependencies: { a: "workspace:*", b: "file:../../packages/core" } }),
    );
    const report = await verifyEject(dir, manifest());
    expect(report.violations.filter((v) => v.check === "no-workspace-deps")).toHaveLength(2);
  });

  it("allows a file: dependency that stays inside the project", async () => {
    const dir = t.cleanProject("demo");
    t.write("demo/package.json", JSON.stringify({ name: "demo", dependencies: { ui: "file:./packages/ui" } }));
    expect(await failedChecks(dir)).not.toContain("no-workspace-deps");
  });

  it("flags undocumented env but accepts runtime and commented-out vars", async () => {
    const dir = t.cleanProject("demo");
    t.write(
      "demo/src/env.ts",
      "const a = process.env.NODE_ENV; const b = process.env.OPTIONAL_FLAG; const c = import.meta.env.SECRET_THING;\n",
    );
    const report = await verifyEject(dir, manifest());
    const envIssues = report.violations.filter((v) => v.check === "env-documented");
    expect(envIssues).toHaveLength(1);
    expect(envIssues[0]?.message).toContain("SECRET_THING");
  });

  it("flags FounderOS env vars even when documented", async () => {
    const dir = t.cleanProject("demo");
    t.write("demo/.env.example", "API_KEY=\nFOUNDEROS_TOKEN=\n");
    t.write("demo/src/env.ts", "const a = process.env.FOUNDEROS_TOKEN;\n");
    expect(await failedChecks(dir)).toContain("no-founderos-env");
  });

  it("requires a standalone README", async () => {
    const dir = t.cleanProject("demo");
    rmSync(path.join(dir, "README.md"));
    expect(await failedChecks(dir)).toContain("readme");
  });

  it("ignores node_modules and build output", async () => {
    const dir = t.cleanProject("demo");
    t.write("demo/node_modules/pkg/index.js", 'require("@founderos/core");\n');
    t.write("demo/dist/server.cjs", 'require("../../../apps/web");\n');
    expect((await verifyEject(dir, manifest())).ok).toBe(true);
  });

  it("reports a missing app package.json", async () => {
    const dir = t.cleanProject("demo");
    const split = manifest({
      layout: "split",
      apps: {
        frontend: { dir: ".", install: "npm install", dev: "npm run dev", port: 4310 },
        backend: { dir: "backend", install: "npm install", dev: "npm run dev", port: 4311 },
      },
    });
    expect(await failedChecks(dir, split)).toContain("apps-present");
  });
});

describe("parseEnvExample", () => {
  it("reads KEY= lines, commented keys and export prefixes", () => {
    const names = parseEnvExample('A=1\n# B=\nexport C="x"\n# just a comment\nlower=1\n');
    expect([...names].sort()).toEqual(["A", "B", "C"]);
  });
});
