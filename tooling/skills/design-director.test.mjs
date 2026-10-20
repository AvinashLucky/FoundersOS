/**
 * Tests for skills/design-director/scripts/design.mjs — the guarantees the
 * skill promises: valid vocabulary, reproducible seeds, genuinely different
 * directions, no repeats against history, industry rules respected, and
 * accessible colour for every strategy at every hue.
 * Run: npm run test:skills
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AXES,
  GENOME,
  buildPalette,
  buildTokens,
  conflictsIn,
  distance,
  makeDirections,
  tokensCss,
  validateGenome,
} from "../../skills/design-director/scripts/design.mjs";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../skills/design-director/scripts/design.mjs");
const industries = Object.keys(GENOME.industries);

test("the vocabulary has no broken references", () => {
  assert.deepEqual(validateGenome(), []);
});

test("validate catches an industry rule pointing at a missing option", () => {
  const broken = structuredClone(GENOME);
  broken.industries.banking.prefer.hero = ["live-widget"]; // a signature id, not a hero id
  assert.ok(validateGenome(broken).some((e) => e.includes('unknown option "live-widget"')));
});

test("the same seed gives the same directions", () => {
  const a = makeDirections({ industry: "fintech", seed: 1234 });
  const b = makeDirections({ industry: "fintech", seed: 1234 });
  assert.deepEqual(a.directions, b.directions);
});

test("three directions are genuinely different, conflict-free, for every industry", () => {
  for (const industry of industries) {
    for (let seed = 1; seed <= 15; seed += 1) {
      const { directions, relaxed } = makeDirections({ industry, seed });
      assert.equal(relaxed, false, `${industry}/${seed} needed relaxing`);
      assert.equal(directions.length, 3);
      for (const d of directions) assert.deepEqual(conflictsIn(d.genome), [], `${industry}/${seed} conflict`);
      for (let i = 0; i < 3; i += 1) {
        for (let j = i + 1; j < 3; j += 1) {
          assert.ok(distance(directions[i].genome, directions[j].genome) >= 12, `${industry}/${seed} too similar`);
        }
      }
    }
  }
});

test("a direction already used is not offered again", () => {
  const first = makeDirections({ industry: "banking", seed: 99 });
  const history = first.directions.map((d) => d.genome);
  for (let seed = 100; seed < 130; seed += 1) {
    const next = makeDirections({ industry: "banking", seed, history });
    for (const d of next.directions) {
      for (const h of history) assert.ok(distance(d.genome, h) >= 8, `seed ${seed} repeats history`);
    }
  }
});

test("industry rules hold: avoided and industry-only options never appear", () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    for (const d of makeDirections({ industry: "banking", seed }).directions) {
      assert.notEqual(d.genome.layout, "catalog-grid"); // shop-only
      assert.notEqual(d.genome.color, "neon-dark"); // banking avoid
      assert.notEqual(d.genome.hero, "map-hero"); // mobility/logistics-only
    }
  }
});

test("every colour strategy passes every contrast check at every hue", () => {
  for (const strategy of GENOME.axes.color) {
    for (let hue = 0; hue < 360; hue += 10) {
      const { checks } = buildPalette({ color: strategy.id, seedHue: hue });
      const failed = checks.filter((c) => !c.pass);
      assert.deepEqual(failed, [], `${strategy.id} @ ${hue}°: ${failed.map((f) => `${f.pair} ${f.ratio}`).join(", ")}`);
    }
  }
});

test("tokens include every variable a build needs, with one font URL per family", () => {
  const genome = Object.fromEntries(AXES.map((a) => [a, GENOME.axes[a][0].id]));
  genome.type = "instrument-serif-inter-tight";
  genome.seedHue = 200;
  const tokens = buildTokens(genome);
  const css = tokensCss(tokens);
  for (const v of ["--color-bg", "--color-text", "--color-accent", "--color-on-accent", "--color-focus", "--font-display", "--text-base", "--radius-md", "--motion-duration", "--space-section"]) {
    assert.ok(css.includes(v), `missing ${v}`);
  }
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.equal(tokens.fonts.urls.length, 3); // display, body, mono
  assert.ok(tokens.fonts.urls.some((u) => u.includes("Instrument+Serif:wght@400&"))); // single-weight family
});

test("an unknown industry is refused with a hint", () => {
  assert.throws(() => makeDirections({ industry: "spaceships" }), /run: node design.mjs industries/);
});

test("CLI: directions → tokens writes files and records history", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "dd-"));
  try {
    const history = path.join(dir, ".history.json");
    const directions = path.join(dir, "directions.json");
    execFileSync(process.execPath, [SCRIPT, "directions", "--industry", "healthcare", "--seed", "5", "--history", history, "--out", directions]);
    execFileSync(process.execPath, [SCRIPT, "tokens", "--from", directions, "--pick", "C", "--out", path.join(dir, "C"), "--history", history]);
    for (const f of ["tokens.css", "theme.tailwind.css", "DESIGN.md", "genome.json"]) assert.ok(existsSync(path.join(dir, "C", f)), f);
    const recorded = JSON.parse(readFileSync(history, "utf8"));
    assert.equal(recorded.used.length, 1);
    assert.equal(recorded.used[0].industry, "healthcare");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("app context keeps every axis inside what suits working software, for every industry", () => {
  const allow = GENOME.contexts.app.allow;
  for (const industry of industries) {
    for (let seed = 1; seed <= 10; seed += 1) {
      const { directions, relaxed } = makeDirections({ industry, context: "app", seed });
      assert.equal(directions.length, 3, `${industry}/${seed}`);
      for (const d of directions) {
        for (const [axis, ids] of Object.entries(allow)) {
          assert.ok(ids.includes(d.genome[axis]), `${industry}/${seed}: ${axis}=${d.genome[axis]} not allowed in app context`);
        }
      }
      if (!relaxed) {
        for (let i = 0; i < 3; i += 1) for (let j = i + 1; j < 3; j += 1) assert.ok(distance(directions[i].genome, directions[j].genome) >= 12);
      }
    }
  }
});

test("an unknown context is refused", () => {
  assert.throws(() => makeDirections({ industry: "general", context: "spaceship" }), /unknown context/);
});
