"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { Button } from "@shared/ui/Button";
import { useToast } from "@shared/ui/Toaster";
import { cn } from "@shared/lib/utils";
import { useResearchStream, type ResearchBrief } from "./useResearchStream";

/**
 * ResearchPanel — the Research Agent on the project dashboard.
 * Type a topic → watch the searches launch and land → get a CITED brief
 * (summary · competitors · demand · risks · opportunities · sources).
 * The brief is saved to project memory automatically, so the next run of
 * the company starts already informed. Offline briefs are labeled honestly.
 */
export function ResearchPanel({ projectId }: { projectId: string }) {
  const [topic, setTopic] = useState("");
  const research = useResearchStream(projectId);
  const { toast } = useToast();
  const valid = topic.trim().length >= 3;

  async function submit() {
    if (!valid || research.isWorking) return;
    const t = topic.trim();
    setTopic("");
    await research.start(t);
  }

  // One toast per finished brief (effect, same pattern as RunPanel).
  const [toastedId, setToastedId] = useState<string | null>(null);
  useEffect(() => {
    if (research.status === "done" && research.brief && research.brief.id !== toastedId) {
      setToastedId(research.brief.id);
      toast(`Research saved to memory — $${research.brief.costUsd.toFixed(4)}`, "success");
    }
  }, [research.status, research.brief, toastedId, toast]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
        <span className="h-1.5 w-1.5 rounded-full bg-accent2" /> research agent · sources or it didn&rsquo;t happen
      </div>

      {/* Topic line */}
      <Surface elevation="raised" className="flex items-center gap-3 px-4 py-3">
        <span className="font-mono text-accent2">›</span>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder="Research a market… e.g. AI assistants for fitness coaches"
          className="flex-1 bg-transparent font-serif text-[15.5px] text-ink outline-none placeholder:text-ink4"
          aria-label="Research topic"
        />
        <Button
          magnetic
          onClick={() => void submit()}
          disabled={!valid || research.isWorking}
          className={cn("px-4 py-2 text-[13px]", (!valid || research.isWorking) && "opacity-50")}
        >
          {research.isWorking ? "Researching…" : "Research"}
        </Button>
      </Surface>

      {/* Live progress */}
      <AnimatePresence>
        {research.isWorking && (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-2"
          >
            {research.queries.map((q) => (
              <div key={q.query} className="flex items-center gap-3 font-mono text-[11px] text-ink3">
                <span className={q.count === null ? "animate-pulse text-accent2" : "text-accent2"}>
                  {q.count === null ? "○" : "●"}
                </span>
                <span className="truncate">{q.query}</span>
                <span className="ml-auto shrink-0 text-ink4">
                  {q.count === null ? "searching…" : `${q.count} sources`}
                </span>
              </div>
            ))}
            {research.distilling && (
              <p className="pt-1 font-mono text-[11px] text-ink3" aria-live="polite">
                distilling a cited brief…
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {research.status === "error" && (
        <p className="mt-4 text-[12px] text-pink-400">
          {research.errorMessage ?? "Research failed. Please try again."}
        </p>
      )}

      {/* The brief */}
      <AnimatePresence>
        {research.status === "done" && research.brief && (
          <motion.div
            key="brief"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <BriefCard brief={research.brief} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function BriefCard({ brief }: { brief: ResearchBrief }) {
  return (
    <Surface elevation="raised" className="border-accent2/25 p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-serif text-lg text-ink">{brief.topic}</span>
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em]",
            brief.source === "live"
              ? "border-accent2/40 text-accent2"
              : "border-amber-300/40 text-amber-300",
          )}
        >
          {brief.source === "live" ? "live web research" : "offline seed — add TAVILY_API_KEY"}
        </span>
        <span className="ml-auto font-mono text-[10px] text-ink3">
          ${brief.costUsd.toFixed(4)} · saved to memory ↩
        </span>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-ink2">{brief.summary}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <SectionLabel>competitors</SectionLabel>
          <ul className="mt-1.5 space-y-1.5">
            {brief.competitors.map((c) => (
              <li key={c.name} className="text-[12.5px] text-ink2">
                <span className="text-ink">{c.name}</span> — {c.angle}
              </li>
            ))}
            {brief.competitors.length === 0 && <li className="text-[12px] text-ink4">none identified</li>}
          </ul>
          <SectionLabel className="mt-4">demand</SectionLabel>
          <p className="mt-1.5 text-[12.5px] text-ink2">{brief.demand}</p>
        </div>
        <div>
          <SectionLabel>risks</SectionLabel>
          <ul className="mt-1.5 space-y-1.5">
            {brief.risks.map((r) => (
              <li key={r} className="text-[12.5px] text-ink2">
                <span className="text-amber-300">▲</span> {r}
              </li>
            ))}
          </ul>
          <SectionLabel className="mt-4">opportunities</SectionLabel>
          <ul className="mt-1.5 space-y-1.5">
            {brief.opportunities.map((o) => (
              <li key={o} className="text-[12.5px] text-ink2">
                <span className="text-accent2">▸</span> {o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {brief.sources.length > 0 && (
        <div className="mt-5 border-t border-white/[0.07] pt-3">
          <SectionLabel>sources</SectionLabel>
          <ol className="mt-1.5 space-y-1">
            {brief.sources.map((s, i) => (
              <li key={s.url} className="truncate font-mono text-[11px] text-ink3">
                [{i + 1}]{" "}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink3 underline decoration-white/20 underline-offset-2 transition-colors hover:text-ink"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Surface>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("font-mono text-[10px] uppercase tracking-[0.16em] text-ink3", className)}>
      {children}
    </div>
  );
}
