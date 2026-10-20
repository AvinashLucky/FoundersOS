"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { Button } from "@shared/ui/Button";
import { useTheme } from "@shared/providers/ThemeProvider";
import { rise, chorus, chorusItem } from "@shared/motion/variants";
import { useProject } from "@features/projects/hooks";
import { RunPanel } from "@features/run";
import { ResearchPanel } from "@features/research";
import { VisualMemoryPanel } from "@features/visual-memory";
import { useNotes, useAddNote } from "./notes";

/**
 * Project workspace — a single project, with its first memory (notes).
 * On load it re-themes the surface to the project's identity. The notes panel
 * is the seed of the Memory Engine: write something, it's remembered per project.
 */
export function ProjectWorkspaceScreen({ projectId }: { projectId: string }) {
  const { setTheme } = useTheme();
  const project = useProject(projectId);
  const notes = useNotes(projectId);
  const addNote = useAddNote(projectId);
  const [draft, setDraft] = useState("");

  // Re-tune the adaptive theme to this project once it loads.
  useEffect(() => {
    if (project.data) setTheme(project.data.domain);
  }, [project.data, setTheme]);

  async function submit() {
    const text = draft.trim();
    if (!text || addNote.isPending) return;
    await addNote.mutateAsync(text);
    setDraft("");
  }

  return (
    <main className="mx-auto max-w-3xl px-7 py-16">
      <Link href="/projects" className="font-mono text-[11px] text-ink3 hover:text-ink">
        ← all projects
      </Link>

      {/* Header */}
      <motion.header variants={rise} initial="hidden" animate="show" className="mt-4 mb-8">
        {project.isLoading ? (
          <div className="h-10 w-48 animate-pulse rounded bg-white/10" />
        ) : project.data ? (
          <>
            <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">
              {project.data.domain} workspace
            </div>
            <h1 className="mt-3 font-serif text-4xl font-light tracking-tight">{project.data.name}</h1>
            <p className="mt-2 max-w-xl text-[14px] text-ink2">{project.data.summary}</p>
          </>
        ) : (
          <h1 className="font-serif text-2xl text-ink">Project not found</h1>
        )}
      </motion.header>

      {/* Run the company (Phase 4) */}
      <div className="mb-10">
        <RunPanel projectId={projectId} />
      </div>

      {/* Research agent (P1) — cited briefs, saved to memory */}
      <div className="mb-10">
        <ResearchPanel projectId={projectId} />
      </div>

      {/* Memory (notes) */}
      <section>
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent2" /> project memory
        </div>

        <Surface elevation="raised" className="p-4">
          <div className="flex items-start gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && void submit()}
              rows={2}
              placeholder="Remember a decision, an idea, a lesson…  (⌘/Ctrl+Enter to save)"
              className="w-full resize-none rounded-md border border-white/12 bg-base px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink4 focus:border-accent2"
            />
            <Button
              onClick={() => void submit()}
              disabled={!draft.trim() || addNote.isPending}
              className={`shrink-0 px-4 py-3 text-[13px] ${!draft.trim() || addNote.isPending ? "opacity-50" : ""}`}
            >
              {addNote.isPending ? "Saving…" : "Remember"}
            </Button>
          </div>
        </Surface>

        <div className="mt-5">
          {notes.isLoading && <p className="font-mono text-[12px] text-ink3">Loading memory…</p>}
          {notes.data && notes.data.length === 0 && (
            <p className="py-8 text-center text-[13px] text-ink3">
              No memories yet. The first thing you remember starts this project&rsquo;s mind.
            </p>
          )}
          {notes.data && notes.data.length > 0 && (
            <motion.ul variants={chorus} initial="hidden" animate="show" className="space-y-2.5">
              {notes.data.map((n) => (
                <motion.li key={n.id} variants={chorusItem}>
                  <Surface className="p-4">
                    <p className="text-[14px] text-ink">{n.text}</p>
                    <div className="mt-2 font-mono text-[10px] text-ink4">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </Surface>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </section>

      {/* Visual memory (Phase 5) */}
      <div className="mt-10">
        <VisualMemoryPanel projectId={projectId} />
      </div>
    </main>
  );
}
