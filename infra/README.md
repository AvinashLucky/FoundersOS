# infra/ — Docker, CI/CD, IaC

**Purpose.** Reproducible builds and deploys: Dockerfiles, compose, GitHub Actions, scripts.

**Responsibilities.** Containerization, CI gates, environment provisioning.

**Dependencies.** —.

**Best practices.** CI gates on typecheck+lint+test+docs:check; no merge on red; one Dockerfile per deployable.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
