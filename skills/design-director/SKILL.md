---
name: design-director
description: Art-direct and build distinctive, original websites and web-app interfaces instead of falling back on the same few looks. Use this whenever the user wants to design, redesign, reskin or build a website, landing page, multi-page marketing site, product UI, dashboard look, theme or design system — and especially when they say results look generic, repetitive, "AI-made", or ask for something premium, unique or on-brand, share a reference site to learn from, or need fonts, colours or design tokens. It generates three genuinely different directions from a large design vocabulary, remembers past choices so it doesn't repeat itself, produces contrast-checked tokens, and verifies the build in a real browser.
---

# Design Director

Asked for "a premium website", a model reaches for the same handful of looks: centred
hero, three cards, gradient, Inter. The cause isn't a lack of options; it's that nothing
forces a different choice. This skill forces one: it samples a design **genome** (layout,
colour strategy, type pairing, shape, density, motion, imagery, navigation, surface, hero,
signature move) from a vocabulary of hundreds of options, keeps three directions far
apart, remembers what each project already used, and turns the chosen direction into
accessible tokens before a line of UI is written.

The script lives at `${CLAUDE_SKILL_DIR}/scripts/design.mjs` (Node 18+, no dependencies).
Below it is written as `design.mjs`.

## Workflow

Follow these steps in order. Each one exists because skipping it is how sites end up
looking the same.

### 1 · Brief
Get, or infer and state: the business and its buyer, the pages needed, the content that
actually exists (copy, photos, numbers, logos), the stack, brand assets, languages, and any
reference sites. Content drives design — a page with no real proof shouldn't be designed
around a testimonial wall.

### 2 · Study references (if any were given)
Read `references/reference-study.md`. Extract the *principles* (rhythm, hierarchy, type
contrast, how the page earns trust) and write them down in a few lines. Never carry over
their brand, wording, images, code or exact layout.

### 3 · Generate three directions
Pick the closest industry (`node design.mjs industries`), then:

```bash
node design.mjs directions --industry <id> --history design/.history.json --out design/directions.json
```

The history file is what stops repeats: anything already chosen for this project is kept
at a distance. Use `--seed <n>` to reproduce a result. If the output says `RELAXED`, the
project has used much of the vocabulary — say so.

### 4 · Present them and choose
For each direction give: a short name you invent, the mood in one line, the 4–5 genome
choices that define it, why it fits this business, and one honest risk. Let the user pick.
If you're working autonomously, pick on fit and explain the choice in one sentence. A
direction can be adjusted (swap one axis) — keep the rest.

### 5 · Tokens
```bash
node design.mjs tokens --from design/directions.json --pick B --out design --history design/.history.json
```
This writes `tokens.css` (CSS variables + font imports + reduced-motion), `theme.tailwind.css`
(a Tailwind v4 `@theme` block), `DESIGN.md` (the direction's rules and a contrast report),
and `genome.json`, and records the choice in history. Exit code 2 means a contrast check
failed — fix it before building. For Tailwind v3, map the same variables in
`theme.extend`; any stack can use the CSS variables directly.

### 6 · Build
- Use only the tokens. A new colour, radius or font is a design decision — make it on
  purpose and add it to the tokens, not inline.
- Let the genome shape every section: the **layout** logic for structure, the **hero**
  type above the fold, the **signature move** once, where it carries meaning.
- Pages: `references/pages.md`. Section patterns: `references/sections.md`. What each
  industry's visitors need: `references/industries.md`.
- Every interactive piece works: navigation (mobile too), forms with validation and
  success/error feedback, menus, filters. Every screen has loading, empty, error and
  success states where data is involved.
- Semantic HTML, visible focus, labelled controls, WCAG AA contrast (the tokens give you
  this — don't undo it with opacity), `prefers-reduced-motion` honoured.
- Responsive at 360, 768, 1280 and 1536 px. Design the small screen, don't just stack it.

### 7 · Verify in a browser
Follow `references/verification.md`: run the site, screenshot each page at three widths,
check the console, walk the keyboard, submit every form. Compare the screenshots with
`DESIGN.md`. If it reads as "generic", find which rule you drifted from and fix that.

### 8 · Report
What was built, the chosen direction and why, what was verified (with the commands you
actually ran), and what wasn't. Never report a check you didn't run.

## Defaults to resist

These are down-weighted in the vocabulary because they're what every model produces.
Use one only when the chosen direction genuinely calls for it:

- purple-to-blue gradient hero; centred headline over three feature cards
- bento grids for content that isn't modular; floating pill navigation; glassmorphism
- Inter or Poppins for everything; identical radius and shadow on every element
- emoji or generic 3D blobs as illustration; dark mode as the automatic "premium" choice
- logo marquees, "Trusted by 10,000+", star ratings or testimonials that don't exist

## Honesty and ownership

- Original work only. References inform principles; no copied code, assets, text or
  layouts, and no other company's name or logo in the product.
- Never invent testimonials, client logos, metrics, awards or reviews. If proof doesn't
  exist yet, design the section to be filled later and say so — or leave it out.
- Fonts come from Google Fonts (open licences). Images are the client's, properly
  licensed, or clearly marked as stand-ins for the client to replace.

## Existing projects

If the project already has a design system, respect it: use this skill only to extend it
or when a redesign was asked for. For a redesign, generate directions as above and show
how each would change the current pages before touching code.

## Without Node

Read `assets/genome.json`, choose one option per axis for each of three directions
(respect the industry's `prefer`/`avoid`/`only` rules and the `conflicts` list, and make
the three differ on most axes), then derive colours by hand and check every text/background
pair reaches 4.5:1 (7:1 for body text) before using it.

## Reference files

| File | Read when |
|---|---|
| `references/reference-study.md` | the user gave a site to learn from |
| `references/industries.md` | choosing the industry and deciding what the pages must prove |
| `references/pages.md` | planning which pages exist and what each must contain |
| `references/sections.md` | composing sections inside a page |
| `references/verification.md` | testing the result in a browser |
| `assets/genome.json` | you need the full vocabulary or are working without Node |
