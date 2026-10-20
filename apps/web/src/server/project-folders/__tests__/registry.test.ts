import { readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createProjectFolderRegistry, OwnersIndexError } from "../registry";
import { resolveInside } from "../paths";
import { manifest, tempProjectsRoot, type TempRoot } from "./fixtures";

const WS_A = "wsp_alpha";
const WS_B = "wsp_beta";

let t: TempRoot;
beforeEach(() => {
  t = tempProjectsRoot();
});
afterEach(() => t.cleanup());

describe("ProjectFolderRegistry — ownership & scoping", () => {
  it("lists a fresh folder as unclaimed, by slug and name only", async () => {
    t.cleanProject("demo");
    const listing = await createProjectFolderRegistry(t.root).list(WS_A);
    expect(listing.available).toBe(true);
    expect(listing.owned).toEqual([]);
    expect(listing.unclaimed).toEqual([{ slug: "demo", name: "Demo" }]);
  });

  it("claims a folder, then shows it as owned with copy-ready commands", async () => {
    t.cleanProject("demo");
    const reg = createProjectFolderRegistry(t.root);
    expect(await reg.claim(WS_A, "demo")).toBe("claimed");
    expect(await reg.claim(WS_A, "demo")).toBe("already-yours");

    const listing = await reg.list(WS_A);
    expect(listing.unclaimed).toEqual([]);
    const first = listing.owned[0];
    expect(first?.folder?.path).toBe("projects/demo");
    expect(first?.folder?.commands.map((c) => c.command)).toContain("cd projects/demo && npm run dev");
  });

  it("isolates workspaces: another workspace can neither see nor claim it", async () => {
    t.cleanProject("demo");
    const reg = createProjectFolderRegistry(t.root);
    await reg.claim(WS_A, "demo");

    expect(await reg.claim(WS_B, "demo")).toBe("owned-elsewhere");
    const listingB = await reg.list(WS_B);
    expect(listingB.owned).toEqual([]);
    expect(listingB.unclaimed).toEqual([]);
    expect(await reg.get(WS_B, "demo")).toBeNull();
    expect(await reg.status(WS_B, "demo")).toBeNull();
    expect(await reg.verifyEject(WS_B, "demo")).toBeNull();
  });

  it("keeps ownership outside the project folder so ejected copies stay clean", async () => {
    const dir = t.cleanProject("demo");
    await createProjectFolderRegistry(t.root).claim(WS_A, "demo");
    expect(readFileSync(path.join(t.root, ".owners.json"), "utf8")).toContain(WS_A);
    expect(readFileSync(path.join(dir, "project.json"), "utf8")).not.toContain(WS_A);
  });

  it("serialises concurrent claims — exactly one workspace wins", async () => {
    t.cleanProject("demo");
    const reg = createProjectFolderRegistry(t.root);
    const outcomes = await Promise.all([reg.claim(WS_A, "demo"), reg.claim(WS_B, "demo")]);
    expect(outcomes.filter((o) => o === "claimed")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "owned-elsewhere")).toHaveLength(1);
  });

  it("refuses to reset ownership when the owners index is corrupt", async () => {
    t.cleanProject("demo");
    t.write(".owners.json", "{ not json");
    await expect(createProjectFolderRegistry(t.root).claim(WS_B, "demo")).rejects.toBeInstanceOf(OwnersIndexError);
  });
});

describe("ProjectFolderRegistry — untrusted input", () => {
  it("rejects traversal and malformed slugs", async () => {
    t.cleanProject("demo");
    const reg = createProjectFolderRegistry(t.root);
    expect(await reg.claim(WS_A, "../demo")).toBe("not-found");
    expect(await reg.claim(WS_A, "Demo")).toBe("not-found");
    expect(await reg.get(WS_A, "..")).toBeNull();
  });

  it("lists an owned folder with a broken manifest as an error, not a crash", async () => {
    t.cleanProject("demo");
    t.write("demo/project.json", JSON.stringify({ ...manifest(), schemaVersion: 2 }));
    const reg = createProjectFolderRegistry(t.root);
    await reg.claim(WS_A, "demo");
    const entry = (await reg.list(WS_A)).owned[0];
    expect(entry?.folder).toBeNull();
    expect(entry?.error).toContain("schemaVersion");
  });

  it("reports degraded (available: false) when projects/ is missing", async () => {
    const reg = createProjectFolderRegistry(path.join(t.root, "does-not-exist"));
    expect(await reg.list(WS_A)).toEqual({ available: false, owned: [], unclaimed: [] });
    expect(await createProjectFolderRegistry(null).list(WS_A)).toEqual({ available: false, owned: [], unclaimed: [] });
  });

  it("resolveInside never lets a path escape its base", () => {
    expect(resolveInside("/p/root", "app")).toBe(path.resolve("/p/root/app"));
    expect(resolveInside("/p/root", "../other")).toBeNull();
    expect(resolveInside("/p/root", "/etc/passwd")).toBeNull();
  });
});

describe("ProjectFolderRegistry — status & eject", () => {
  it("probes ports: running when something listens, stopped otherwise", async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      t.cleanProject(
        "live",
        manifest({ apps: { frontend: { dir: ".", install: "npm install", dev: "npm run dev", port }, backend: null } }),
      );
      const reg = createProjectFolderRegistry(t.root);
      await reg.claim(WS_A, "live");
      expect((await reg.status(WS_A, "live"))?.apps[0]?.state).toBe("running");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    const reg = createProjectFolderRegistry(t.root);
    expect((await reg.status(WS_A, "live"))?.apps[0]?.state).toBe("stopped");
  });

  it("stamps eject.verifiedAt only on a clean report", async () => {
    const dir = t.cleanProject("demo");
    const reg = createProjectFolderRegistry(t.root);
    await reg.claim(WS_A, "demo");

    const clean = await reg.verifyEject(WS_A, "demo");
    expect(clean?.ok).toBe(true);
    const stamped = JSON.parse(readFileSync(path.join(dir, "project.json"), "utf8")) as { eject: { verifiedAt: string | null } };
    expect(stamped.eject.verifiedAt).toBe(clean?.checkedAt);

    t.write("demo/src/bad.ts", 'import "@founderos/core";\n');
    const dirty = await reg.verifyEject(WS_A, "demo");
    expect(dirty?.ok).toBe(false);
    const after = JSON.parse(readFileSync(path.join(dir, "project.json"), "utf8")) as { eject: { verifiedAt: string | null } };
    expect(after.eject.verifiedAt).toBe(clean?.checkedAt); // unchanged by the failing run
  });
});
