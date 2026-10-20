import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectInstall } from "../install";
import { createProjectFolderRegistry } from "../registry";
import { manifest, tempProjectsRoot, type TempRoot } from "./fixtures";

let t: TempRoot;
beforeEach(() => {
  t = tempProjectsRoot();
});
afterEach(() => t.cleanup());

const pkg = (deps: Record<string, string>, devDeps: Record<string, string> = {}) =>
  JSON.stringify({ name: "app", dependencies: deps, devDependencies: devDeps });
const installed = (rel: string) => t.write(`${rel}/package.json`, '{"name":"x"}');

describe("inspectInstall", () => {
  it("complete when the app's own node_modules holds every declared dependency", async () => {
    t.write("demo/package.json", pkg({ react: "^19.0.0", "@scope/ui": "1.0.0" }, { vitest: "^3.0.0" }));
    installed("demo/node_modules/react");
    installed("demo/node_modules/@scope/ui");
    installed("demo/node_modules/vitest");
    expect(await inspectInstall(path.join(t.root, "demo"))).toEqual({ state: "complete" });
  });

  it("not-installed when there is no node_modules at all", async () => {
    t.write("demo/package.json", pkg({ react: "^19.0.0" }));
    expect(await inspectInstall(path.join(t.root, "demo"))).toEqual({ state: "not-installed" });
  });

  it("regression · a package borrowed from a parent folder still counts as missing", async () => {
    // Gati Rides ran for weeks resolving express from FounderOS's root install.
    t.write("demo/package.json", pkg({ react: "^19.0.0", express: "^4.21.0" }));
    installed("demo/node_modules/react");
    installed("node_modules/express"); // the parent's install — must not count
    expect(await inspectInstall(path.join(t.root, "demo"))).toEqual({ state: "incomplete", missing: ["express"] });
  });

  it("unknown when package.json is unreadable", async () => {
    t.write("demo/package.json", "{ broken");
    expect((await inspectInstall(path.join(t.root, "demo"))).state).toBe("unknown");
  });

  it("never joins a malformed dependency name into a path", async () => {
    t.write("demo/package.json", pkg({ "../../escape": "1.0.0", react: "^19.0.0" }));
    installed("demo/node_modules/react");
    expect(await inspectInstall(path.join(t.root, "demo"))).toEqual({ state: "complete" });
  });
});

describe("registry status reports install state per app", () => {
  it("flags the incomplete app in a split project", async () => {
    const split = manifest({
      layout: "split",
      apps: {
        frontend: { dir: "frontend", install: "npm install", dev: "npm run dev", port: 4320 },
        backend: { dir: "backend", install: "npm install", dev: "npm run dev", port: 4321 },
      },
    });
    t.write("demo/project.json", JSON.stringify(split));
    t.write("demo/frontend/package.json", pkg({ react: "^19.0.0" }));
    installed("demo/frontend/node_modules/react");
    t.write("demo/backend/package.json", pkg({ express: "^4.21.0" }));

    const reg = createProjectFolderRegistry(t.root);
    await reg.claim("wsp_alpha", "demo");
    const status = await reg.status("wsp_alpha", "demo");
    expect(status?.apps.map((a) => [a.role, a.install.state])).toEqual([
      ["frontend", "complete"],
      ["backend", "not-installed"],
    ]);
  });
});
