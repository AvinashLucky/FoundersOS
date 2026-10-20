"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@shared/lib/utils";
import { STRATA_EASE } from "@shared/motion/variants";
import type { EjectReport } from "../types";

const MAX_VIOLATIONS = 8;

/**
 * The eject receipt — every invariant with a pass/fail mark, then the first
 * violations with the file that caused them. A truncated scan says so rather
 * than claiming the project is clean.
 */
export function EjectReportView({ report }: { report: EjectReport }) {
  const reduce = useReducedMotion();
  const shown = report.violations.slice(0, MAX_VIOLATIONS);
  const hidden = report.violations.length - shown.length;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.4, ease: STRATA_EASE }}
      className="overflow-hidden"
    >
      <div className="mt-4 rounded-xl border border-white/[0.07] bg-base/60 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.22em]",
              report.ok ? "text-emerald-400" : "text-amber-300",
            )}
          >
            {report.ok ? "Ejectable · verified" : "Not yet ejectable"}
          </span>
          <span className="font-mono text-[10px] text-ink4">
            {report.filesScanned} files · {new Date(report.checkedAt).toLocaleTimeString()}
          </span>
        </div>

        <ul className="mt-3 space-y-1.5" aria-label="Eject checks">
          {report.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-[12.5px]">
              <span aria-hidden className={cn("font-mono", c.ok ? "text-emerald-400" : "text-amber-300")}>
                {c.ok ? "✓" : "✕"}
              </span>
              <span className={c.ok ? "text-ink2" : "text-ink"}>{c.label}</span>
              <span className="sr-only">{c.ok ? "passed" : "failed"}</span>
            </li>
          ))}
        </ul>

        {report.truncated && (
          <p className="mt-3 text-[12px] text-amber-300">
            The scan hit its file limit, so this report can&rsquo;t confirm the whole project.
          </p>
        )}

        {shown.length > 0 && (
          <div className="mt-4 border-t border-white/[0.06] pt-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink3">Fix these</div>
            <ul className="mt-2 space-y-2">
              {shown.map((v, i) => (
                <li key={`${v.check}-${i}`} className="text-[12.5px] leading-relaxed text-ink2">
                  {v.file && <span className="mr-1.5 font-mono text-[11px] text-accent2">{v.file}</span>}
                  {v.message}
                </li>
              ))}
            </ul>
            {hidden > 0 && <p className="mt-2 font-mono text-[11px] text-ink4">+{hidden} more</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
