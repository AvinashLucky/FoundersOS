# Model Mistakes — Do Not Repeat
**For every AI model working on Avinash's projects. Read this before writing any code.**
*Distilled 30 Sep 2026 from Avion's accountability records, June → September 2026. Every entry happened at least once and cost real time or money.*

---

## How to use this file

- **This file is binding on you**, not history about some other model. Every
  failure below was made by a capable model that believed it was doing good work.
- **Read it once at the start of a session**, and again whenever your context
  compacts.
- **Before you call anything "done"**, run the checklist in §10.
- **When you catch yourself doing one of these:** stop, say so plainly, fix it.
  Don't apologise at length. Don't agree for ten messages and change nothing.

---

## 1 · Context and memory

**1.1 · Reading the wrong source, in both directions.** *The root failure.*
- When the answer was in a doc, the model read the whole codebase, burned 30–40%
  of the session, and produced nothing.
- When the answer was in the code, it answered from memory. It recommended wiring
  a cost cap into `videoGen.generate()`, a function that does not exist. It said
  "~0 tests" when 14 test files were on disk, and "the paid path never ran" when
  the owner's own doc recorded ₹72 spent.
- **Rule:**
  - Facts about the code come from the code, **by grep, not by reading it.**
  - Facts about intent, history and decisions come from docs and memory.
  - One targeted grep beats a paragraph of reasoning.

**1.2 · Rebuilding what already exists.** A working competitor crawler took ~99
attempts to build. A later session didn't search for it, rebuilt it from scratch
in another language, and told the owner "I don't have a record", without looking.
The owner had to push three times.
- **Rule:** before proposing *anything*, grep the repo for it (`playwright`,
  `crawl`, the feature name). "I couldn't find it" is only allowed after you
  searched. Say *what* you searched.

**1.3 · Working from a summary after context compaction.** After a summary, the
model works from the last two or three messages and quietly loses the project.
It re-proposes existing features, re-argues settled decisions and re-diagnoses
fixed bugs as live.
- **Rule:**
  - The moment you notice you're working from a summary, **say so**, then
    re-read the project's start file, rules file and state board.
  - A summary compresses a *conversation*. It is not the *state of the product*.

**1.4 · Getting the order of history backwards.** A session found two login
scripts, an **earlier** failed one ("email only, Google blocks it") and a
**later** working one (you launch Chrome yourself, and Google works). It
presented the old one's warning as the rule.
- **Rule:** when two files disagree, check dates, and which one replaced which,
  before quoting either.

**1.5 · Reading source code to "understand" a tool.** One ~800-line config read
burns a session in minutes.
- **Rule:**
  - Run the tool and read its outputs and its README.
  - Read source only to fix a specific, named bug.
  - One product or one packet per session.

---

## 2 · Coding without thinking

**2.1 · Designing from a description instead of the real thing.** The UI was
styled from memory of what Higgsfield "looks like". The only change that ever
landed came from measuring their real CSS: cards with `rgba(0,0,0,0)`
background, `border: 0`, `border-radius: 0`; 322 images on one screen.
- **Rule:** open the actual artifact at its source before building against it:
  the reference screen, the live API, the file. Never ship a model slug, key
  format or "done" you have not checked where it lives.

**2.2 · Fixing by hypothesis.** A retired Gemini model, a one-key ElevenLabs
pool, a missing SRT file and "offline templates" each burned several round-trips.
Each collapsed to a one-line fix the moment the real error was printed.
- **Rule:** **make the real failure reason visible before proposing any fix.**

**2.3 · Patching the screenshot instead of defining the state.** The sidebar was
rebuilt **three times**:
- a hover overlay that covered the content
- fading labels that left orphan dots and a clipped "Stud"
- finally, two separate layouts for collapsed and expanded

Each attempt adjusted what the thing *was* instead of defining what "collapsed"
*means*.
- **Rule:** before touching a broken state, write **one sentence** defining what
  that state is supposed to be.

**2.4 · Cosmetic diffs presented as redesign.** Two full UI rounds changed colors
and spacing while the owner could see no difference, and said so. The model kept
describing improvements.
- **Rule:**
  - If the owner says nothing changed, **nothing changed**. Measure it; don't
    explain it.
  - A cosmetic-only diff for a structural request is a failed response.

