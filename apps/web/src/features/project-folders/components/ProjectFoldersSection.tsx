"use client";

import { motion } from "framer-motion";
import { Button } from "@shared/ui/Button";
import { Surface } from "@shared/ui/Surface";
import { useToast } from "@shared/ui/Toaster";
import { chorus, chorusItem, rise } from "@shared/motion/variants";
import { useClaimProjectFolder, useProjectFolders } from "../hooks";
import type { OwnedProjectFolder, UnclaimedProjectFolder } from "../types";
import { ProjectFolderCard } from "./ProjectFolderCard";

/**
 * "Built projects" — the ejectable codebases living in `projects/<slug>/`.
 * Designs all five states (CLAUDE.md §7): loading · empty · error · success ·
 * degraded (projects/ not found). Unreadable manifests render as their own
 * error cards so one broken file never hides the rest.
 */
export function ProjectFoldersSection() {
  const { data, isLoading, isError, error, refetch } = useProjectFolders();

  return (
    <section className="mt-16" aria-labelledby="project-folders-heading">
      <motion.div variants={rise} initial="hidden" animate="show" className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">projects/ · on disk</div>
        <h2 id="project-folders-heading" className="mt-2 font-serif text-3xl font-light tracking-tight">
          Built projects
        </h2>
        <p className="mt-2 max-w-xl text-[13.5px] text-ink2">
          The codebases FounderOS builds. Each one owns its own install and can leave FounderOS at any time — the
          eject check proves it.
        </p>
      </motion.div>

      {isLoading && <LoadingRow />}
      {isError && (
        <StateCard
          title="Couldn't read your built projects"
          body={error instanceof Error ? error.message : "Something went wrong reaching the server."}
          action={{ label: "Retry", onClick: () => void refetch() }}
        />
      )}
      {data && !data.available && (
        <StateCard
          title="No projects/ folder found"
          body="FounderOS looks for a projects/ folder at the repository root. Create it (or set FOUNDEROS_PROJECTS_DIR) and built projects appear here."
          tone="degraded"
        />
      )}
      {data?.available && data.owned.length === 0 && data.unclaimed.length === 0 && (
        <StateCard
          title="Nothing built yet"
          body="When FounderOS scaffolds a product, it lands in projects/<name>/ with its own project.json — and shows up here."
        />
      )}

      {data?.available && data.unclaimed.length > 0 && <UnclaimedList items={data.unclaimed} />}

      {data?.available && data.owned.length > 0 && (
        <motion.div variants={chorus} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.owned.map((entry) => (
            <motion.div key={entry.slug} variants={chorusItem}>
              {entry.folder ? <ProjectFolderCard folder={entry.folder} /> : <BrokenManifestCard entry={entry} />}
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function UnclaimedList({ items }: { items: UnclaimedProjectFolder[] }) {
  const claim = useClaimProjectFolder();
  const { toast } = useToast();

  return (
    <Surface elevation="raised" className="mb-4 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink3">Found on disk · not yet in this workspace</div>
      <ul className="mt-3 divide-y divide-white/[0.06]">
        {items.map((item) => (
          <li key={item.slug} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[14px] text-ink">{item.name ?? item.slug}</div>
              <div className="font-mono text-[11px] text-ink4">projects/{item.slug}</div>
            </div>
            <Button
              variant="ghost"
              disabled={claim.isPending}
              onClick={() =>
                claim.mutate(item.slug, {
                  onSuccess: () => toast(`${item.name ?? item.slug} added to this workspace`, "success"),
                  onError: (err) => toast(err instanceof Error ? err.message : "Couldn't claim that folder", "error"),
                })
              }
              className="shrink-0 px-3.5 py-2 text-[12.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent2/60 disabled:opacity-60"
            >
              {claim.isPending && claim.variables === item.slug ? "Adding…" : "Add to workspace"}
            </Button>
          </li>
        ))}
      </ul>
    </Surface>
  );
}

function BrokenManifestCard({ entry }: { entry: OwnedProjectFolder }) {
  return (
    <Surface className="h-full border-amber-300/20 p-card">
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300">Manifest needs a fix</div>
      <h3 className="mt-2 font-serif text-xl font-light text-ink">{entry.slug}</h3>
      <p className="mt-2 font-mono text-[12px] leading-relaxed text-ink2">{entry.error}</p>
      <p className="mt-3 text-[12.5px] text-ink3">Edit projects/{entry.slug}/project.json — this card refreshes when it parses.</p>
    </Surface>
  );
}

function LoadingRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading built projects">
      {Array.from({ length: 2 }).map((_, i) => (
        <Surface key={i} className="h-[260px] p-card">
          <div className="h-2.5 w-24 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-5 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-6 h-8 w-full animate-pulse rounded bg-white/[0.05]" />
          <div className="mt-2 h-8 w-full animate-pulse rounded bg-white/[0.05]" />
        </Surface>
      ))}
    </div>
  );
}

function StateCard({
  title,
  body,
  action,
  tone = "neutral",
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  tone?: "neutral" | "degraded";
}) {
  return (
    <Surface className="grid place-items-center gap-3 px-6 py-12 text-center">
      {tone === "degraded" && (
        <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300">Degraded</div>
      )}
      <div className="font-serif text-xl font-light text-ink">{title}</div>
      <p className="max-w-md text-[13px] text-ink2">{body}</p>
      {action && (
        <Button variant="ghost" onClick={action.onClick} className="mt-1 px-4 py-2 text-[13px]">
          {action.label}
        </Button>
      )}
    </Surface>
  );
}
