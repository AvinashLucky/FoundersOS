---
title: Deployment Guide
source: curated
owner: devops
lastReviewed: 2026-06-28
status: seed
---

# Deployment Guide

How to ship each deployable.

- **apps/web** — Next.js build → host (serverless/edge). Env from vault.
- **services/worker** — Docker image → container runtime with Redis access; scale by replica count.
- **Data** — managed MongoDB + Postgres(pgvector) + Redis + object storage.
- **CI/CD** — GitHub Actions: typecheck → lint → test → docs:check → build → deploy. No merge on red.
