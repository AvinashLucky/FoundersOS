#!/usr/bin/env node
/**
 * design-director generator — no dependencies, Node 18+.
 * ─────────────────────────────────────────────────────────────────────────
 * Turns the design vocabulary in assets/genome.json into concrete, original
 * design directions, and turns a chosen direction into tokens.
 *
 *   node design.mjs directions --industry banking [--context site|app] [--count 3] [--seed 42]
 *                              [--history design/.history.json] [--out design/directions.json]
 *   node design.mjs tokens --from design/directions.json --pick B --out design/
 *                          [--history design/.history.json] [--no-record]
 *   node design.mjs industries        list industry ids
 *   node design.mjs stats             size of the vocabulary
 *   node design.mjs validate          check genome.json for broken references
 *
 * Why it exists: a model asked for "a premium website" falls back on the same
 * few looks. Sampling a genome, forcing the three directions apart, and
 * remembering what was already used makes repetition the exception.
 * Colours are generated in OKLCH and every text/UI pair is pushed until it
 * meets WCAG contrast, so a random direction is never an inaccessible one.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const GENOME = JSON.parse(readFileSync(path.join(HERE, "..", "assets", "genome.json"), "utf8"));
export const AXES = Object.keys(GENOME.weights);
export const MAX_DISTANCE = AXES.reduce((sum, a) => sum + GENOME.weights[a], 0);
const VERSION = "design-director/1";

/* ── Random numbers: seeded, reproducible ─────────────────────────────── */

