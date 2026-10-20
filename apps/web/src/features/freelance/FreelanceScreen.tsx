"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@shared/ui/Button";
import { Surface } from "@shared/ui/Surface";
import { useToast } from "@shared/ui/Toaster";
import { chorus, chorusItem, rise } from "@shared/motion/variants";
import { cn } from "@shared/lib/utils";
import {
  useCreateListing,
  useDeleteListing,
  useIdeaAgent,
  useListings,
  useTogglePosted,
  useUpdateListing,
} from "./hooks";
import {
  LISTING_KINDS,
  LISTING_PLATFORMS,
  type CreateListingInput,
  type Listing,
  type ListingKind,
  type ListingPlatform,
  type ProjectIdea,
} from "./types";

/**
 * Freelance Studio — package what you build, sell it everywhere.
 * A deliberately different UX from the projects grid: a horizontal Idea-Scout
 * band on top (the agent thinking out loud), a posting BOARD below (draft vs
 * live), and an inline composer instead of a modal — the studio feels like a
 * workbench, not a form.
 */
export function FreelanceScreen() {
  const { toast } = useToast();
  const listings = useListings();
  const [draft, setDraft] = useState<Partial<CreateListingInput> | null>(null);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  function openNew() {
    setEditId(undefined);
    setDraft((d) => (d ? null : {}));
  }
  function openEdit(l: Listing) {
    setEditId(l.id);
    setDraft({ title: l.title, kind: l.kind, pitch: l.pitch, priceUsd: l.priceUsd, platforms: l.platforms });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeComposer() {
    setDraft(null);
    setEditId(undefined);
  }

  const del = useDeleteListing();
  function onDelete(l: Listing) {
    if (typeof window !== "undefined" && !window.confirm(`Delete “${l.title}”? This can’t be undone.`)) return;
    del.mutate(l.id, {
      onSuccess: () => toast("Listing deleted", "success"),
      onError: (e) => toast((e as Error).message, "error"),
    });
  }

  const counts = useMemo(() => {
    const all = listings.data ?? [];
    return {
      total: all.length,
      live: all.filter((l) => l.status === "posted").length,
      drafts: all.filter((l) => l.status === "draft").length,
    };
  }, [listings.data]);

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
            Sell what you build
          </div>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl">
            Freelance Studio
          </h1>
        </div>
        <nav className="flex items-center gap-4 font-mono text-[12px] text-ink3">
          <Link href="/projects" className="transition-colors hover:text-ink">
            projects
          </Link>
          <Link href="/overview" className="transition-colors hover:text-ink">
            overview
          </Link>
        </nav>
      </motion.header>

      {/* Idea Scout band */}
      <IdeaScout
        onDraft={(idea) => {
          setEditId(undefined);
          setDraft({
            title: idea.title,
            kind: idea.kind,
            pitch: `${idea.oneLiner}\n\n${idea.rationale}`,
            priceUsd: idea.suggestedPriceUsd,
            platforms: idea.platforms,
          });
          toast("Idea loaded into the composer", "success");
        }}
      />

      {/* Board header */}
      <div className="mt-10 mb-4 flex items-center gap-4">
        <h2 className="font-serif text-2xl font-light">Listings</h2>
        <span className="font-mono text-[10.5px] text-ink3">
          {counts.live} live · {counts.drafts} draft{counts.drafts === 1 ? "" : "s"}
        </span>
        <Button
          variant="ghost"
          onClick={openNew}
          className="ml-auto px-4 py-2 text-[13px]"
        >
          {draft ? "Close composer" : "+ New listing"}
        </Button>
      </div>

      {/* Inline composer (create or edit) */}
      <AnimatePresence>
        {draft && (
          <Composer
            key="composer"
            initial={draft}
            editId={editId}
            onDone={closeComposer}
          />
        )}
      </AnimatePresence>

      {/* Board */}
      {listings.isLoading && <BoardSkeleton />}
      {!listings.isLoading && (listings.data?.length ?? 0) === 0 && !draft && (
        <Surface className="grid place-items-center gap-3 px-6 py-16 text-center">
          <div className="font-serif text-xl text-ink">Nothing packaged yet</div>
          <p className="max-w-md text-[13.5px] text-ink2">
            Scout ideas above, or compose a listing for something you&rsquo;ve already built —
            then track where it&rsquo;s posted (Gumroad, Contra, Fiverr) from one board.
          </p>
        </Surface>
      )}
      {(listings.data?.length ?? 0) > 0 && (
        <motion.div
          variants={chorus}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {listings.data!.map((l) => (
            <motion.div key={l.id} variants={chorusItem}>
              <ListingCard listing={l} onEdit={openEdit} onDelete={onDelete} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}

/* ── Idea Scout ─────────────────────────────────────────────────────────── */

function IdeaScout({ onDraft }: { onDraft: (idea: ProjectIdea) => void }) {
  const [niche, setNiche] = useState("");
  const agent = useIdeaAgent();
  const valid = niche.trim().length >= 2;

  return (
    <motion.section variants={rise} initial="hidden" animate="show">
      <Surface elevation="raised" className="p-card">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent2" /> idea agent · scouts the market, you decide
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-accent2">›</span>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && !agent.isPending && agent.mutate(niche.trim())}
            placeholder="A niche or audience… e.g. fitness coaches, indie musicians, dental clinics"
            className="flex-1 bg-transparent font-serif text-[15.5px] text-ink outline-none placeholder:text-ink4"
            aria-label="Niche for the idea agent"
          />
          <Button
            magnetic
            onClick={() => agent.mutate(niche.trim())}
            disabled={!valid || agent.isPending}
            className={cn("px-4 py-2 text-[13px]", (!valid || agent.isPending) && "opacity-50")}
          >
            {agent.isPending ? "Scouting…" : "Scout ideas"}
          </Button>
        </div>

        {agent.isError && (
          <p className="mt-3 text-[12px] text-pink-400">{(agent.error as Error).message}</p>
        )}

        <AnimatePresence>
          {agent.data && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5"
            >
              <div className="mb-2.5 flex items-baseline gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
                  5 ideas for “{agent.data.niche}” — ranked by score
                </span>
                {agent.data.ideas[0]?.source === "offline" && (
                  <span className="font-mono text-[9.5px] text-ink4">
                    offline seed set — add ANTHROPIC_API_KEY for live market ideation
                  </span>
                )}
              </div>
              <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                {agent.data.ideas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} onDraft={onDraft} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Surface>
    </motion.section>
  );
}

function IdeaCard({ idea, onDraft }: { idea: ProjectIdea; onDraft: (i: ProjectIdea) => void }) {
  const kindLabel = LISTING_KINDS.find((k) => k.id === idea.kind)?.label ?? idea.kind;
  return (
    <Surface
      onClick={() => onDraft(idea)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onDraft(idea)}
      className="w-[280px] shrink-0 cursor-pointer snap-start p-4 transition-colors hover:border-accent2/50"
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink2">
          {kindLabel}
        </span>
        <span className="font-serif text-lg text-accent2">{idea.total.toFixed(1)}</span>
      </div>
      <h3 className="mt-2 font-serif text-[16px] leading-snug text-ink">{idea.title}</h3>
      <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-ink2">{idea.oneLiner}</p>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <ScoreDot label="demand" value={idea.scores.demand} />
        <ScoreDot label="effort" value={idea.scores.effort} invert />
        <ScoreDot label="fit" value={idea.scores.fit} />
        <ScoreDot label="money" value={idea.scores.monetization} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-ink3">~${idea.suggestedPriceUsd}</span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-accent2">
          → draft listing
        </span>
      </div>
    </Surface>
  );
}

function ScoreDot({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value <= 4 : value >= 7;
  return (
    <div className="text-center">
      <div className={cn("font-mono text-[12px]", good ? "text-accent2" : "text-ink2")}>{value}</div>
      <div className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink4">{label}</div>
    </div>
  );
}

/* ── Composer (inline, prefillable from an idea) ────────────────────────── */

function Composer({
  initial,
  editId,
  onDone,
}: {
  initial: Partial<CreateListingInput>;
  editId?: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const create = useCreateListing();
  const update = useUpdateListing();
  const [title, setTitle] = useState(initial.title ?? "");
  const [kind, setKind] = useState<ListingKind>(initial.kind ?? "ai");
  const [pitch, setPitch] = useState(initial.pitch ?? "");
  const [price, setPrice] = useState(String(initial.priceUsd ?? ""));
  const [platforms, setPlatforms] = useState<ListingPlatform[]>(initial.platforms ?? ["gumroad"]);

  const busy = create.isPending || update.isPending;
  const valid = title.trim().length >= 3 && pitch.trim().length >= 10 && platforms.length > 0;

  function togglePlatform(p: ListingPlatform) {
    setPlatforms((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]));
  }

  async function submit() {
    if (!valid || busy) return;
    const payload = {
      title: title.trim(),
      kind,
      pitch: pitch.trim(),
      priceUsd: price ? Math.max(0, Number(price) || 0) : undefined,
      platforms,
    };
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, patch: payload });
        toast("Listing updated", "success");
      } else {
        await create.mutateAsync(payload);
        toast("Listing created — post it, then mark it live", "success");
      }
      onDone();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <Surface elevation="raised" className="mb-6 p-card">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Assistant Starter Kit for Fitness Coaches"
              className="mt-2 w-full rounded-md border border-white/15 bg-base px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 focus:border-accent2"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
              Price (USD)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="79"
              inputMode="decimal"
              className="mt-2 w-full rounded-md border border-white/15 bg-base px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 focus:border-accent2"
            />
          </div>
        </div>

        <label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
          Pitch — what the buyer gets
        </label>
        <textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          rows={3}
          placeholder="What it does, who it's for, what's included…"
          className="mt-2 w-full resize-y rounded-md border border-white/15 bg-base px-4 py-3 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink4 focus:border-accent2"
        />

        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">Kind</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {LISTING_KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors",
                    kind === k.id ? "border-accent2/70 text-ink" : "border-white/12 text-ink3 hover:text-ink",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
              Target platforms
            </div>
            <div className="mt-2 flex gap-2">
              {LISTING_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors",
                    platforms.includes(p.id)
                      ? "border-accent2/70 text-ink"
                      : "border-white/12 text-ink3 hover:text-ink",
                  )}
                  aria-pressed={platforms.includes(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex gap-3">
            <Button variant="ghost" onClick={onDone} className="px-4 py-2 text-[13px]">
              Cancel
            </Button>
            <Button
              onClick={() => void submit()}
              disabled={!valid || busy}
              className={cn("px-5 py-2 text-[13px]", (!valid || busy) && "opacity-50")}
            >
              {busy ? "Saving…" : editId ? "Save changes" : "Create listing"}
            </Button>
          </div>
        </div>
      </Surface>
    </motion.div>
  );
}

/* ── Listing card (the board) ───────────────────────────────────────────── */

function ListingCard({
  listing,
  onEdit,
  onDelete,
}: {
  listing: Listing;
  onEdit: (l: Listing) => void;
  onDelete: (l: Listing) => void;
}) {
  const { toast } = useToast();
  const toggle = useTogglePosted();
  const kindLabel = LISTING_KINDS.find((k) => k.id === listing.kind)?.label ?? listing.kind;
  const live = listing.status === "posted";

  function onToggle(platform: ListingPlatform) {
    const on = !listing.posted[platform];
    toggle.mutate(
      { id: listing.id, platform, on },
      {
        onSuccess: () =>
          toast(on ? `Marked live on ${platform}` : `Unmarked on ${platform}`, "success"),
        onError: (e) => toast((e as Error).message, "error"),
      },
    );
  }

  return (
    <Surface
      elevation="glass"
      className={cn("h-full p-card transition-colors", live ? "border-accent2/40" : "")}
    >
      <div className="flex items-center gap-2.5">
        <span className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink2">
          {kindLabel}
        </span>
        <span
          className={cn(
            "font-mono text-[9.5px] uppercase tracking-[0.14em]",
            live ? "text-accent2" : "text-ink3",
          )}
        >
          {live ? "● live" : "○ draft"}
        </span>
        <span className="ml-auto font-serif text-[17px] text-ink">
          {listing.priceUsd > 0 ? `$${listing.priceUsd}` : "—"}
        </span>
      </div>

      <h3 className="mt-2.5 font-serif text-lg leading-snug text-ink">{listing.title}</h3>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink2">{listing.pitch}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {listing.platforms.map((p) => {
          const postedAt = listing.posted[p];
          return (
            <button
              key={p}
              onClick={() => onToggle(p)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 font-mono text-[10.5px] transition-colors",
                postedAt
                  ? "border-accent2/60 text-ink"
                  : "border-white/12 text-ink3 hover:border-white/25 hover:text-ink",
              )}
              title={postedAt ? `Posted ${new Date(postedAt).toLocaleDateString()}` : "Mark as posted"}
              aria-pressed={Boolean(postedAt)}
            >
              {postedAt ? "✓ " : ""}
              {p}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4 border-t border-white/[0.06] pt-3">
        <button
          onClick={() => onEdit(listing)}
          className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink3 transition-colors hover:text-ink"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(listing)}
          className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink3 transition-colors hover:text-pink-400"
        >
          Delete
        </button>
        <span className="ml-auto font-mono text-[9.5px] text-ink4">
          updated {new Date(listing.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </Surface>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Surface key={i} className="h-[160px] p-card">
          <div className="h-2.5 w-20 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-5 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
        </Surface>
      ))}
    </div>
  );
}
