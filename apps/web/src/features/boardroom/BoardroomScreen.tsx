"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Surface } from "@shared/ui/Surface";
import { Button } from "@shared/ui/Button";
import { chorus, chorusItem, rise } from "@shared/motion/variants";
import { cn } from "@shared/lib/utils";
import { useProjects } from "@features/projects/hooks";
import { useRunStream } from "@features/run/useRunStream";
import { ConversationView } from "@features/run/ConversationView";
import { AgentChorus } from "@features/command-surface/components/AgentChorus";
import type { RunTake } from "@features/run/run";
import { ROADMAP, THEATER_INTENTS, type LaneId } from "./roadmap";
import { EnginePanel } from "./EnginePanel";

const DEPARTMENTS = [
  { abbr: "PM", name: "Product", role: "scope" },
  { abbr: "AR", name: "Architecture", role: "design" },
  { abbr: "UX", name: "Design", role: "flow" },
  { abbr: "QA", name: "QA + Security", role: "gates" },
] as const;

interface Overview {
  projects: number;
  runs: number;
  memories: number;
  spendUsd: number;
}

async function fetchOverview(): Promise<Overview> {
  const res = await fetch("/api/v1/overview");
  if (!res.ok) throw new Error("Failed to load overview");
  return (await res.json()) as Overview;
}

/**
 * The Boardroom — Mission Control, live inside the product.
 * Three acts on one calm surface:
 *   1. PULSE   — the workspace's real numbers (projects · runs · memories · spend).
 *   2. THEATER — pick a project, fire a real intent, and watch the actual
 *                company run: activation → departments → debate → CEO ruling,
 *                streamed over the same SSE pipe the dashboard uses. Nothing
 *                is simulated; this is the product demonstrating itself.
 *   3. LANES   — Past / Present / Future, the roadmap as a living surface.
 */
export function BoardroomScreen() {
  const overview = useQuery({ queryKey: ["overview"], queryFn: fetchOverview });

  return (
    <main className="mx-auto max-w-6xl px-7 py-16">
      {/* Header */}
      <motion.header
        variants={rise}
        initial="hidden"
        animate="show"
        className="mb-10 flex items-end justify-between gap-4"
      >
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">
            The company, live
          </div>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl">
            Boardroom
          </h1>
        </div>
        <nav className="flex items-center gap-4 font-mono text-[12px] text-ink3">
          <Link href="/projects" className="transition-colors hover:text-ink">projects</Link>
          <Link href="/overview" className="transition-colors hover:text-ink">overview</Link>
          <Link href="/delivery" className="transition-colors hover:text-ink">delivery</Link>
          <Link href="/freelance" className="transition-colors hover:text-ink">freelance</Link>
          <Link
            href="/demo"
            className="rounded-md bg-gradient-to-br from-accent to-accent2 px-3.5 py-2 text-[12px] font-semibold text-accent-ink"
          >
            ▶ Present
          </Link>
        </nav>
      </motion.header>

      {/* 1 · Pulse */}
      <motion.div variants={chorus} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Projects", value: overview.data?.projects },
          { label: "Runs", value: overview.data?.runs },
          { label: "Memories", value: overview.data?.memories },
          { label: "Total spend", value: overview.data ? `$${overview.data.spendUsd.toFixed(4)}` : undefined, accent: true },
        ].map((m) => (
          <motion.div key={m.label} variants={chorusItem}>
            <Surface className="p-card">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{m.label}</div>
              <div className={cn("mt-3 font-serif text-3xl font-light", m.accent ? "text-accent2" : "text-ink")}>
                {m.value ?? "—"}
              </div>
            </Surface>
          </motion.div>
        ))}
      </motion.div>

      {/* 1b · Engine room — what the company is actually thinking with */}
      <div className="mt-6">
        <EnginePanel />
      </div>

      {/* 2 · Theater */}
      <div className="mt-8">
        <Theater />
      </div>

      {/* 3 · Lanes */}
      <div className="mt-12">
        <div className="mb-5 flex items-baseline gap-4">
          <h2 className="font-serif text-2xl font-light">Past · Present · Future</h2>
          <span className="font-mono text-[10.5px] text-ink3">the roadmap, honestly</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(Object.keys(ROADMAP) as LaneId[]).map((lane) => (
            <Lane key={lane} lane={lane} />
          ))}
        </div>
      </div>
    </main>
  );
}

/* ── Theater: a REAL run, staged ────────────────────────────────────────── */

