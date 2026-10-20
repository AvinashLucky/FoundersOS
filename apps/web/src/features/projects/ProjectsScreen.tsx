"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@shared/ui/Button";
import { Surface } from "@shared/ui/Surface";
import { useToast } from "@shared/ui/Toaster";
import { useTheme } from "@shared/providers/ThemeProvider";
import { useAppDispatch, useAppSelector } from "@shared/store/hooks";
import { chorus, chorusItem, rise } from "@shared/motion/variants";
import { cn } from "@shared/lib/utils";
import { openCreateDialog, setActiveProject } from "./projectsSlice";
import { useProjects, useUpdateProject } from "./hooks";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectDialog } from "./components/CreateProjectDialog";
import { ProjectFoldersSection } from "@features/project-folders";
import type { Project } from "./types";

type SortMode = "recent" | "name";
type ViewMode = "active" | "archived";

/**
 * Projects screen — the workspace home. Lists projects, searches/sorts them,
 * archives/restores them, creates them, and opens one (which re-themes the
 * whole surface). Handles loading, empty, and error states.
 * Search/sort/filter are client-side: a founder's project list is small, so
 * filtering in memory beats a server round-trip per keystroke.
 */
export function ProjectsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeProjectId = useAppSelector((s) => s.projects.activeProjectId);
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const updateProject = useUpdateProject();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("active");

  const archivedCount = useMemo(
    () => (projects ?? []).filter((p) => p.status === "archived").length,
    [projects],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (projects ?? [])
      .filter((p) => (view === "active" ? p.status === "active" : p.status === "archived"))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q));
    return sort === "name"
      ? [...list].sort((a, b) => a.name.localeCompare(b.name))
      : [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, query, sort, view]);

  // Opening a project focuses it, re-tunes the theme, and navigates into it.
  function openProject(project: Project) {
    dispatch(setActiveProject(project.id));
    setTheme(project.domain);
    router.push(`/projects/${project.id}`);
  }

  function toggleArchive(project: Project) {
    const next = project.status === "archived" ? "active" : "archived";
    updateProject.mutate(
      { id: project.id, input: { status: next } },
      {
        onSuccess: () =>
          toast(next === "archived" ? `${project.name} archived` : `${project.name} restored`, "success"),
        onError: () => toast(`Couldn't update ${project.name}`, "error"),
      },
    );
  }

  async function signOut() {
    await fetch("/api/v1/auth", { method: "DELETE" });
    toast("Signed out");
    router.push("/signin");
    router.refresh();
  }

  const hasProjects = !isLoading && !isError && projects && projects.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-7 py-16">
      {/* Header */}
      <motion.header
        variants={rise}
        initial="hidden"
        animate="show"
        className="mb-8 flex items-end justify-between gap-4"
      >
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">
            Your workspace
          </div>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl">
            Projects
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/overview"
            className="font-mono text-[12px] text-ink3 transition-colors hover:text-ink"
          >
            Overview
          </Link>
          <Link
            href="/freelance"
            className="font-mono text-[12px] text-ink3 transition-colors hover:text-ink"
          >
            Freelance
          </Link>
          <Link
            href="/delivery"
            className="font-mono text-[12px] text-ink3 transition-colors hover:text-ink"
          >
            Delivery
          </Link>
          <Link
            href="/boardroom"
            className="font-mono text-[12px] text-accent2 transition-opacity hover:opacity-80"
          >
            Boardroom
          </Link>
          <Button variant="quiet" onClick={() => void signOut()} className="px-3 py-2 text-[13px]">
            Sign out
          </Button>
          <Button magnetic onClick={() => dispatch(openCreateDialog())} className="px-5 py-3 text-sm">
            + New project
          </Button>
        </div>
      </motion.header>

      {/* Toolbar: search · sort · view — only when there's something to filter */}
      {hasProjects && (
        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <Surface elevation="raised" className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-md px-3.5 py-2.5 sm:max-w-xs">
            <span className="font-mono text-[12px] text-ink3">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink4"
              aria-label="Search projects"
            />
          </Surface>

          <Segmented
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as SortMode)}
            options={[
              { id: "recent", label: "Recent" },
              { id: "name", label: "A–Z" },
            ]}
          />

          <Segmented
            label="View"
            value={view}
            onChange={(v) => setView(v as ViewMode)}
            options={[
              { id: "active", label: "Active" },
              { id: "archived", label: `Archived${archivedCount ? ` (${archivedCount})` : ""}` },
            ]}
          />

          <span className="ml-auto hidden font-mono text-[10px] text-ink4 sm:block">
            ⌘K to jump anywhere
          </span>
        </motion.div>
      )}

      {/* States */}
      {isLoading && <LoadingGrid />}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && projects && projects.length === 0 && (
        <EmptyState onCreate={() => dispatch(openCreateDialog())} />
      )}

      {hasProjects && visible.length === 0 && (
        <Surface className="grid place-items-center px-6 py-14 text-center">
          <p className="text-[14px] text-ink2">
            {view === "archived" && !query
              ? "Nothing archived. Archive a project to tidy the surface — it's reversible."
              : `No ${view} projects match “${query}”.`}
          </p>
        </Surface>
      )}

      {hasProjects && visible.length > 0 && (
        <motion.div
          variants={chorus}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((project) => (
            <motion.div key={project.id} variants={chorusItem}>
              <ProjectCard
                project={project}
                active={project.id === activeProjectId}
                onOpen={openProject}
                onArchiveToggle={toggleArchive}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <ProjectFoldersSection />

      <CreateProjectDialog
        onCreated={(p) => {
          toast(`${p.name} created`, "success");
          openProject(p);
        }}
      />
    </main>
  );
}

/* ── Toolbar segmented control ─────────────────────────────────────────── */

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-md border border-white/[0.1] bg-white/[0.03] p-1"
      role="group"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded px-2.5 py-1.5 font-mono text-[11px] transition-colors",
            value === o.id ? "bg-white/[0.09] text-ink" : "text-ink3 hover:text-ink",
          )}
          aria-pressed={value === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <Surface key={i} className="h-[150px] p-card">
          <div className="h-2.5 w-16 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-5 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
        </Surface>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div variants={rise} initial="hidden" animate="show">
      <Surface className="grid place-items-center gap-4 px-6 py-20 text-center">
        <div className="font-serif text-2xl font-light text-ink">No projects yet</div>
        <p className="max-w-sm text-[14px] text-ink2">
          Every project gets its own memory, identity, and AI company. Create your first to begin.
        </p>
        <Button magnetic onClick={onCreate} className="mt-1 px-5 py-3 text-sm">
          + Create your first project
        </Button>
      </Surface>
    </motion.div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Surface className="grid place-items-center gap-4 px-6 py-16 text-center">
      <div className="font-serif text-xl text-ink">Couldn&rsquo;t load your projects</div>
      <p className="max-w-sm text-[13px] text-ink2">
        Something went wrong reaching the server. Check your connection and try again.
      </p>
      <Button variant="ghost" onClick={onRetry} className="px-4 py-2 text-[13px]">
        Retry
      </Button>
    </Surface>
  );
}