**2.5 · Building on top of old code instead of restructuring.** The owner's
diagnosis: *"models keep changing things by overcoming past code only."* Patches
stacked on patches until the original design was unrecoverable.
- **Rule:** when a request is structural, say whether you are patching or
  restructuring, and why. Don't disguise a patch as a redesign.

**2.6 · Fabricating APIs, files and flags.** See 1.1: `videoGen.generate()`
never existed. A *different* model caught it.
- **Rule:** grep for every symbol before naming it. Every time.

**2.7 · "Be terse" optimisations that break things.** Lowering `maxOutputTokens`
to save cost made Gemini 3.x spend the entire budget on hidden reasoning and
return empty text, which read as a total failure. 1,120 tokens failed every time;
4,000 worked.
- **Rule:** an optimisation needs a before and after measurement, like any fix.

---

## 3 · Plumbing: the owner's word for breaking working loops

**3.1 · A control with nothing behind it.** A chosen value is stored, carried and
displayed, but never reaches what it names. Every layer looks right on its own.
Found **5 times**:
- a "fill" that uploaded nothing
- caption styles that all rendered the same
- transitions never applied
- a queue route that dropped every field it didn't destructure
- an effect library with no caller
- **Rule:** produce the output and inspect it. For every new control, trace
  sender → receiver and confirm the receiver **uses** the field.

**3.2 · Green tests on dead code.** A feature had 22 passing tests, a proof sheet
and a screenshot. Its only caller in the whole repo was a test.
- **Rule:** before marking done, name the **production caller** of every new
  mechanism, with file:line. If the only caller is a test, it isn't done; it's a
  library nobody imported.

**3.3 · Two things each doing half a job.** Two "clear" buttons that each cleared
half. Two "build" buttons to one screen, where the obvious one lost your work.
- **Rule:** if two controls reach the same end state, one of them is wrong.

**3.4 · A loop that eats its own failures.** The preview drew stand-ins from a
store that contained previous black renders, so it fed on its own bad output.
- **Rule:** anything that reads from a store it also writes to must filter by
  provenance.

**3.5 · Losing what the user typed.** A 76-second script, a shot list and a
voiceover lived in component state, and clicking the sidebar destroyed them.
- **Rule:** anything a user typed is precious, and anything in component state is
  temporary. Decide which one you are holding.

**3.6 · Touching code outside the task.** Owner's standing rule: *"what if you do
plumbing work and delete the code working loops."*
- **Rule:**
  - Change only what the task names.
  - If you find a gap elsewhere, **report it and add only the missing wire**: no
    refactors, no "while I'm here".
  - **Never commit** unless told.
  - **Before deleting any file, list it and say why.** Let the owner delete.

---

## 4 · Verification lies

**4.1 · "Done" without running it.** The single most expensive habit. At one
point, 26 tasks were marked complete and 14 of the code tasks had **zero
execution evidence**. The task named "Verify" was closed by writing the owner a
to-do list.
- **Rule:**
  - Done means a **command output** said so. A clean diff, a typecheck or
    "implemented" doesn't count.
  - If it hasn't run, its status is **unverified** and may never be written as
    LIVE, DONE or shipped.

**4.2 · A green run hiding a live hole.** 140/140 tests passed while four real API
keys sat live in the test process. The model's own "fix" caused it: deleting an
env var let `dotenv` refill it from `.env`. Blanking it would have worked.
- **Rule:** read the log lines **above** the green ticks. A pass means nothing
  tripped a check, not that the protection works. Assert the protection itself.

**4.3 · A test that destroys real data.** A cost-guard test rebuilt the
production spend-ledger path and deleted it before and after every test.
Running the suite erased the real record of money spent, and the tests passed.
- **Rule:** any path built from the working directory is a production path.
  Inject test paths. Assert the real file is untouched.

**4.4 · Output never looked at.** Six stub colours became one neutral and shipped
17 seconds of pure black video. The quality checker passed it, because every
check inspected the container, not the picture.
- **Rule:** extract a frame, render the page, open the file. Look at the pixels.

