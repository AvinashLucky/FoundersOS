# Lovable — reference for FounderOS

**What it is.** A prompt → full-stack web app builder. It produces a React + TypeScript
(Vite, Tailwind) frontend with a Supabase backend (database, auth, row-level security),
syncs to GitHub, and offers "Lovable Cloud" as a managed backend. **Agent mode** explores
the codebase, fixes, debugs, reads logs and searches the web. **Plan mode** discusses
without editing. Third-party reports say subagents were added in May 2026.

**Pricing (third-party, 2026; check lovable.dev/pricing).**
- Free: about 5 credits a day.
- Pro: from about $25/month.
- Business: from about $50/month.
- Enterprise: custom pricing.
- Credits are spent per message by complexity. Since Aug 2026 one credit pool reportedly
  covers building, hosting and in-app AI calls.

**What to learn**
- **Time to first visible result** is the whole hook: something appears on screen within
  a minute.
- **"The code is yours"** (GitHub sync) answers the lock-in fear. FounderOS's eject check is
  the same promise, made stronger by proving it.
- **Plan mode vs Agent mode** is a clear choice between "talk" and "act". FounderOS needs
  the same switch: debate-only runs and build runs.

**What users complain about (from pricing guides, not verified by us).** Credit costs are
hard to predict, top-ups cost more than plan credits, and daily credits expire.
→ **Lesson for FounderOS:** show the cost *before* a run, with a budget cap, which we
already do (`RUN_BUDGET_USD`). Make that visible on the first screen.

**Where FounderOS is different.** Lovable builds what you ask for. FounderOS first argues
about *whether and how* to build it (debate, dissent, a decision with receipts), then
builds. Lovable is single-user prompt-to-app; FounderOS is a company of roles.

**Honest gap.** Lovable's build, preview and hosting loop is mature; ours doesn't exist yet.

**Sources:** [docs.lovable.dev/features](https://docs.lovable.dev/features) ·
[Lovable: agent mode beta](https://lovable.dev/blog/agent-mode-beta) ·
[eesel.ai pricing guide](https://eesel.ai/blog/lovable-pricing) ·
[automationatlas.io](https://automationatlas.io/answers/lovable-pricing-explained-2026/)
