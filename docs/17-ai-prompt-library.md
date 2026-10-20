---
title: AI Prompt Library
source: generated ← packages/prompts
owner: ai
lastReviewed: 2026-06-28
status: seed
---

# AI Prompt Library

> Mirrors \`packages/prompts\` (versioned). Regenerated in CI.

Prompts are **versioned assets**, not inline strings: \`role/version → template + input schema +
model hints\`. Each entry records which model+prompt produced artifacts, so regressions are
detectable on the golden set. Curated design notes per prompt go under each generated entry.
