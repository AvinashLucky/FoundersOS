"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@shared/lib/utils";
import { useProjects } from "@features/projects/hooks";
import { useRunStream } from "@features/run/useRunStream";
import { ConversationView } from "@features/run/ConversationView";
import { AgentChorus } from "@features/command-surface/components/AgentChorus";
import type { RunTake } from "@features/run/run";
import { ROADMAP, type LaneId } from "@features/boardroom/roadmap";
import { SystemMap } from "./SystemMap";

/**
 * Demo Mode — the self-driving keynote.
 * Six acts, presented by the product itself: title → real pulse → a LIVE run
 * (the actual company debates on a real project) → the infrastructure map →
 * the roadmap → credits. An agent cursor drifts between the highlights.
 *
 * Controls: Space pause · ←/→ acts · Esc exit. Reduced-motion: cursor hides,
 * acts still advance. Everything shown is real workspace data; the only
 * exception is when no project exists yet — the run act then says so honestly.
 */
const DEPARTMENTS = [
  { abbr: "PM", name: "Product", role: "scope" },
  { abbr: "AR", name: "Architecture", role: "design" },
  { abbr: "UX", name: "Design", role: "flow" },
  { abbr: "QA", name: "QA + Security", role: "gates" },
] as const;

const DEMO_INTENT = "Design the onboarding flow";

interface Act {
  id: string;
  kicker: string;
  title: string;
  /** Fixed duration in ms; the run act manages its own advance. */
  durationMs: number | "run";
  caption: string;
}

const ACTS: Act[] = [
  { id: "title", kicker: "FounderOS", title: "One founder. A full company.", durationMs: 5500, caption: "every discipline, represented by an agent with a voice and a budget" },
  { id: "pulse", kicker: "Act I — Proof of life", title: "The workspace, by the numbers", durationMs: 6500, caption: "live figures from this workspace — not a mockup" },
  { id: "loop", kicker: "Act II — The loop, live", title: "Watch the company argue, then decide", durationMs: "run", caption: "a real run over SSE: activation → departments → debate → CEO ruling" },
  { id: "infra", kicker: "Act III — Under the hood", title: "The infrastructure we actually built", durationMs: 11000, caption: "every node on this map exists in the codebase — guards to memory" },
  { id: "roadmap", kicker: "Act IV — Trajectory", title: "Past · Present · Future", durationMs: 9000, caption: "shipped with tests · in flight · blueprinted" },
  { id: "credits", kicker: "Fin", title: "Built by the FounderOS agent company", durationMs: 9000, caption: "product · architecture · design · qa+security · finops · research · growth · coo · ceo" },
];

export function DemoMode() {
  const router = useRouter();
  const [actIdx, setActIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const act = ACTS[actIdx]!;

  const next = useCallback(
    () => setActIdx((i) => Math.min(i + 1, ACTS.length - 1)),
    [],
  );
  const prev = useCallback(() => setActIdx((i) => Math.max(i - 1, 0)), []);

  // Keyboard: Space pause · arrows · Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.push("/boardroom");
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, next, prev]);

  // Fixed-duration acts advance themselves (run act advances via callback).
  useEffect(() => {
    if (paused || act.durationMs === "run") return;
    if (actIdx === ACTS.length - 1) return; // credits: rest until replay/exit
    const t = setTimeout(next, act.durationMs);
    return () => clearTimeout(t);
  }, [actIdx, paused, act.durationMs, next]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-void"
      role="region"
      aria-label="FounderOS demo presentation"
    >
      {/* backdrop glow + dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1000px 500px at 70% -10%, rgba(109,93,246,.16), transparent 60%), radial-gradient(800px 400px at 10% 110%, rgba(34,211,238,.09), transparent 60%), radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "auto, auto, 24px 24px",
        }}
      />

      {/* progress rail */}
      <div className="relative z-10 flex items-center gap-2 px-8 pt-6">
        {ACTS.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setActIdx(i)}
            aria-label={`Go to ${a.title}`}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < actIdx ? "bg-accent2/70" : i === actIdx ? "bg-gradient-to-r from-accent to-accent2" : "bg-white/10",
            )}
          />
        ))}
        <span className="ml-3 shrink-0 font-mono text-[10px] text-ink4">
          {paused ? "⏸ paused" : "▶"} · space pause · ⇄ acts · esc exit
        </span>
      </div>

      {/* act header */}
      <div className="relative z-10 px-8 pt-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">{act.kicker}</div>
            <h1 className="mt-3 font-serif text-3xl font-light tracking-tight text-ink sm:text-5xl">{act.title}</h1>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* act body */}
      <div className="relative z-10 mx-auto mt-8 w-full max-w-5xl flex-1 overflow-y-auto px-8 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={act.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {act.id === "title" && <TitleAct />}
            {act.id === "pulse" && <PulseAct />}
            {act.id === "loop" && <LoopAct paused={paused} onFinished={next} />}
            {act.id === "infra" && <SystemMap />}
            {act.id === "roadmap" && <RoadmapAct />}
            {act.id === "credits" && <CreditsAct onReplay={() => setActIdx(0)} onExit={() => router.push("/boardroom")} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* caption */}
      <div className="relative z-10 border-t border-white/[0.07] px-8 py-4 text-center font-mono text-[11px] text-ink3">
        {act.caption}
      </div>
    </div>
  );
}

