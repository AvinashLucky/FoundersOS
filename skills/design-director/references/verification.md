# Verifying the build in a browser

Code that compiles can still look broken. Before calling a site done, check the rendered
result. Report exactly which of these you ran.

## Checklist

1. **Runs** — the dev server starts with no errors; every route loads.
2. **Screens** — screenshot each page at 360, 768 and 1280 px (plus 1536 for wide layouts).
   Look for: overflow, text collisions, images stretching, sections that collapse into a
   long stack on mobile, tap targets under 44 px.
3. **Against the direction** — compare screenshots with `design/DESIGN.md`: right fonts
   loaded (not the fallback), only token colours, the layout logic and signature move present.
4. **Console** — no errors or failed requests on any page.
5. **Keyboard** — Tab through every page: visible focus, logical order, menus and dialogs
   open, trap and close with Escape, skip link if there's a long header.
6. **Forms** — submit empty (errors appear next to fields and are announced), submit
   invalid, submit valid (clear success state), simulate failure (clear error and fallback).
7. **Motion** — with reduced motion enabled, nothing essential depends on animation.
8. **Contrast** — anything you added outside the tokens meets 4.5:1 (text) / 3:1 (UI).

## Playwright script (when the project has Node)

Install once in the project: `npm i -D @playwright/test && npx playwright install chromium`.
Save as `design/verify.spec.ts`, set `BASE` and `ROUTES`, run `npx playwright test design/verify.spec.ts`.

```ts
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const ROUTES = ["/", "/pricing", "/contact"];
const WIDTHS = [360, 768, 1280];

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`${route} @ ${width}px renders cleanly`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("requestfailed", (r) => errors.push(`failed: ${r.url()}`));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, "horizontal overflow").toBe(false);
      await page.screenshot({ path: `design/screens/${route.replace(/\W+/g, "_") || "home"}-${width}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

test("contact form shows errors and success", async ({ page }) => {
  await page.goto(BASE + "/contact");
  await page.getByRole("button", { name: /send|submit/i }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});
```

Adjust the form test to the real labels. If the browser can't run in your environment,
say so in the report rather than marking these checks as done.
