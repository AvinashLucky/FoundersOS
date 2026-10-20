# services/ — headless backends

**Purpose.** Deployable non-UI runtimes. Today: `worker` (BullMQ). `gateway` stays unbuilt until web routes outgrow their home.

**Responsibilities.** Run long/scheduled/supervised work off the request path.

**Dependencies.** packages/{agents,ai-providers,memory,queue,db,logger}.

**Best practices.** Processors are thin adapters over package use-cases; idempotent + resumable.

> Full structural detail: see `/FounderOS-Step6-Foundation.md`.
