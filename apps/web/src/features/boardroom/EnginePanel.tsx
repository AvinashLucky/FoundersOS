"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Surface } from "@shared/ui/Surface";
import { chorus, chorusItem } from "@shared/motion/variants";
import { cn } from "@shared/lib/utils";

/**
 * EnginePanel — "what is this company actually running on?"
 * A premium status strip: each provider as a chip, live ones lit with an
 * accent halo, dormant ones dimmed with the exact env var + where to get the
 * key. Answers the founder's first question on first launch without opening
 * a terminal — and never exposes key material (the API returns booleans only).
 */
interface ProviderStatus {
  key: string;
  label: string;
  live: boolean;
  cost: "free" | "paid";
  envVar: string;
  hint: string;
}

interface EnginesResponse {
  providers: ProviderStatus[];
  realEngines: number;
  isReal: boolean;
  researchLive: boolean;
}

export function EnginePanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: async (): Promise<EnginesResponse> => {
      const res = await fetch("/api/v1/providers");
      if (!res.ok) throw new Error("Failed to load engines");
      return (await res.json()) as EnginesResponse;
    },
    staleTime: 60_000,
  });

  return (
    <Surface elevation="raised" className="p-card">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              data?.isReal ? "bg-accent2 shadow-[0_0_8px_currentColor]" : "bg-amber-300",
            )}
          />
          engine room
        </div>
        <span className="font-mono text-[10.5px] text-ink4">
          {isLoading
            ? "checking…"
            : data?.isReal
              ? `${data.realEngines} real engine${data.realEngines === 1 ? "" : "s"} live · free tier${data.researchLive ? " · live research" : ""}`
              : "offline mode — add one free key to wake real models"}
        </span>
      </div>

      <motion.div variants={chorus} initial="hidden" animate="show" className="mt-4 flex flex-wrap gap-2">
        {(data?.providers ?? []).map((p) => (
          <motion.div key={p.key} variants={chorusItem}>
            <div
              title={p.live ? `${p.label} — live` : `${p.label} — set ${p.envVar}: ${p.hint}`}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                p.live
                  ? "border-accent2/40 bg-accent2/[0.07]"
                  : "border-white/[0.09] bg-white/[0.02] opacity-60 hover:opacity-100",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  p.live ? "bg-accent2 shadow-[0_0_8px_currentColor]" : "bg-white/25",
                )}
                aria-hidden
              />
              <span className={cn("text-[12.5px]", p.live ? "text-ink" : "text-ink3")}>{p.label}</span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
                  p.cost === "free"
                    ? "border-emerald-400/30 text-emerald-300"
                    : "border-white/[0.13] text-ink4",
                )}
              >
                {p.cost}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {data && !data.isReal && (
        <p className="mt-4 text-[12.5px] leading-relaxed text-ink2">
          The company is thinking with the built-in offline engine — every feature works, but the
          answers are templated. Add <span className="font-mono text-accent2">GEMINI_API_KEY</span> or{" "}
          <span className="font-mono text-accent2">GROQ_API_KEY</span> to{" "}
          <span className="font-mono text-ink3">apps/web/.env.local</span> and restart to give every
          department a real mind — both are free.
        </p>
      )}
    </Surface>
  );
}
