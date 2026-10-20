"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@shared/ui/Button";
import { THEME_LIST, type ThemeId } from "@shared/config/themes";
import { cn } from "@shared/lib/utils";
import { useAppDispatch, useAppSelector } from "@shared/store/hooks";
import { closeCreateDialog } from "../projectsSlice";
import { useCreateProject } from "../hooks";
import type { Project } from "../types";

/**
 * Create-project dialog. Reads its open/closed state from Redux, writes the new
 * project via the React Query mutation, and reports the created project back so
 * the screen can open + theme it.
 */
export function CreateProjectDialog({ onCreated }: { onCreated: (p: Project) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.projects.createDialogOpen);
  const create = useCreateProject();

  const [name, setName] = useState("");
  const [domain, setDomain] = useState<ThemeId>("founder");
  const nameValid = name.trim().length >= 2;

  function close() {
    dispatch(closeCreateDialog());
    setName("");
    setDomain("founder");
  }

  async function submit() {
    if (!nameValid || create.isPending) return;
    const project = await create.mutateAsync({ name, domain });
    onCreated(project);
    close();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Create a new project"
        >
          {/* backdrop */}
          <button
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            onClick={close}
            aria-label="Close dialog"
            tabIndex={-1}
          />
          {/* panel */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-raised p-6 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <h2 className="font-serif text-2xl font-light tracking-tight">New project</h2>
            <p className="mt-1 text-[13px] text-ink2">
              Give it a name and a domain — the domain sets its visual identity.
            </p>

            {/* name */}
            <label className="mt-5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="e.g. Ledger"
              className="mt-2 w-full rounded-md border border-white/15 bg-base px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 focus:border-accent2"
            />

            {/* domain picker */}
            <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
              Domain
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {THEME_LIST.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDomain(t.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[11px] transition-colors",
                    domain === t.id
                      ? "border-accent2/70 text-ink"
                      : "border-white/12 text-ink3 hover:text-ink",
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: t.swatch.accent }} />
                  {t.domain}
                </button>
              ))}
            </div>

            {create.isError && (
              <p className="mt-4 text-[12px] text-pink-400">
                Couldn&rsquo;t create the project. Please try again.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={close} className="px-4 py-2 text-[13px]">
                Cancel
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={!nameValid || create.isPending}
                className={cn("px-5 py-2 text-[13px]", (!nameValid || create.isPending) && "opacity-50")}
              >
                {create.isPending ? "Creating…" : "Create project"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