function hashString(s) {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFrom(seed) {
  let state = typeof seed === "number" ? seed >>> 0 : hashString(String(seed));
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Vocabulary checks ─────────────────────────────────────────────────── */

const option = (axis, id) => GENOME.axes[axis]?.find((o) => o.id === id);

export function validateGenome(g = GENOME) {
  const errors = [];
  const has = (axis, id) => Boolean(g.axes[axis]?.some((o) => o.id === id));
  for (const axis of Object.keys(g.weights)) {
    const opts = g.axes[axis];
    if (!Array.isArray(opts) || opts.length === 0) {
      errors.push(`axis "${axis}" has no options`);
      continue;
    }
    const ids = opts.map((o) => o.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) errors.push(`axis "${axis}" repeats ${dupes.join(", ")}`);
  }
  for (const axis of Object.keys(g.weights)) {
    for (const o of g.axes[axis] ?? []) {
      for (const ind of o.only ?? []) if (!g.industries[ind]) errors.push(`${axis}.${o.id}.only: unknown industry "${ind}"`);
    }
  }
  for (const [ctx, def] of Object.entries(g.contexts ?? {})) {
    for (const [axis, ids] of Object.entries(def.allow ?? {})) {
      if (!g.weights[axis]) errors.push(`context ${ctx}: unknown axis "${axis}"`);
      else for (const id of ids) if (!has(axis, id)) errors.push(`context ${ctx}.${axis}: unknown option "${id}"`);
    }
  }
  for (const pair of g.conflicts) {
    for (const ref of pair) {
      const [axis, id] = ref.split(":");
      if (!axis || !id || !has(axis, id)) errors.push(`conflict refers to unknown "${ref}"`);
    }
  }
  for (const [industry, rules] of Object.entries(g.industries)) {
    for (const kind of ["prefer", "avoid"]) {
      for (const [axis, ids] of Object.entries(rules[kind] ?? {})) {
        if (!g.weights[axis]) errors.push(`${industry}.${kind}: unknown axis "${axis}"`);
        else for (const id of ids) if (!has(axis, id)) errors.push(`${industry}.${kind}.${axis}: unknown option "${id}"`);
      }
    }
  }
  return errors;
}

/* ── Sampling ──────────────────────────────────────────────────────────── */

function weightFor(axis, opt, industry, context = "site") {
  const rules = GENOME.industries[industry] ?? { prefer: {}, avoid: {} };
  if (rules.avoid?.[axis]?.includes(opt.id)) return 0;
  // An app context limits each axis to what suits working software.
  const allowed = GENOME.contexts?.[context]?.allow?.[axis];
  if (allowed && !allowed.includes(opt.id)) return 0;
  // Some patterns only make sense in certain industries (a shop grid on a bank).
  if (opt.only && industry !== "general" && !opt.only.includes(industry)) return 0;
  const base = opt.weight ?? 1;
  return rules.prefer?.[axis]?.includes(opt.id) ? base * 3 : base;
}

function weightedPick(rng, items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= weights[i] ?? 0;
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function conflictsIn(genome) {
  return GENOME.conflicts.filter((pair) =>
    pair.every((ref) => {
      const [axis, id] = ref.split(":");
      return genome[axis] === id;
    }),
  );
}

export function sampleGenome(rng, industry = "general", context = "site") {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const genome = {};
    for (const axis of AXES) {
      const opts = GENOME.axes[axis];
      genome[axis] = weightedPick(rng, opts, opts.map((o) => weightFor(axis, o, industry, context))).id;
    }
    genome.seedHue = Math.floor(rng() * 360);
    if (conflictsIn(genome).length === 0) return genome;
  }
  return null;
}

/** Weighted number of axes on which two genomes differ (0 = identical). */
export function distance(a, b) {
  return AXES.reduce((sum, axis) => sum + (a[axis] !== b[axis] ? GENOME.weights[axis] : 0), 0);
}

const LETTERS = "ABCDEFGHIJ";

export function makeDirections({
  industry = "general",
  context = "site",
  count = 3,
  seed = Date.now(),
  history = [],
  minPairwise = 12,
  minFromHistory = 8,
  tries = 6000,
} = {}) {
  if (!GENOME.industries[industry]) {
    throw new Error(`unknown industry "${industry}" — run: node design.mjs industries`);
  }
  if (!GENOME.contexts?.[context]) throw new Error(`unknown context "${context}" — use "site" or "app"`);
  const rng = rngFrom(seed);
  const run = (pairwise, fromHistory) => {
    const chosen = [];
    for (let i = 0; i < tries && chosen.length < count; i += 1) {
      const g = sampleGenome(rng, industry, context);
      if (!g) continue;
      if (chosen.some((c) => distance(c, g) < pairwise)) continue;
      if (history.some((h) => distance(h, g) < fromHistory)) continue;
      chosen.push(g);
    }
    return chosen;
  };
  let chosen = run(minPairwise, minFromHistory);
  let relaxed = false;
  if (chosen.length < count) {
    relaxed = true;
    chosen = run(Math.ceil(minPairwise / 2), Math.ceil(minFromHistory / 2));
  }
  return {
    generator: VERSION,
    industry,
    context,
    seed,
    relaxed,
    directions: chosen.map((genome, i) => ({ id: LETTERS[i], summary: summarize(genome), genome })),
  };
}

export function summarize(g) {
  const type = option("type", g.type);
  return `${g.layout} · ${g.color} · ${type?.display ?? g.type}${type && type.body !== type.display ? ` + ${type.body}` : ""} · ${g.hero} hero · ${g.signature}`;
}

/* ── Colour: OKLCH → sRGB with gamut mapping and WCAG contrast ─────────── */

function oklabToLinearSrgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** OKLCH to a displayable sRGB colour, reducing chroma until it fits the gamut. */
export function oklch(L, C, h) {
  const rad = (h * Math.PI) / 180;
  let chroma = C;
  let lin = oklabToLinearSrgb(L, chroma * Math.cos(rad), chroma * Math.sin(rad));
  for (let i = 0; i < 60 && lin.some((v) => v < -1e-5 || v > 1 + 1e-5); i += 1) {
    chroma *= 0.92;
    lin = oklabToLinearSrgb(L, chroma * Math.cos(rad), chroma * Math.sin(rad));
  }
  const linear = lin.map(clamp01);
  const hex = `#${linear.map((v) => Math.round(gamma(v) * 255).toString(16).padStart(2, "0")).join("")}`;
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return { L, C: chroma, h, hex, luminance };
}

export const contrast = (a, b) =>
  (Math.max(a.luminance, b.luminance) + 0.05) / (Math.min(a.luminance, b.luminance) + 0.05);

/** Move lightness away from `against` until the contrast target is met. */
function ensureContrast(color, against, target) {
  const darker = against.luminance > 0.18;
  let c = color;
  for (let i = 0; i < 100 && contrast(c, against) < target; i += 1) {
    const L = clamp01(c.L + (darker ? -0.01 : 0.01));
    c = oklch(L, color.C, color.h);
    if (L === 0 || L === 1) break;
  }
  return c;
}

function resolveHue(h, seedHue) {
  if (typeof h === "number") return h;
  const m = /^seed(?:\+(\d+))?$/.exec(h);
  return m ? (seedHue + Number(m[1] ?? 0)) % 360 : seedHue;
}

export function buildPalette(genome) {
  const strategy = option("color", genome.color);
  if (!strategy) throw new Error(`unknown colour strategy "${genome.color}"`);
  const dark = strategy.mode === "dark";
  const bgHue = resolveHue(strategy.bg.h, genome.seedHue);
  const bg = oklch(strategy.bg.L, strategy.bg.C, bgHue);
  const shift = (d) => oklch(clamp01(strategy.bg.L + (dark ? d : -d)), strategy.bg.C, bgHue);
  const surface = shift(0.03);
  const surface2 = shift(0.065);
  const neutralC = Math.min(strategy.bg.C * 2, 0.02);

  const text = ensureContrast(oklch(dark ? 0.95 : 0.2, neutralC, bgHue), surface2, 7);
  const textMuted = ensureContrast(oklch(dark ? 0.75 : 0.48, neutralC, bgHue), surface2, 4.5);
  const border = shift(0.12);
  const borderStrong = ensureContrast(shift(0.25), bg, 3);

  const accents = strategy.accents.map((a) => oklch(a.L, a.C, resolveHue(a.h, genome.seedHue)));
  let accent = ensureContrast(accents[0], bg, 3);
  const white = oklch(1, 0, 0);
  const ink = oklch(0.16, 0, 0);
  // Pick the readable ink for text on the accent; nudge the accent if neither reaches 4.5.
  let onAccent = contrast(accent, white) >= contrast(accent, ink) ? white : ink;
  for (let i = 0; i < 60 && contrast(accent, onAccent) < 4.5; i += 1) {
    accent = oklch(clamp01(accent.L + (onAccent === white ? -0.01 : 0.01)), accent.C, accent.h);
  }
  const link = ensureContrast(accent, bg, 4.5);
  const status = (h, C) => ensureContrast(oklch(dark ? 0.78 : 0.5, C, h), bg, 4.5);

  const colors = {
    bg,
    surface,
    "surface-2": surface2,
    text,
    "text-muted": textMuted,
    border,
    "border-strong": borderStrong,
    accent,
    "on-accent": onAccent,
    link,
    ...Object.fromEntries(accents.slice(1).map((a, i) => [`accent-${i + 2}`, a])),
    success: status(150, 0.13),
    warning: status(70, 0.15),
    danger: status(25, 0.18),
    focus: contrast(accent, bg) >= 3 ? accent : text,
  };

  const checks = [
    ["text", "surface-2", 7],
    ["text-muted", "surface-2", 4.5],
    ["link", "bg", 4.5],
    ["on-accent", "accent", 4.5],
    ["accent", "bg", 3],
    ["border-strong", "bg", 3],
    ["success", "bg", 4.5],
    ["warning", "bg", 4.5],
    ["danger", "bg", 4.5],
    ["focus", "bg", 3],
  ].map(([fg, against, min]) => {
    const ratio = contrast(colors[fg], colors[against]);
    return { pair: `${fg} on ${against}`, ratio: Math.round(ratio * 100) / 100, min, pass: ratio >= min };
  });

  return { mode: strategy.mode, colors: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, v.hex])), checks };
}