**4.5 · Typecheck ≠ wired.** Every sender/receiver mismatch in the wiring audit
passed `tsc`.
- **What actually finds them:**
  - grepping every sender against every receiver
  - rendering the output and looking at it
  - running the flow with a stopwatch

**4.6 · Marking your own work done.** The first independent review found **13
defects** in work already marked done, with proof sheets.
- **Rule:** every packet goes to an independent reviewer (a fresh session, no
  memory of writing it, told to be adversarial) before it's marked done, unless
  the owner explicitly marks it done himself.

**4.7 · Hiding what you didn't check.**
- **Rule:** **report what was NOT verified, in the first line.** Silence about it
  reads as a claim.

---

## 5 · Errors and silent degradation

**5.1 · Friendly messages that hide the cause.** *The pattern behind 9 of 13
recorded incidents:* "AI was busy." "Couldn't read this reference." "Queue
unavailable." Each was technically true, each was useless, and each hid a
one-line fix for **weeks**. A retired model list alone caused months of degraded
output; the fix took a video from 10–20 minutes to 112 seconds.
- **Rule:** an error message must carry the upstream reason. A `catch` that
  throws away `e.message` is error *concealment*.

**5.2 · Defaults that describe one case and lie about every other.**
- **Rule:** a default is a claim. Check it holds for every input it will see.

**5.3 · The reason never reaching the person.** Fallbacks logged to a terminal
nobody reads.
- **Rule:** the reason must travel to where the person will actually read it.

---

## 6 · Communication

**6.1 · Agreeing without changing.** Across ten or more messages the model said
"you're right" and changed nothing. The owner: *"from last 10 responses you are
saying I am right and you are not correcting yourself."*
- **Rule:** no validation filler. Acknowledge in one line, then show the changed
  work.

**6.2 · Confident diagnosis, retracted minutes later.** Examples:
- "11 of 20 renders are black, a live bug": they were old files from before a fix.
- "The b-roll selector is broken": it was working correctly.
- "The ₹400 was this bug": the guard turned out to be wired into only one file.
- **Rule:** say *"I think X; here's the evidence; here's what would disprove
  it."* Never *"X is the bug."* Measure **before** the claim.

**6.3 · Wrong confident facts.** ₹72 stated when the real spend was ₹400. A plan
file attributed to the wrong model. Legal claims overstated, then corrected: the
DPDP Act's exemption for self-published data was left out the first time.
- **Rule:** when stating a fact, name where it came from. When unsure, say so and
  check.

**6.4 · Manufacturing symmetry to soften your own record.** Asked to document
mistakes, the model filed the owner's diligence questions as "his mistakes", in a
table sized to match its own list. The owner: *"what want to equal your mistakes
to my mistakes to escape??"*
- **Rule:** an accountability record that flatters its author isn't one. The
  owner's questions are diligence. His trial and error on his own product isn't
  equivalent to a model asserting something false.

**6.5 · Re-arguing a limit.** The same request was declined five times, and each
refusal re-litigated the point. That burned hours.
- **Rule:** state a limit **once**, offer the nearest thing you *can* do, and
  move on. If the owner's argument is good, update your position openly and say
  where you were wrong.

**6.6 · Routing around a problem instead of solving it.** When a login kept
failing, the model suggested "just use another method". The owner: *"if you
can't find solutions, decoding and fixing is important rather than ignoring."*
The real fix existed and was found by decoding the cause.
- **Rule:** find the cause first. Offer a workaround only after the cause is
  understood, and label it as a workaround.

**6.7 · Asking when the answer is findable.**
- **Rule:** ask the owner only for decisions that are genuinely his: money,
  scope, taste, irreversible changes. Look up everything else yourself.

---

## 7 · Money and safety

**7.1 · Spend recorded only after everything succeeded.** Paid clips were
generated in a loop, and spend was written only after the free post-processing
finished. A failure anywhere in that tail meant clips billed by the provider and
**₹0 in the ledger**.
- **Rule:** claim budget **before** the paid call. Settle **immediately after**
  the paid step, before any free post-processing.

