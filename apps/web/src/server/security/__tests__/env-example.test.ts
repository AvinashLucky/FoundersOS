import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Regression (2026-10-16): real API keys were typed into .env.example — the file
 * that is committed — instead of .env.local. Next.js never read them, and they
 * would have gone to GitHub on the first push. Templates must hold names only.
 */
const ROOT = path.resolve(__dirname, "../../../../../..");
const TEMPLATES = [".env.example", "apps/web/.env.example"].map((p) => path.join(ROOT, p));
const KEY_SHAPES = [/AQ\.[A-Za-z0-9_-]{20,}/, /gsk_[A-Za-z0-9]{20,}/, /sk-[A-Za-z0-9-]{20,}/, /tvly-[A-Za-z0-9-]{20,}/, /mstrl_[A-Za-z0-9_]{20,}/, /AIza[0-9A-Za-z_-]{30,}/, /LLM_\d{6,}/];

describe("committed env templates", () => {
  for (const file of TEMPLATES) {
    it(`${path.relative(ROOT, file)} contains no real keys`, () => {
      expect(existsSync(file)).toBe(true);
      const text = readFileSync(file, "utf8");
      for (const shape of KEY_SHAPES) expect(text, `matches ${shape}`).not.toMatch(shape);
    });
  }
});
