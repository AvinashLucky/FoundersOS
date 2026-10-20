"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { THEMES } from "@shared/config/themes";
import { useTheme } from "@shared/providers/ThemeProvider";
import { useAppDispatch, useAppSelector } from "@shared/store/hooks";
import { useToast } from "@shared/ui/Toaster";
import { cn } from "@shared/lib/utils";
import { projectsApi } from "@features/projects/api";
import { openCreateDialog, setActiveProject } from "@features/projects/projectsSlice";
import type { Project } from "@features/projects/types";
import { closePalette, togglePalette } from "./paletteSlice";

/**
 * ⌘K Command Palette — jump anywhere, do anything, keyboard-first.
 * Commands: navigation, actions (new project, sign out), and every project
 * (open → re-theme → navigate). Filtered as you type; ↑/↓ + Enter to run.
 * Mounted once in AppProviders so it works on every screen.
 */
interface Command {
  id: string;
  label: string;
  hint: string;
  /** Small colored square for project commands (its domain identity). */
  swatch?: string;
  run: () => void | Promise<void>;
}

export function CommandPalette() {
  const open = useAppSelector((s) => s.palette.open);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K everywhere except the sign-in screen.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (pathname !== "/signin") dispatch(togglePalette());
      }
      if (e.key === "Escape") dispatch(closePalette());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, pathname]);

  // Reset + focus each time it opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Projects share the ["projects"] cache with the projects screen.
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
    enabled: open,
    staleTime: 30_000,
  });

  const commands = useMemo<Command[]>(() => {
    const close = () => dispatch(closePalette());

    const openProject = (p: Project) => {
      dispatch(setActiveProject(p.id));
      setTheme(p.domain);
      router.push(`/projects/${p.id}`);
      close();
    };

    const base: Command[] = [
      {
        id: "nav-projects",
        label: "Go to Projects",
        hint: "navigate",
        run: () => {
          router.push("/projects");
          close();
        },
      },
      {
        id: "nav-overview",
        label: "Go to Overview",
        hint: "navigate",
        run: () => {
          router.push("/overview");
          close();
        },
      },
      {
        id: "nav-freelance",
        label: "Go to Freelance Studio",
        hint: "navigate",
        run: () => {
          router.push("/freelance");
          close();
        },
      },
      {
        id: "nav-boardroom",
        label: "Go to Boardroom",
        hint: "navigate",
        run: () => {
          router.push("/boardroom");
          close();
        },
      },
      {
        id: "nav-delivery",
        label: "Go to Delivery Studio (client → blueprint)",
        hint: "navigate",
        run: () => {
          router.push("/delivery");
          close();
        },
      },
      {
        id: "act-demo",
        label: "▶ Present the company (Demo Mode)",
        hint: "action",
        run: () => {
          router.push("/demo");
          close();
        },
      },
      {
        id: "act-new-project",
        label: "New project…",
        hint: "action",
        run: () => {
          router.push("/projects");
          dispatch(openCreateDialog());
          close();
        },
      },
      {
        id: "act-sign-out",
        label: "Sign out",
        hint: "action",
        run: async () => {
          await fetch("/api/v1/auth", { method: "DELETE" });
          qc.clear();
          toast("Signed out");
          router.push("/signin");
          router.refresh();
          close();
        },
      },
    ];

    const projectCommands: Command[] = (projects ?? [])
      .filter((p) => p.status === "active")
      .map((p) => ({
        id: `prj-${p.id}`,
        label: p.name,
        hint: "open project",
        swatch: THEMES[p.domain].swatch.accent,
        run: () => openProject(p),
      }));

    return [...projectCommands, ...base];
  }, [dispatch, projects, qc, router, setTheme, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Keep selection inside the filtered range.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[index]) {
      e.preventDefault();
      void filtered[index].run();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <button
            className="absolute inset-0 bg-void/60 backdrop-blur-sm"
            onClick={() => dispatch(closePalette())}
            aria-label="Close command palette"
            tabIndex={-1}
          />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-raised shadow-2xl"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Search line */}
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
              <span className="font-mono text-accent2">›</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Type a command or project name…"
                className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink4"
                aria-label="Search commands"
              />
              <kbd className="rounded border border-white/[0.13] px-1.5 py-0.5 font-mono text-[10px] text-ink3">
                esc
              </kbd>
            </div>

            {/* Results */}
            <ul className="max-h-[320px] overflow-y-auto py-2" role="listbox">
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-center font-mono text-[12px] text-ink3">
                  Nothing matches &ldquo;{query}&rdquo;
                </li>
              )}
              {filtered.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === index}>
                  <button
                    onClick={() => void c.run()}
                    onMouseEnter={() => setIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      i === index ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                    )}
                  >
                    {c.swatch ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={{ background: c.swatch }}
                        aria-hidden
                      />
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-white/20" aria-hidden />
                    )}
                    <span className="truncate text-[14px] text-ink">{c.label}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">
                      {c.hint}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/[0.08] px-4 py-2 font-mono text-[10px] text-ink4">
              ↑↓ navigate · ↵ run · ⌘K toggle
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