/* ── Type, space, shape, surface, motion ───────────────────────────────── */

const FALLBACK = { serif: "Georgia, 'Times New Roman', serif", sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace" };
const SERIF_FAMILIES = new Set(["Fraunces", "Instrument Serif", "Playfair Display", "DM Serif Display", "Newsreader", "Libre Baskerville", "IBM Plex Serif", "Noto Serif", "Spectral", "Cormorant Garamond", "Lora", "Merriweather"]);
const MONO_FAMILIES = new Set(["JetBrains Mono", "IBM Plex Mono", "Chivo Mono"]);
/** Weights each family actually ships on Google Fonts; asking for a missing weight breaks the CSS URL. */
const FONT_WEIGHTS = {
  "Archivo Black": "400", "Bebas Neue": "400", Anton: "400", "Instrument Serif": "400", "DM Serif Display": "400",
  "Libre Baskerville": "400;700", "Atkinson Hyperlegible": "400;700", Merriweather: "400;700",
};

const stackFor = (family) =>
  `"${family}", ${MONO_FAMILIES.has(family) ? FALLBACK.mono : SERIF_FAMILIES.has(family) ? FALLBACK.serif : FALLBACK.sans}`;

/** One URL per family: if Google ever drops a weight, only that family falls back. */
export function fontUrls(type) {
  const families = [...new Set([type.display, type.body, type.mono, type.extra].filter(Boolean))];
  return families.map(
    (f) => `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, "+")}:wght@${FONT_WEIGHTS[f] ?? "400;500;600;700"}&display=swap`,
  );
}

function typeScale(density) {
  const steps = { xs: -2, sm: -1, base: 0, lg: 1, xl: 2, "2xl": 3, "3xl": 4, "4xl": 5, "5xl": 6 };
  return Object.fromEntries(
    Object.entries(steps).map(([name, n]) => [name, `${Math.round((density.base * density.ratio ** n) / 16 * 1000) / 1000}rem`]),
  );
}

const SHADOWS = {
  flat: "none",
  hairline: "none",
  "soft-shadow": "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.08)",
  grain: "none",
  glass: "0 8px 32px rgb(0 0 0 / 0.12)",
  paper: "0 1px 0 rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.05)",
  "gradient-field": "none",
  "brutal-shadow": "4px 4px 0 var(--color-text)",
};

export function buildTokens(genome) {
  for (const axis of AXES) if (!option(axis, genome[axis])) throw new Error(`unknown ${axis} "${genome[axis]}"`);
  const type = option("type", genome.type);
  const density = option("density", genome.density);
  const shape = option("shape", genome.shape);
  const motion = option("motion", genome.motion);
  const palette = buildPalette(genome);
  const [sm, md, lg, pill] = shape.radii;
  const container = { airy: 1200, balanced: 1240, compact: 1320, "data-dense": 1440 }[density.id];
  const body = { airy: 1.7, balanced: 1.6, compact: 1.55, "data-dense": 1.45 }[density.id];
  return {
    palette,
    fonts: {
      display: stackFor(type.display),
      body: stackFor(type.body),
      mono: stackFor(type.mono ?? "JetBrains Mono"),
      urls: fontUrls(type.mono ? type : { ...type, mono: "JetBrains Mono" }),
    },
    scale: typeScale(density),
    lineHeight: { body, heading: 1.1 },
    space: { unit: "4px", section: `${density.section}px`, container: `${container}px` },
    radius: { sm: `${sm}px`, md: `${md}px`, lg: `${lg}px`, pill: `${pill}px` },
    shadow: SHADOWS[genome.surface],
    motion: { duration: `${motion.duration}ms`, easing: motion.easing },
  };
}

/* ── Output files ──────────────────────────────────────────────────────── */

export function tokensCss(tokens) {
  const lines = [...tokens.fonts.urls.map((u) => `@import url("${u}");`), "", ":root {"];
  for (const [k, v] of Object.entries(tokens.palette.colors)) lines.push(`  --color-${k}: ${v};`);
  lines.push(`  --font-display: ${tokens.fonts.display};`, `  --font-body: ${tokens.fonts.body};`, `  --font-mono: ${tokens.fonts.mono};`);
  for (const [k, v] of Object.entries(tokens.scale)) lines.push(`  --text-${k}: ${v};`);
  lines.push(`  --leading-body: ${tokens.lineHeight.body};`, `  --leading-heading: ${tokens.lineHeight.heading};`);
  lines.push(`  --space-unit: ${tokens.space.unit};`, `  --space-section: ${tokens.space.section};`, `  --container: ${tokens.space.container};`);
  for (const [k, v] of Object.entries(tokens.radius)) lines.push(`  --radius-${k}: ${v};`);
  lines.push(`  --shadow: ${tokens.shadow};`, `  --motion-duration: ${tokens.motion.duration};`, `  --motion-easing: ${tokens.motion.easing};`, "}", "");
  lines.push("@media (prefers-reduced-motion: reduce) {", "  :root { --motion-duration: 0.01ms; }", "}", "");
  return lines.join("\n");
}

/** Tailwind v4 reads design tokens from an @theme block and generates the utilities. */
export function tailwindTheme(tokens) {
  const lines = ["@theme {"];
  for (const k of Object.keys(tokens.palette.colors)) lines.push(`  --color-${k}: var(--color-${k});`);
  lines.push("  --font-display: var(--font-display);", "  --font-body: var(--font-body);", "  --font-mono: var(--font-mono);");
  for (const k of Object.keys(tokens.radius)) lines.push(`  --radius-${k}: var(--radius-${k});`);
  lines.push("}", "");
  return lines.join("\n");
}

export function designMd({ genome, tokens, industry, seed }) {
  const row = (axis) => {
    const o = option(axis, genome[axis]);
    return `| ${axis} | \`${genome[axis]}\` | ${o?.note ?? o?.mood ?? ""} |`;
  };
  const type = option("type", genome.type);
  const checks = tokens.palette.checks.map((c) => `| ${c.pair} | ${c.ratio}:1 | ≥ ${c.min}:1 | ${c.pass ? "pass" : "**FAIL**"} |`);
  return [
    `# Design direction — ${summarize(genome)}`,
    "",
    `Generated by \`${VERSION}\` · industry \`${industry}\` · seed \`${seed}\` · seed hue ${genome.seedHue}°.`,
    "This direction is original: it combines generic design vocabulary, not any company's template.",
    "",
    "## The genome",
    "",
    "| Axis | Choice | What it means here |",
    "|---|---|---|",
    ...AXES.map(row),
    "",
    "## Typography",
    "",
    `Display **${type.display}** · body **${type.body}**${type.mono ? ` · mono **${type.mono}**` : ""} — ${type.mood}. All from Google Fonts (open licences).`,
    "Load (also imported at the top of `tokens.css`; prefer these `<link>` tags in production for speed):",
    "",
    "```html",
    ...tokens.fonts.urls.map((u) => `<link rel="stylesheet" href="${u}">`),
    "```",
    "",
    "## Colour (" + tokens.palette.mode + " mode) and contrast",
    "",
    ...Object.entries(tokens.palette.colors).map(([k, v]) => `- \`--color-${k}\` ${v}`),
    "",
    "| Pair | Ratio | Needed | Result |",
    "|---|---|---|---|",
    ...checks,
    "",
    "## Rules for this direction",
    "",
    `- Build every section from the **${genome.layout}** layout logic; don't fall back to centred-hero-plus-card-grid.`,
    `- The hero is **${genome.hero}**; the signature move is **${genome.signature}** — use it once, deliberately, where it carries meaning.`,
    `- Navigation: **${genome.nav}**. Surfaces: **${genome.surface}**. Shapes: **${genome.shape}**. Density: **${genome.density}**.`,
    `- Motion: **${genome.motion}** (${tokens.motion.duration}, ${tokens.motion.easing}); everything respects \`prefers-reduced-motion\`.`,
    "- Imagery: **" + genome.imagery + "** — real, licensed or client-supplied; never invented logos, testimonials or numbers.",
    "- Use only the tokens above. A new colour, radius or font is a design decision, not a shortcut.",
    "",
  ].join("\n");
}

/* ── History ───────────────────────────────────────────────────────────── */

export function readHistory(file) {
  if (!file || !existsSync(file)) return [];
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  return Array.isArray(parsed?.used) ? parsed.used.map((u) => u.genome) : [];
}

export function recordHistory(file, entry) {
  const data = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { version: 1, used: [] };
  data.used.push(entry);
  mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

/* ── CLI ───────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) flags[a.slice(2)] = true;
    else {
      flags[a.slice(2)] = next;
      i += 1;
    }
  }
  return flags;
}

function stats() {
  const counts = Object.fromEntries(AXES.map((a) => [a, GENOME.axes[a].length]));
  const raw = AXES.reduce((p, a) => p * GENOME.axes[a].length, 1) * 360;
  return { counts, rawCombinationsIncludingHue: raw, conflictRules: GENOME.conflicts.length, industries: Object.keys(GENOME.industries).length };
}

function main(argv) {
  const [command, ...rest] = argv;
  const flags = parseArgs(rest);
  if (command === "validate") {
    const errors = validateGenome();
    if (errors.length) {
      console.error(errors.join("\n"));
      return 1;
    }
    console.log("genome.json is valid");
    return 0;
  }
  if (command === "industries") {
    for (const [id, v] of Object.entries(GENOME.industries)) console.log(`${id.padEnd(20)} ${v.label}`);
    return 0;
  }
  if (command === "stats") {
    console.log(JSON.stringify(stats(), null, 2));
    return 0;
  }
  if (command === "directions") {
    const seed = flags.seed !== undefined ? (Number.isFinite(Number(flags.seed)) ? Number(flags.seed) : String(flags.seed)) : Date.now();
    const result = makeDirections({
      industry: flags.industry ?? "general",
      context: flags.context ?? "site",
      count: Number(flags.count ?? 3),
      seed,
      history: readHistory(flags.history),
    });
    if (flags.out) {
      mkdirSync(path.dirname(path.resolve(flags.out)), { recursive: true });
      writeFileSync(flags.out, `${JSON.stringify(result, null, 2)}\n`);
    }
    if (flags.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`industry ${result.industry} · ${result.context} · seed ${result.seed}${result.relaxed ? " · RELAXED (vocabulary nearly exhausted for this history)" : ""}`);
      for (const d of result.directions) console.log(`  ${d.id}  ${d.summary}`);
      if (flags.out) console.log(`saved ${flags.out}`);
    }
    return 0;
  }
  if (command === "tokens") {
    let genome;
    let industry = "general";
    let seed = "manual";
    if (flags.from) {
      const data = JSON.parse(readFileSync(flags.from, "utf8"));
      const pick = String(flags.pick ?? "A").toUpperCase();
      const d = data.directions.find((x) => x.id === pick);
      if (!d) throw new Error(`no direction "${pick}" in ${flags.from}`);
      ({ genome } = d);
      ({ industry, seed } = data);
    } else if (flags.genome) {
      genome = JSON.parse(readFileSync(flags.genome, "utf8"));
    } else throw new Error("tokens needs --from <directions.json> --pick <A|B|C> or --genome <file>");
    const out = flags.out ?? "design";
    const tokens = buildTokens(genome);
    mkdirSync(out, { recursive: true });
    writeFileSync(path.join(out, "tokens.css"), tokensCss(tokens));
    writeFileSync(path.join(out, "theme.tailwind.css"), tailwindTheme(tokens));
    writeFileSync(path.join(out, "DESIGN.md"), designMd({ genome, tokens, industry, seed }));
    writeFileSync(path.join(out, "genome.json"), `${JSON.stringify({ industry, seed, genome }, null, 2)}\n`);
    if (flags.history && !flags["no-record"]) {
      recordHistory(flags.history, { at: new Date().toISOString(), industry, seed, summary: summarize(genome), genome });
    }
    const failed = tokens.palette.checks.filter((c) => !c.pass);
    console.log(`wrote ${out}/tokens.css, theme.tailwind.css, DESIGN.md, genome.json`);
    console.log(failed.length ? `CONTRAST FAILURES: ${failed.map((f) => f.pair).join(", ")}` : "all contrast checks pass");
    return failed.length ? 2 : 0;
  }
  console.log("commands: directions · tokens · industries · stats · validate (see the header of this file)");
  return command ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`✕ ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
