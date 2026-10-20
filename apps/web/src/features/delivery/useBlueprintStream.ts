"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Mirrors server/ai/blueprint-agent.ts — the sellable artifact. */
export interface LoopStep {
  role: string;
  action: string;
  tool: string;
  output: string;
}
export interface StackChoice {
  layer: string;
  choice: string;
  why: string;
  monthlyCost: string;
}
export interface Milestone {
  phase: string;
  deliverable: string;
  days: number;
}
export interface SolutionBlueprint {
  id: string;
  requirement: string;
  understanding: string;
  agenticLoop: LoopStep[];
  mlSystems: string[];
  techStack: StackChoice[];
  milestones: Milestone[];
  risks: string[];
  pricing: { serviceUsd: string; productUsd: string; rationale: string };
  postDraft: string;
  source: "model" | "offline";
  costUsd: number;
  createdAt: string;
}

export type BlueprintPhase = "idle" | "understanding" | "designing" | "pricing" | "done" | "error";

interface State {
  phase: BlueprintPhase;
  blueprint: SolutionBlueprint | null;
  errorMessage: string | null;
}

const INITIAL: State = { phase: "idle", blueprint: null, errorMessage: null };

export function useBlueprintStream(projectId?: string) {
  const [state, setState] = useState<State>(INITIAL);
  const qc = useQueryClient();
  const busy = useRef(false);

  const start = useCallback(
    async (requirement: string) => {
      if (busy.current) return;
      busy.current = true;
      setState({ ...INITIAL, phase: "understanding" });

      try {
        const res = await fetch("/api/v1/blueprints", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(projectId ? { requirement, projectId } : { requirement }),
        });
        if (!res.ok || !res.body) {
          let msg = "Blueprint generation failed. Please try again.";
          if (res.status === 429) msg = "Blueprint budget reached — give it a minute.";
          if (res.status === 422 || res.status === 400) {
            try {
              const body = (await res.json()) as { message?: string };
              msg = body.message ?? msg;
            } catch {
              /* keep default */
            }
          }
          setState({ ...INITIAL, phase: "error", errorMessage: msg });
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
          s.phase === "done"
            ? s
            : { ...INITIAL, phase: "error", errorMessage: "Connection lost mid-design." },
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
          if (event === "understanding" || event === "designing" || event === "pricing") {
            setState((s) => ({ ...s, phase: event as BlueprintPhase }));
          } else if (event === "done") {
            setState({ phase: "done", blueprint: payload.blueprint as SolutionBlueprint, errorMessage: null });
            if (projectId) void qc.invalidateQueries({ queryKey: ["projects", projectId, "notes"] });
          } else if (event === "error") {
            setState({
              ...INITIAL,
              phase: "error",
              errorMessage: String(payload.message ?? "Blueprint generation failed."),
            });
          }
        } catch {
          /* ignore malformed frames */
        }
      }
    },
    [projectId, qc],
  );

  const reset = useCallback(() => setState(INITIAL), []);
  const isWorking = ["understanding", "designing", "pricing"].includes(state.phase);

  return { ...state, start, reset, isWorking };
}

/** Client-side Markdown render — the copy/paste deliverable. */
export function blueprintToMarkdown(b: SolutionBlueprint): string {
  const l: string[] = [];
  l.push("# Solution Blueprint", "", `**Requirement:** ${b.requirement}`, "");
  l.push(`_${b.source === "offline" ? "Offline template" : "AI-designed"} · ${new Date(b.createdAt).toLocaleString()}_`, "");
  l.push("## Understanding", "", b.understanding, "");
  l.push("## Agentic loop", "", "| # | Role | Action | Tool | Output |", "|---|---|---|---|---|");
  b.agenticLoop.forEach((s, i) => l.push(`| ${i + 1} | ${s.role} | ${s.action} | ${s.tool} | ${s.output} |`));
  l.push("", "## ML / GenAI systems", "");
  b.mlSystems.forEach((m) => l.push(`- ${m}`));
  l.push("", "## Tech stack", "", "| Layer | Choice | Why | Monthly cost |", "|---|---|---|---|");
  b.techStack.forEach((s) => l.push(`| ${s.layer} | ${s.choice} | ${s.why} | ${s.monthlyCost} |`));
  l.push("", "## Milestones", "");
  b.milestones.forEach((m) => l.push(`- **${m.phase}** (${m.days}d) — ${m.deliverable}`));
  l.push("", "## Risks", "");
  b.risks.forEach((r) => l.push(`- ${r}`));
  l.push("", "## Pricing", "", `- **Service:** ${b.pricing.serviceUsd}`, `- **Product:** ${b.pricing.productUsd}`, `- ${b.pricing.rationale}`, "");
  l.push("## Proof post draft", "", b.postDraft, "");
  return l.join("\n");
}
