"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { Button } from "@shared/ui/Button";
import { useToast } from "@shared/ui/Toaster";
import { AgentChorus } from "@features/command-surface/components/AgentChorus";
import { ExecutiveAnswer } from "@features/command-surface/components/ExecutiveAnswer";
import { useRuns, type RunRecord, type RunTake } from "./run";
import { useRunStream } from "./useRunStream";
import { ConversationView, type ConversationData } from "./ConversationView";

const DEPARTMENTS = [
  { abbr: "PM", name: "Product", role: "scope" },
  { abbr: "AR", name: "Architecture", role: "design" },
  { abbr: "UX", name: "Design", role: "flow" },
  { abbr: "QA", name: "QA + Security", role: "gates" },
] as const;

/**
 * RunPanel — the loop, live and argumentative.
 * Type an intent → the COO's plan appears → departments take positions → they
 * DEBATE each other (challenges and concerns stream in, visibly tense) → the
 * CEO rules, explicitly resolving the disagreements. The whole conversation
 * streams live, is persisted with the run, and every past run in history can
 * be opened to replay its transcript.
 */
export function RunPanel({ projectId }: { projectId: string }) {
  const [intent, setIntent] = useState("");
  const stream = useRunStream(projectId);
  const history = useRuns(projectId);
  const { toast } = useToast();
  const valid = intent.trim().length >= 3;

  async function submit() {
    if (!valid || stream.isWorking) return;
    const text = intent.trim();
    setIntent("");
    await stream.start(text);
  }

  // Toast once per finished run (id changes each run).
  const [toastedRunId, setToastedRunId] = useState<string | null>(null);
  useEffect(() => {
    if (stream.status === "done" && stream.run && stream.run.id !== toastedRunId) {
      setToastedRunId(stream.run.id);
      toast(`Run complete — $${stream.run.costUsd.toFixed(4)}, remembered`, "success");
    }
  }, [stream.status, stream.run, toastedRunId, toast]);

  const activated = stream.plan?.activated ?? DEPARTMENTS.map((d) => d.abbr);
  const agents = DEPARTMENTS.map((d) => ({
    ...d,
    done: Boolean(stream.progress[d.abbr]),
    idle: stream.plan ? !activated.includes(d.abbr) : false,
  }));
  const doneCount = Object.keys(stream.progress).length;

  // Live conversation data, assembled from stream events as they arrive.
  const liveTakes: RunTake[] = DEPARTMENTS.filter((d) => stream.progress[d.abbr]).map((d) => {
    const p = stream.progress[d.abbr]!;
    return { abbr: d.abbr, role: p.role, modelId: p.modelId, costUsd: p.costUsd, preview: p.preview };
  });
  const liveConversation: ConversationData = {
    plan: stream.plan,
    takes: liveTakes,
    debate: stream.critiques,
    answer: stream.run?.answer ?? null,
    costUsd: stream.run?.costUsd,
    live: stream.isWorking,
    synthesizing: stream.synthesizing,
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
        <span className="h-1.5 w-1.5 rounded-full bg-accent2" /> run the company
      </div>

      {/* Command line */}
      <Surface elevation="raised" className="flex items-center gap-3 px-4 py-3">
        <span className="font-mono text-accent2">›</span>
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder="Describe what you want… e.g. Design the onboarding flow"
          className="flex-1 bg-transparent font-serif text-[16px] text-ink outline-none placeholder:text-ink4"
        />
        <Button
          magnetic
          onClick={() => void submit()}
          disabled={!valid || stream.isWorking}
          className={`px-4 py-2 text-[13px] ${!valid || stream.isWorking ? "opacity-50" : ""}`}
        >
          {stream.isWorking ? "Running…" : "Run"}
        </Button>
      </Surface>

      {/* Live: company at work + the conversation growing message by message */}
      <AnimatePresence mode="wait">
        {stream.isWorking && (
          <motion.div
            key="working"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
              {stream.synthesizing
                ? "ceo weighing the debate…"
                : stream.critiques.length > 0
                  ? "departments debating…"
                  : `company at work… ${doneCount}/${activated.length} departments done`}
            </div>
            <AgentChorus agents={agents} />
            <div className="mt-5">
              <ConversationView data={liveConversation} />
            </div>
          </motion.div>
        )}

        {/* Done: the decision headline + the full transcript beneath it */}
        {stream.status === "done" && stream.run && (
          <motion.div key="answer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
            <ExecutiveAnswer
              meta={[
                { value: String(stream.run.departments.length), label: "departments" },
                { value: String((stream.run.debate ?? stream.critiques).length), label: "debate msgs" },
                { value: `$${stream.run.costUsd.toFixed(4)}`, label: "cost" },
                { value: "↩", label: "remembered" },
              ]}
            >
              {stream.run.answer}
            </ExecutiveAnswer>

            {stream.degraded && (
              <p className="mt-2 font-mono text-[10.5px] text-ink3">
                ⚖ budget governor: synthesis ran on a cheaper tier to respect this run&rsquo;s cost cap.
              </p>
            )}

            <Transcript defaultOpen run={stream.run} fallback={liveConversation} />
          </motion.div>
        )}
      </AnimatePresence>

      {stream.status === "error" && (
        <p className="mt-4 text-[12px] text-pink-400">
          {stream.errorMessage ?? "The run failed. Please try again."}
        </p>
      )}

      {/* History — each past run opens into its saved conversation */}
      {history.data && history.data.length > 0 && (
        <div className="mt-7">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
            past runs · click to replay the conversation
          </div>
          <ul className="space-y-2">
            {history.data.slice(0, 5).map((r) => (
              <RunHistoryRow key={r.id} run={r} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ── Transcript (collapsible conversation, live-run aftermath) ──────────── */

function Transcript({
  run,
  fallback,
  defaultOpen = false,
}: {
  run: RunRecord;
  fallback?: ConversationData;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const data = conversationFromRun(run, fallback);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink3 transition-colors hover:text-ink"
        aria-expanded={open}
      >
        {open ? "▾ hide conversation" : "▸ show conversation"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              <ConversationView data={data} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Build conversation data from a saved run (fallback fills live-only gaps). */
function conversationFromRun(run: RunRecord, fallback?: ConversationData): ConversationData {
  return {
    plan: run.plan ?? fallback?.plan ?? null,
    takes: run.takes ?? fallback?.takes ?? [],
    debate: run.debate ?? fallback?.debate ?? [],
    answer: run.answer,
    costUsd: run.costUsd,
  };
}

/* ── History row (expandable replay) ────────────────────────────────────── */

function RunHistoryRow({ run }: { run: RunRecord }) {
  const [open, setOpen] = useState(false);
  const debateCount = run.debate?.length ?? 0;

  return (
    <li>
      <Surface className="px-4 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 text-left"
          aria-expanded={open}
          aria-label={`Replay the conversation for: ${run.intent}`}
        >
          <span className={`font-mono text-[10px] text-ink3 transition-transform ${open ? "rotate-90" : ""}`}>
            ▸
          </span>
          <span className="truncate font-serif text-[14px] text-ink">{run.intent}</span>
          <span className="ml-auto shrink-0 font-mono text-[10px] text-ink3">
            {debateCount > 0 ? `${debateCount} debate msgs · ` : ""}
            ${run.costUsd.toFixed(4)} · {new Date(run.createdAt).toLocaleDateString()}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-white/[0.07] pt-4">
                <ConversationView data={conversationFromRun(run)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Surface>
    </li>
  );
}
