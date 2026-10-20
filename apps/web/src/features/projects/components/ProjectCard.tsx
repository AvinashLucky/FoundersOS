"use client";

import { motion } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { THEMES } from "@shared/config/themes";
import { cn } from "@shared/lib/utils";
import type { Project } from "../types";

/**
 * A single project in the grid. The small accent dot previews the project's
 * adaptive identity; clicking the card opens it (and re-themes the surface).
 * The card is a focusable div (not a <button>) so the archive control inside
 * can be a real button — nested buttons are invalid HTML.
 */
export function ProjectCard({
  project,
  active,
  onOpen,
  onArchiveToggle,
}: {
  project: Project;
  active: boolean;
  onOpen: (project: Project) => void;
  /** Optional — when provided, an archive/restore control appears on the card. */
  onArchiveToggle?: (project: Project) => void;
}) {
  const identity = THEMES[project.domain];
  const archived = project.status === "archived";

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project);
        }
      }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent2/60 rounded-2xl"
      aria-label={`Open project ${project.name}`}
    >
      <Surface
        elevation="glass"
        className={cn(
          "h-full p-card transition-colors",
          active ? "border-accent2/60" : "hover:border-white/20",
          archived && "opacity-60 saturate-50",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-[4px]"
            style={{ background: identity.swatch.accent }}
            aria-hidden
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
            {identity.domain}
          </span>
          {archived && (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink3">
              archived
            </span>
          )}
          {active && !archived && (
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent2">
              open
            </span>
          )}
        </div>

        <h3 className="mt-3 font-serif text-xl font-normal tracking-tight text-ink">
          {project.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-ink2">{project.summary}</p>

        <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-ink3">
          <span>{identity.character}</span>
          <span className="flex items-center gap-2.5">
            <span>updated {relativeTime(project.updatedAt)}</span>
            {onArchiveToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveToggle(project);
                }}
                className="rounded border border-white/[0.13] px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.1em] text-ink3 transition-colors hover:border-white/30 hover:text-ink"
                aria-label={archived ? `Restore ${project.name}` : `Archive ${project.name}`}
              >
                {archived ? "restore" : "archive"}
              </button>
            )}
          </span>
        </div>
      </Surface>
    </motion.div>
  );
}

/** Compact "2h ago" style relative time. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
