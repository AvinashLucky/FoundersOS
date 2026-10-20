"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DebateEntry, RunRecord, Stance } from "./run";

/**
 * useRunStream — the live run client.
 * POSTs to /runs/stream and reads the SSE response with a fetch reader
 * (EventSource can't POST). As events arrive it builds the transparent
 * side-channel: the COO's activation plan, each department's completion with
 * an output preview, and whether the CEO was budget-degraded. On `done` it
 * invalidates history + memory caches — the rest of the app can't tell a
 * streamed run from a classic one.
 */
export type StreamStatus = "idle" | "working" | "done" | "error";

export interface ActivationPlan {
  activated: string[];
  skipped: string[];
  rationale: string;
}

export interface DepartmentProgress {
  role: string;
  modelId: string;
  costUsd: number;
  preview: string;
}

interface StreamState {
  status: StreamStatus;
  /** The COO's minimum-set activation decision (arrives first). */
  plan: ActivationPlan | null;
  /** Per-abbr progress for departments that have finished. */
  progress: Record<string, DepartmentProgress>;
  /** The debate, arriving message by message after the takes. */
  critiques: DebateEntry[];
  /** True once the CEO synthesis has started. */
  synthesizing: boolean;
  /** True when the budget governor downgraded the CEO tier. */
  degraded: boolean;
  run: RunRecord | null;
  errorMessage: string | null;
}

const INITIAL: StreamState = {
  status: "idle",
  plan: null,
  progress: {},
  critiques: [],
  synthesizing: false,
  degraded: false,
  run: null,
  errorMessage: null,
};

export function useRunStream(projectId: string) {
  const [state, setState] = useState<StreamState>(INITIAL);
  const qc = useQueryClient();
  const busy = useRef(false);

  const start = useCallback(
    async (intent: string) => {
      if (busy.current) return;
      busy.current = true;
      setState({ ...INITIAL, status: "working" });

      try {
        const res = await fetch(`/api/v1/projects/${projectId}/runs/stream`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ intent }),
        });
        if (!res.ok || !res.body) {
          let msg = "The run failed. Please try again.";
          if (res.status === 429) msg = "Run budget reached — give it a minute.";
          if (res.status === 422) {
            try {
              const body = (await res.json()) as { message?: string };
              msg = body.message ?? "This intent was refused by the safety gate.";
            } catch {
              msg = "This intent was refused by the safety gate.";
            }
          }
          setState({ ...INITIAL, status: "error", errorMessage: msg });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line.
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) handleFrame(frame);
        }
      } catch {
        setState((s) =>
          s.status === "done"
            ? s
            : { ...INITIAL, status: "error", errorMessage: "Connection lost mid-run." },
        );
      } finally {
        busy.current = false;
      }

      function handleFrame(frame: string) {
        let event = "message";
        let data = "";
        for (const line of frame.split("\n")) {
          if (line.startsWith("event: ")) event = line.slice(7).trim();
          else if (line.startsWith("data: ")) data += line.slice(6);
        }
        if (!data) return;

        try {
          const payload = JSON.parse(data) as Record<string, unknown>;
          if (event === "plan") {
            setState((s) => ({
              ...s,
              plan: {
                activated: (payload.activated as string[]) ?? [],
                skipped: (payload.skipped as string[]) ?? [],
                rationale: String(payload.rationale ?? ""),
              },
            }));
          } else if (event === "department") {
            const abbr = String(payload.abbr ?? "");
            setState((s) => ({
              ...s,
              progress: {
                ...s.progress,
                [abbr]: {
                  role: String(payload.role ?? ""),
                  modelId: String(payload.modelId ?? ""),
                  costUsd: Number(payload.costUsd ?? 0),
                  preview: String(payload.preview ?? ""),
                },
              },
            }));
          } else if (event === "critique") {
            const entry: DebateEntry = {
              from: String(payload.from ?? ""),
              to: String(payload.to ?? ""),
              stance: (["support", "challenge", "concern"].includes(payload.stance as string)
                ? payload.stance
                : "concern") as Stance,
              text: String(payload.text ?? ""),
            };
            setState((s) => ({ ...s, critiques: [...s.critiques, entry] }));
          } else if (event === "synthesis") {
            setState((s) => ({ ...s, synthesizing: true, degraded: Boolean(payload.degraded) }));
          } else if (event === "done") {
            const run = payload.run as RunRecord;
            setState((s) => ({ ...s, status: "done", run }));
            void qc.invalidateQueries({ queryKey: ["projects", projectId, "runs"] });
            void qc.invalidateQueries({ queryKey: ["projects", projectId, "notes"] });
            void qc.invalidateQueries({ queryKey: ["overview"] });
          } else if (event === "error") {
            setState({
              ...INITIAL,
              status: "error",
              errorMessage: String(payload.message ?? "The run failed."),
            });
          }
        } catch {
          // Ignore malformed frames; the stream keeps going.
        }
      }
    },
    [projectId, qc],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, start, reset, isWorking: state.status === "working" };
}
