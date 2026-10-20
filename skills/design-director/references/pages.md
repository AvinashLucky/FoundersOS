# Page types

What each page must contain to be complete. "States" are the non-happy paths that must be
designed, not left to the browser default.

## Contents
Home · About · Product / Features · Pricing · Contact · Blog index · Article · Docs ·
Careers · Case study · Product detail (shop) · Cart & checkout · Sign in / Sign up ·
Dashboard shell · Status · Legal · 404 / 500

---

**Home** — the promise in one line, who it's for, how it works (3–5 steps max), proof
that exists, the primary action repeated at the end, footer with real contact and legal links.

**About** — why the company exists, who is behind it (real people or none), how it
works with customers, where it operates. No invented history or headcount.

**Product / Features** — organised by the job the visitor is trying to do, not by
internal module names. Each feature: what it does, what changes for the user, a real view
of it (UI in code beats screenshots).

**Pricing** — plans with what's included and the limits, the billing period, taxes
shown or stated, a plan comparison table, FAQ about payment and cancellation, and a
route for custom/enterprise if it exists. States: annual/monthly toggle, currency.

**Contact** — the form (only fields you'll use), what happens next and when, alternative
channels (email, phone, address, hours), map only if visiting matters. States:
field errors next to fields, sending, sent (with a reference or next step), failed (with
a fallback channel). Consent text where personal data is collected.

**Blog index** — filters or categories, article cards with date and reading time,
pagination. States: empty category, no results.

**Article** — readable measure (60–75 characters), headings for skimming, author and
date, related articles, share without third-party trackers by default.

**Docs** — sidebar navigation, search, on-page contents, code blocks with copy,
previous/next. States: search with no results.

**Careers** — why work here (true things), open roles with location and type, process,
equal-opportunity statement. State: no open roles.

**Case study** — client (with permission), problem, approach, result with measured
numbers and their source. If there are no real case studies yet, don't make this page.

**Product detail (shop)** — gallery, price, variants, stock, delivery estimate,
returns, reviews only if real. States: out of stock, variant unavailable.

**Cart & checkout** — line items, totals with tax and delivery, edit quantities, guest
checkout, clear payment step, confirmation. States: empty cart, payment failed, address error.

**Sign in / Sign up** — minimal fields, password rules shown up front, social/SSO only if
real, legal consent on sign up. States: wrong password, locked account, email not verified,
reset sent.

**Dashboard shell** — navigation, page title, primary action, content area, account menu.
States: first-run empty state with a next step, loading skeletons, error with retry,
no permission.

**Status** — current state of each service, incident history. Only if it's real.

**Legal** — privacy, terms, cookies (if used), written for the actual product; flag
that a lawyer should review.

**404 / 500** — say what happened in plain words, offer search or the main routes, keep
the site's navigation.