function Theater() {
  const projects = useProjects();
  const active = useMemo(
    () => (projects.data ?? []).filter((p) => p.status === "active"),
    [projects.data],
  );
  const [projectId, setProjectId] = useState<string>("");
  const chosen = projectId || active[0]?.id || "";
  const stream = useRunStream(chosen);

  const activated = stream.plan?.activated ?? DEPARTMENTS.map((d) => d.abbr);
  const agents = DEPARTMENTS.map((d) => ({
    ...d,
    done: Boolean(stream.progress[d.abbr]),
    idle: stream.plan ? !activated.includes(d.abbr) : false,
  }));

  const liveTakes: RunTake[] = DEPARTMENTS.filter((d) => stream.progress[d.abbr]).map((d) => {
    const p = stream.progress[d.abbr]!;
    return { abbr: d.abbr, role: p.role, modelId: p.modelId, costUsd: p.costUsd, preview: p.preview };
  });

  const caption = !stream.isWorking
    ? stream.status === "done"
      ? "decision shipped — every message below really happened"
      : "fire an intent and watch the real company work"
    : stream.synthesizing
      ? "ceo weighing the debate…"
      : stream.critiques.length > 0
        ? "departments debating…"
        : "departments working…";

  return (
    <Surface elevation="raised" className="p-card">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
          <span className={cn("h-1.5 w-1.5 rounded-full bg-accent2", stream.isWorking && "animate-pulse")} />
          run theater · live, not a video
        </div>
        <span className="ml-auto font-mono text-[10.5px] text-ink4">{caption}</span>
      </div>

      {/* No projects yet → the theater needs a stage */}
      {!projects.isLoading && active.length === 0 && (
        <div className="mt-5 grid place-items-center gap-3 py-10 text-center">
          <p className="max-w-sm text-[13.5px] text-ink2">
            The theater runs on a real project. Create your first and come back — the company will
            perform on it, for real.
          </p>
          <Link href="/projects">
            <Button className="px-5 py-2.5 text-[13px]">Go to projects</Button>
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <>
          {/* Stage controls */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink3" htmlFor="stage-project">
              stage
            </label>
            <select
              id="stage-project"
              value={chosen}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={stream.isWorking}
              className="rounded-md border border-white/15 bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-accent2"
            >
              {active.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {THEATER_INTENTS.map((intent) => (
                <button
                  key={intent}
                  onClick={() => void stream.start(intent)}
                  disabled={stream.isWorking || !chosen}
                  className={cn(
                    "rounded-md border border-white/12 px-3 py-2 font-mono text-[11px] text-ink3 transition-colors",
                    stream.isWorking ? "opacity-40" : "hover:border-accent2/50 hover:text-ink",
                  )}
                >
                  › {intent}
                </button>
              ))}
            </div>
          </div>

          {/* The company */}
          <div className="mt-5">
            <AgentChorus agents={agents} />
          </div>

          {/* The conversation, live */}
          <AnimatePresence>
            {(stream.isWorking || stream.status === "done") && (
              <motion.div
                key="conv"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6"
              >
                <ConversationView
                  data={{
                    plan: stream.plan,
                    takes: liveTakes,
                    debate: stream.critiques,
                    answer: stream.run?.answer ?? null,
                    costUsd: stream.run?.costUsd,
                    live: stream.isWorking,
                    synthesizing: stream.synthesizing,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {stream.status === "error" && (
            <p className="mt-4 text-[12px] text-pink-400">
              {stream.errorMessage ?? "The run failed. Please try again."}
            </p>
          )}
        </>
      )}
    </Surface>
  );
}

/* ── Lanes ──────────────────────────────────────────────────────────────── */

function Lane({ lane }: { lane: LaneId }) {
  const data = ROADMAP[lane];
  const dot =
    lane === "past" ? "bg-emerald-400" : lane === "present" ? "bg-accent2 shadow-[0_0_10px_var(--tw-shadow-color)] shadow-cyan-400/60" : "bg-white/25";

  return (
    <Surface className="p-4">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink2">
        <span className={cn("h-[7px] w-[7px] rounded-full", dot)} />
        {data.label}
        <span className="ml-auto text-[10px] normal-case tracking-normal text-ink4">{data.note}</span>
      </div>
      <motion.ul variants={chorus} initial="hidden" animate="show" className="mt-3 space-y-2.5">
        {data.items.map((item) => (
          <motion.li key={item.id} variants={chorusItem}>
            <div
              className={cn(
                "rounded-lg border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20",
                lane === "present" && "border-accent2/25",
                lane === "future" && "opacity-75",
              )}
            >
              <div className="text-[13px] leading-snug text-ink">
                {lane === "past" && <span className="text-emerald-400">✓ </span>}
                {lane === "present" && <span className="text-accent2">● </span>}
                {item.title}
              </div>
              <div className="mt-1.5 flex items-center gap-2 font-mono text-[9.5px] text-ink4">
                <span className="rounded border border-white/[0.09] px-1.5 py-0.5 text-ink3">{item.department}</span>
                <span className="truncate">{item.detail}</span>
              </div>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </Surface>
  );
}