/* ── Act 1 · Title ──────────────────────────────────────────────────────── */

function TitleAct() {
  const chips = ["Product", "Architecture", "Design", "QA + Security", "FinOps", "Research", "Growth", "COO", "CEO"];
  return (
    <div className="grid place-items-center pt-10">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent2 shadow-[0_0_60px_rgba(109,93,246,.5)]">
        <span className="font-serif text-2xl text-accent-ink">F</span>
      </div>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        className="mt-10 flex max-w-xl flex-wrap justify-center gap-2"
      >
        {chips.map((c) => (
          <motion.span
            key={c}
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            className="rounded-full border border-white/[0.13] px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink3"
          >
            {c}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Act 2 · Pulse (real numbers) ───────────────────────────────────────── */

interface Overview {
  projects: number;
  runs: number;
  memories: number;
  spendUsd: number;
}

function PulseAct() {
  const { data } = useQuery({
    queryKey: ["overview"],
    queryFn: async (): Promise<Overview> => {
      const res = await fetch("/api/v1/overview");
      if (!res.ok) throw new Error("overview failed");
      return (await res.json()) as Overview;
    },
  });

  const metrics = [
    { label: "Projects", value: data?.projects ?? 0 },
    { label: "Company runs", value: data?.runs ?? 0 },
    { label: "Memories", value: data?.memories ?? 0 },
    { label: "Total spend", value: `$${(data?.spendUsd ?? 0).toFixed(4)}`, accent: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 pt-6 lg:grid-cols-4">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          className="rounded-2xl border border-white/[0.09] bg-white/[0.03] p-6 text-center backdrop-blur-xl"
        >
          <div className={cn("font-serif text-5xl font-light", m.accent ? "text-accent2" : "text-ink")}>{m.value}</div>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{m.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Act 3 · The loop, live ─────────────────────────────────────────────── */

function LoopAct({ paused, onFinished }: { paused: boolean; onFinished: () => void }) {
  const projects = useProjects();
  const project = useMemo(
    () => (projects.data ?? []).find((p) => p.status === "active"),
    [projects.data],
  );
  const stream = useRunStream(project?.id ?? "");
  const startedRef = useRef(false);

  // Fire the real run once, when a stage exists.
  useEffect(() => {
    if (project && !startedRef.current) {
      startedRef.current = true;
      void stream.start(DEMO_INTENT);
    }
  }, [project, stream]);

  // Advance a few seconds after the decision (or on error); hard cap 60s.
  useEffect(() => {
    if (paused) return;
    if (stream.status === "done" || stream.status === "error") {
      const t = setTimeout(onFinished, 5000);
      return () => clearTimeout(t);
    }
    const cap = setTimeout(onFinished, 60000);
    return () => clearTimeout(cap);
  }, [stream.status, paused, onFinished]);

  // No stage yet — say so honestly and move on.
  useEffect(() => {
    if (!projects.isLoading && !project && !paused) {
      const t = setTimeout(onFinished, 6000);
      return () => clearTimeout(t);
    }
  }, [projects.isLoading, project, paused, onFinished]);

  if (!projects.isLoading && !project) {
    return (
      <p className="pt-10 text-center text-[14px] text-ink2">
        The theater needs a stage — create your first project and this act performs a live run on it.
      </p>
    );
  }

  const activated = stream.plan?.activated ?? DEPARTMENTS.map((d) => d.abbr);
  const agents = DEPARTMENTS.map((d) => ({
    ...d,
    done: Boolean(stream.progress[d.abbr]),
    idle: stream.plan ? !activated.includes(d.abbr) : false,
  }));
  const takes: RunTake[] = DEPARTMENTS.filter((d) => stream.progress[d.abbr]).map((d) => {
    const p = stream.progress[d.abbr]!;
    return { abbr: d.abbr, role: p.role, modelId: p.modelId, costUsd: p.costUsd, preview: p.preview };
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between font-mono text-[10.5px] text-ink3">
        <span>
          stage: <span className="text-ink">{project?.name ?? "…"}</span> · intent: “{DEMO_INTENT}”
        </span>
        <span aria-live="polite">
          {stream.status === "done"
            ? `decision shipped · $${stream.run?.costUsd.toFixed(4) ?? "0"} · remembered`
            : stream.synthesizing
              ? "ceo weighing the debate…"
              : stream.critiques.length > 0
                ? "departments debating…"
                : "departments working…"}
        </span>
      </div>
      <AgentChorus agents={agents} />
      <div className="mt-5">
        <ConversationView
          data={{
            plan: stream.plan,
            takes,
            debate: stream.critiques,
            answer: stream.run?.answer ?? null,
            costUsd: stream.run?.costUsd,
            live: stream.isWorking,
            synthesizing: stream.synthesizing,
          }}
        />
      </div>
      {stream.status === "error" && (
        <p className="mt-4 text-center text-[12px] text-pink-400">{stream.errorMessage}</p>
      )}
    </div>
  );
}

/* ── Act 5 · Roadmap ────────────────────────────────────────────────────── */

function RoadmapAct() {
  return (
    <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
      {(Object.keys(ROADMAP) as LaneId[]).map((lane, li) => {
        const data = ROADMAP[lane];
        return (
          <motion.div
            key={lane}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: li * 0.15 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink2">
              <span
                className={cn(
                  "h-[7px] w-[7px] rounded-full",
                  lane === "past" ? "bg-emerald-400" : lane === "present" ? "bg-accent2" : "bg-white/25",
                )}
              />
              {data.label}
              <span className="ml-auto text-[9.5px] normal-case tracking-normal text-ink4">{data.note}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {data.items.slice(0, 4).map((item) => (
                <li key={item.id} className="text-[12.5px] leading-snug text-ink2">
                  {lane === "past" ? <span className="text-emerald-400">✓ </span> : lane === "present" ? <span className="text-accent2">● </span> : <span className="text-ink4">○ </span>}
                  {item.title}
                </li>
              ))}
              {data.items.length > 4 && (
                <li className="font-mono text-[10px] text-ink4">+ {data.items.length - 4} more</li>
              )}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Act 6 · Credits ────────────────────────────────────────────────────── */

function CreditsAct({ onReplay, onExit }: { onReplay: () => void; onExit: () => void }) {
  return (
    <div className="grid place-items-center gap-6 pt-10 text-center">
      <p className="max-w-md text-[14.5px] leading-relaxed text-ink2">
        Everything you just watched — the debate, the guards, the receipts, the memory — is running
        code, verified by tests. Not a pitch deck. A company.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onReplay}
          className="rounded-md bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 text-[13px] font-semibold text-accent-ink"
        >
          ↺ Replay
        </button>
        <button
          onClick={onExit}
          className="rounded-md border border-white/[0.15] px-5 py-2.5 text-[13px] text-ink2 transition-colors hover:text-ink"
        >
          Enter the Boardroom
        </button>
      </div>
    </div>
  );
}
