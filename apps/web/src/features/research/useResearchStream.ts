"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * useResearchStream — client for the Research Agent's SSE stream.
 * Same fetch-reader pattern as useRunStream (EventSource can't POST).
 * On `done` it invalidates the project's memory cache: a saved brief is a
 * memory like any decision.
 */
export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchBrief {
  id: string;
  topic: string;
  summary: string;
  competitors: Array<{ name: string; angle: string }>;
  demand: string;
  risks: string[];
  opportunities: string[];
  sources: ResearchSource[];
  source: "live" | "offline";
  costUsd: number;
  createdAt: string;
}

export type ResearchStatus = "idle" | "working" | "done" | "error";

interface ResearchState {
  status: ResearchStatus;
  /** Queries launched so far, with hit counts as they land. */
  queries: Array<{ query: string; count: number | null }>;
  distilling: boolean;
  brief: ResearchBrief | null;
  errorMessage: string | null;
}

const INITIAL: ResearchState = {
  status: "idle",
  queries: [],
  distilling: false,
  brief: null,
  errorMessage: null,
};

export function useResearchStream(projectId?: string) {
  const [state, setState] = useState<ResearchState>(INITIAL);
  const qc = useQueryClient();
  const busy = useRef(false);

  const start = useCallback(
    async (topic: string) => {
      if (busy.current) return;
      busy.current = true;
      setState({ ...INITIAL, status: "working" });

      try {
        const res = await fetch("/api/v1/research", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(projectId ? { topic, projectId } : { topic }),
        });
        if (!res.ok || !res.body) {
          let msg = "Research failed. Please try again.";
          if (res.status === 429) msg = "Research budget reached — give it a minute.";
          if (res.status === 422) {
            try {
              const body = (await res.json()) as { message?: string };
              msg = body.message ?? "This topic was refused by the safety gate.";
            } catch {
              msg = "This topic was refused by the safety gate.";
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
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) handleFrame(frame);
        }
      } catch {
        setState((s) =>
          s.status === "done"
            ? s
            : { ...INITIAL, status: "error", errorMessage: "Connection lost mid-research." },
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
          if (event === "query") {
            const query = String(payload.query ?? "");
            setState((s) => ({ ...s, queries: [...s.queries, { query, count: null }] }));
          } else if (event === "hits") {
            const query = String(payload.query ?? "");
            const count = Number(payload.count ?? 0);
            setState((s) => ({
              ...s,
              queries: s.queries.map((q) => (q.query === query ? { ...q, count } : q)),
            }));
          } else if (event === "distill") {
            setState((s) => ({ ...s, distilling: true }));
          } else if (event === "done") {
            const brief = payload.brief as ResearchBrief;
            setState((s) => ({ ...s, status: "done", brief }));
            if (projectId) {
              void qc.invalidateQueries({ queryKey: ["projects", projectId, "notes"] });
            }
          } else if (event === "error") {
            setState({
              ...INITIAL,
              status: "error",
              errorMessage: String(payload.message ?? "Research failed."),
            });
          }
        } catch {
          // Ignore malformed frames.
        }
      }
    },
    [projectId, qc],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, start, reset, isWorking: state.status === "working" };
}
