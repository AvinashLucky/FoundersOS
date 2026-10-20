"use client";

import { Fragment, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@shared/ui/Button";
import { Surface } from "@shared/ui/Surface";
import { useToast } from "@shared/ui/Toaster";
import { cn } from "@shared/lib/utils";
import { useEjectCheck, useProjectFolderStatus } from "../hooks";
import type { EjectReport, InstallState, ProjectFolder } from "../types";
import { EjectReportView } from "./EjectReportView";

/**
 * One on-disk project: identity, live port status, copy-ready commands, and
 * the eject check. Stage 1 never starts a process — it tells you exactly what
 * to run and shows, honestly, whether something is answering on the port.
 */
export function ProjectFolderCard({ folder }: { folder: ProjectFolder }) {
  const { manifest } = folder;
  const { toast } = useToast();
  const status = useProjectFolderStatus(folder.slug, true);
  const eject = useEjectCheck();
  const [report, setReport] = useState<EjectReport | null>(null);

  async function copy(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      toast("Command copied", "success");
    } catch {
      toast("Couldn't reach the clipboard — select the command instead", "error");
    }
  }

  function runEjectCheck() {
    eject.mutate(folder.slug, {
      onSuccess: (r) => {
        setReport(r);
        toast(r.ok ? `${manifest.name} can leave FounderOS cleanly` : `${r.violations.length} eject issue(s) found`, r.ok ? "success" : "default");
      },
      onError: (err) => toast(err instanceof Error ? err.message : "Eject check failed", "error"),
    });
  }

  return (
    <Surface className="flex h-full flex-col p-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-ink3">
            {manifest.domain} · {manifest.layout === "split" ? "frontend + backend" : "single app"}
          </div>
          <h3 className="mt-2 truncate font-serif text-xl font-light text-ink">{manifest.name}</h3>
        </div>
        <EjectBadge verifiedAt={manifest.eject.verifiedAt} />
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink2">{manifest.summary}</p>
      <div className="mt-2 font-mono text-[11px] text-ink4">{folder.path}</div>

      {/* Live status — aria-live so screen readers hear a server come up. */}
      <div className="mt-4 flex flex-wrap gap-2" aria-live="polite">
        {status.isLoading && <Pill tone="muted">checking ports…</Pill>}
        {status.isError && <Pill tone="warn">status unavailable</Pill>}
        {status.data?.apps.map((app) => (
          <Fragment key={app.role}>
            <Pill tone={app.state === "running" ? "live" : "muted"}>
              {app.role} · :{app.port} · {app.state === "running" ? "answering" : "stopped"}
            </Pill>
            <InstallPill role={app.role} install={app.install} />
          </Fragment>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {folder.commands.map((c) => (
          <div key={c.label} className="group flex items-center gap-2 rounded-lg border border-white/[0.07] bg-base/60 px-3 py-2">
            <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-ink4">{c.label}</span>
            <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink2" title={c.command}>
              {c.command}
            </code>
            <button
              type="button"
              onClick={() => void copy(c.command)}
              aria-label={`Copy ${c.label.toLowerCase()} command`}
              className="rounded px-2 py-1 font-mono text-[11px] text-ink3 transition-colors hover:bg-white/[0.06] hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent2/60"
            >
              copy
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          onClick={runEjectCheck}
          disabled={eject.isPending}
          className="w-full px-4 py-2.5 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent2/60 disabled:opacity-60"
        >
          {eject.isPending ? "Scanning the project…" : report ? "Re-run eject check" : "Run eject check"}
        </Button>
        <AnimatePresence initial={false}>{report && <EjectReportView key={report.checkedAt} report={report} />}</AnimatePresence>
      </div>
    </Surface>
  );
}

function EjectBadge({ verifiedAt }: { verifiedAt: string | null }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      layout={!reduce}
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px]",
        verifiedAt ? "border-emerald-400/30 text-emerald-400" : "border-white/[0.1] text-ink3",
      )}
      title={verifiedAt ? `Eject verified ${new Date(verifiedAt).toLocaleString()}` : "Eject not verified yet"}
    >
      {verifiedAt ? "ejectable ✓" : "eject unverified"}
    </motion.span>
  );
}

/** Only speaks up when the install needs attention — a complete install stays quiet. */
function InstallPill({ role, install }: { role: string; install: InstallState }) {
  if (install.state === "complete") return null;
  if (install.state === "not-installed") return <Pill tone="muted">{role} · not installed — run Install</Pill>;
  if (install.state === "unknown") return <Pill tone="warn" title={install.reason}>{role} · install unknown</Pill>;
  return (
    <Pill tone="warn" title={`Missing from its own node_modules: ${install.missing.join(", ")}`}>
      {role} · install incomplete · {install.missing.length} missing — run Install
    </Pill>
  );
}

function Pill({ tone, title, children }: { tone: "live" | "muted" | "warn"; title?: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px]",
        tone === "live" && "border-emerald-400/30 text-emerald-300",
        tone === "muted" && "border-white/[0.08] text-ink3",
        tone === "warn" && "border-amber-300/30 text-amber-300",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "live" && "bg-emerald-400 motion-safe:animate-pulse",
          tone === "muted" && "bg-ink4",
          tone === "warn" && "bg-amber-300",
        )}
      />
      {children}
    </span>
  );
}