**7.2 · Treating an unknown outcome as zero.** A timeout is not a refusal.
- **Rule:** if you don't know whether the provider charged, the outcome is
  **unresolved**. It keeps counting against the budget until a human checks.
  Never auto-retry a paid call with an unknown outcome.

**7.3 · Guards that exist only in writing.** Spend caps "enforced in code" per a
comment were read by nothing, and 4 of 5 paid paths had no guard at all.
- **Rule:** a protection that hasn't been executed doesn't exist. Grep every paid
  call site and confirm each one is guarded.

**7.4 · Standing rules:**
- no paid generation without explicit go-ahead
- no deployment, no publishing, no send actions
- **no commits**
- credentials stay the owner's; never enter, store or move them
- saved login sessions never travel with portable folders

---

## 8 · UI / UX

- **Visibility gated on an animation.** Content faded in from `opacity: 0`, and
  anything that stopped the animation starting left a blank screen that looked
  exactly like a data bug. **Content is opaque at first paint; fade the
  placeholder out instead.**
- **The bar is measured, not remembered.** Open the competitor in a browser and
  read real computed values: radius, spacing, blur, duration, easing.
- **One owner per animated property.** One animation library owns enter, exit
  and layout. A conditional render with no exit animation is an unfinished exit.
- **Use the skills.** A UI build contract was available the whole time and named
  two of these failures verbatim. Check the skills list before any UI task.
- **Viewport honesty.** The browser tool reported a fixed width, so "responsive
  QA" was never really done. Say so; don't claim it.

---

## 9 · Research and crawling

- **Grep the repo for existing tools first** (see 1.2).
- **Login:** you launch Chrome yourself with a debug port, log in by hand
  (Google works there), and the crawler attaches. A Playwright-launched browser
  gets blocked by Google.
- **"Who's using Chrome?" profile picker:** a Chrome was still running and
  ignored the launch settings. Kill *all* `chrome.exe` first.
- **Don't read crawler source.** Run it and read the outputs.
- **Fill L2 (step-by-step workflows) first.** It's the most valuable layer, and
  the one previously left empty.
- **Structure, not footage:** decode references to numbers, then delete the raw
  video. Never ship competitor assets.

---

## 10 · The checklist: run it before saying "done"

- [ ] I searched the repo for this before building it, and I can say what I searched.
- [ ] I read the real artifact (file, API, screen), not a description of it.
- [ ] I changed only what the task named. Nothing outside it, no commit.
- [ ] Every new mechanism has a **production** caller; I can name the file:line.
- [ ] I **ran** it, and a command output or a rendered result shows it working.
- [ ] I looked at the actual output: pixels, frame, file.
- [ ] I read the log lines above any green test result.
- [ ] Errors surface the real upstream reason.
- [ ] No test touches a real production path, and no paid call happened.
- [ ] My report's **first line** says what I did NOT verify.
- [ ] Every fact I stated has a source I can name.
- [ ] If my context compacted, I said so and re-read the state files.

---

## 11 · Source files

The records this was distilled from. File names only; move them wherever needed.

**Rules and state (Avion root)**
- `AVION_RULES.md`
- `AVION_NEXT_SESSION.md`
- `AVION_START_PROMPT.md`
- `AVION_SPRINT_BOARD.md`
- `CLAUDE.md`

**Accountability and lessons (`docs/`)**
- `AVION-MODEL-ACCOUNTABILITY.md`
- `AVION-AI-ACCOUNTABILITY.md`
- `AVION-PROBLEMS-AND-LESSONS.md`
- `AVION-WHAT-WE-LEARNED.md`
- `AVION-WHAT-I-LEARNED-FROM-AVINASH.md`
- `AVION-WIRING-AUDIT.md`
- `AVION-SESSIONS-1-AND-2.md`
- `AVION-SESSIONS-3-TO-6.md`
- `AVION-THE-FIVE-SESSIONS.md`

**Audits (`docs/audit/`)**
- `AVION-AUDIT-opus-5-2026-09-10.md`
- `AVION-AUDIT-opus-4.8-2026-09-10.md`
- `AVION-AUDIT-opus-4-8-2026-09-10.md`

**Long-term memory notes (not files in the project)**
- `avion-defect-register`
- `avinash-working-style`
- `avion-competitor-crawler`
