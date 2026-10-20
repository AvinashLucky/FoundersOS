"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Surface } from "@shared/ui/Surface";
import { rise, chorus, chorusItem } from "@shared/motion/variants";

interface Overview {
  projects: number;
  runs: number;
  memories: number;
  spendUsd: number;
  avgRunCostUsd: number;
  spendByModel: Record<string, number>;
  spendByDay: Array<{ day: string; costUsd: number; runs: number }>;
  recentRuns: Array<{ id: string; intent: string; costUsd: number; createdAt: string }>;
}

async function fetchOverview(): Promise<Overview> {
  const res = await fetch("/api/v1/overview");
  if (!res.ok) throw new Error("Failed to load overview");
  return (await res.json()) as Overview;
}

/**
 * Overview — the workspace at a glance: activity + spend (financial). The kind
 * of analytics surface a funded team ships, powered by the run/cost data.
 */
export function OverviewScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: fetchOverview });

  const metrics = [
    { label: "Projects", value: data?.projects ?? 0, accent: false },
    { label: "Runs", value: data?.runs ?? 0, accent: false },
    { label: "Memories", value: data?.memories ?? 0, accent: false },
    { label: "Total spend", value: `$${(data?.spendUsd ?? 0).toFixed(4)}`, accent: true },
  ];

  return (
    <main className="mx-auto max-w-5xl px-7 py-16">
      <motion.header variants={rise} initial="hidden" animate="show" className="mb-10 flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">Workspace</div>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl">Overview</h1>
        </div>
        <div className="flex items-center gap-4 font-mono text-[12px] text-ink3">
          <Link href="/boardroom" className="text-accent2 hover:opacity-80">
            boardroom
          </Link>
          <Link href="/freelance" className="hover:text-ink">
            freelance
          </Link>
          <Link href="/projects" className="hover:text-ink">
            projects →
          </Link>
        </div>
      </motion.header>

      {/* Metric cards */}
      <motion.div variants={chorus} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <motion.div key={m.label} variants={chorusItem}>
            <Surface className="p-card">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{m.label}</div>
              <div className={`mt-3 font-serif text-3xl font-light ${m.accent ? "text-accent2" : "text-ink"}`}>
                {isLoading ? "—" : m.value}
              </div>
            </Surface>
          </motion.div>
        ))}
      </motion.div>

      {/* Spend over time — the financial pulse of the workspace */}
      <motion.div variants={rise} initial="hidden" animate="show" className="mt-6">
        <Surface className="p-card">
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-xl">Spend — last 14 days</h3>
            <span className="font-mono text-[10px] text-ink3">
              {data ? `${data.runs} runs total` : ""}
            </span>
          </div>
          <div className="mt-4">
            {data && data.spendByDay?.some((d) => d.costUsd > 0) ? (
              <SpendTrend days={data.spendByDay} />
            ) : (
              <p className="py-6 text-[13px] text-ink3">
                No spend yet this fortnight — run the company in a project and the trend appears here.
              </p>
            )}
          </div>
        </Surface>
      </motion.div>

      {/* Spend by model + recent activity */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Surface className="p-card">
          <h3 className="font-serif text-xl">Spend by model</h3>
          <p className="mt-1 text-[12px] text-ink2">
            Average run cost {`$${(data?.avgRunCostUsd ?? 0).toFixed(4)}`}. Most work routes to cheap tiers.
          </p>
          <div className="mt-4 space-y-2.5">
            {data && Object.keys(data.spendByModel).length > 0 ? (
              Object.entries(data.spendByModel).map(([model, cost]) => (
                <SpendBar key={model} model={model} cost={cost} total={data.spendUsd || 1} />
              ))
            ) : (
              <p className="py-4 text-[13px] text-ink3">No runs yet — run the company in a project.</p>
            )}
          </div>
        </Surface>

        <Surface className="p-card">
          <h3 className="font-serif text-xl">Recent runs</h3>
          <div className="mt-4 space-y-2.5">
            {data && data.recentRuns.length > 0 ? (
              data.recentRuns.map((r) => (
                <div key={r.id} className="flex items-center gap-3 border-b border-white/[0.06] pb-2.5">
                  <span className="truncate text-[13px] text-ink">{r.intent}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-ink3">${r.costUsd.toFixed(4)}</span>
                </div>
              ))
            ) : (
              <p className="py-4 text-[13px] text-ink3">Nothing yet.</p>
            )}
          </div>
        </Surface>
      </div>
    </main>
  );
}

/**
 * SpendTrend — a dependency-free bar chart (pure divs + flexbox).
 * Fourteen bars, one per day, height proportional to that day's cost.
 * Hovering a bar reveals the exact figure; today is accented.
 */
function SpendTrend({ days }: { days: Array<{ day: string; costUsd: number; runs: number }> }) {
  const max = Math.max(...days.map((d) => d.costUsd), 0.000001);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex h-28 items-end gap-1.5" role="img" aria-label="Daily spend, last 14 days">
        {days.map((d) => {
          const pct = Math.round((d.costUsd / max) * 100);
          return (
            <div key={d.day} className="group relative flex-1">
              <div
                className={`w-full rounded-t transition-colors ${
                  d.day === today
                    ? "bg-gradient-to-t from-accent to-accent2"
                    : d.costUsd > 0
                      ? "bg-white/25 group-hover:bg-white/40"
                      : "bg-white/[0.06]"
                }`}
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
              {/* tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded border border-white/15 bg-raised px-2 py-1 font-mono text-[10px] text-ink group-hover:block">
                {d.day.slice(5)} · ${d.costUsd.toFixed(4)} · {d.runs} run{d.runs === 1 ? "" : "s"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-ink4">
        <span>{days[0]?.day.slice(5)}</span>
        <span>today</span>
      </div>
    </div>
  );
}

function SpendBar({ model, cost, total }: { model: string; cost: number; total: number }) {
  const pct = Math.min(100, Math.round((cost / total) * 100));
  return (
    <div className="font-mono text-[11px] text-ink2">
      <div className="flex justify-between">
        <span>{model}</span>
        <span>${cost.toFixed(4)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent2" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
