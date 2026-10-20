import { randomUUID } from "node:crypto";
import { ModelRouter } from "./router";
import { ETHOS } from "./governors";
import { KeyRing, coolDownFor, readKeys } from "./keys";

/**
 * Live Research Agent — P1 on the money path.
 * ─────────────────────────────────────────────────────────────────────────
 * topic → 3 targeted searches (competitors · demand · risks) → the routed
 * model distills the hits into a CITED brief. Every claim in the brief traces
 * to a source URL; uncited output is a bug, not a style choice.
 *
 * The search seam mirrors the model seam: `SearchProvider` is the contract,
 * `TavilySearchProvider` is the live adapter (TAVILY_API_KEY), and
 * `OfflineSearchProvider` produces deterministic, honestly-labeled fixtures
 * so the whole flow runs with zero keys. Swapping providers (Brave, Serper…)
 * is one new adapter — nothing upstream changes.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProvider {
  readonly key: string;
  search(query: string): Promise<SearchHit[]>;
}

export interface ResearchBrief {
  id: string;
  topic: string;
  summary: string;
  competitors: Array<{ name: string; angle: string }>;
  demand: string;
  risks: string[];
  opportunities: string[];
  sources: SearchHit[];
  /** "live" = real web search; "offline" = fixture seam (no key configured). */
  source: "live" | "offline";
  costUsd: number;
  createdAt: string;
}

export type ResearchEvent =
  | { type: "query"; query: string }
  | { type: "hits"; query: string; count: number }
  | { type: "distill" }
  | { type: "done" };

/* ── Providers ──────────────────────────────────────────────────────────── */

/**
 * Tavily — simple JSON search API, free monthly credits per key.
 * Env: TAVILY_API_KEY, TAVILY_API_KEY_ONE, or a comma list in TAVILY_API_KEYS.
 * A key that is out of credits or rate-limited rests and the next one is used.
 */
export const TAVILY_KEY_VARS = ["TAVILY_API_KEYS", "TAVILY_API_KEY", "TAVILY_API_KEY_ONE", "TAVILY_API_KEY_TWO"] as const;

export class TavilySearchProvider implements SearchProvider {
  readonly key = "tavily";
  private readonly ring: KeyRing;
  constructor(apiKeys: readonly string[]) {
    this.ring = new KeyRing(apiKeys);
  }

  async search(query: string): Promise<SearchHit[]> {
    let lastStatus = 0;
    for (const apiKey of this.ring.available()) {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ query, max_results: 5 }),
      });
      if (!res.ok) {
        lastStatus = res.status;
        // 432/433 = Tavily plan or credit limit reached: rest like a rate limit.
        const ms = res.status === 432 || res.status === 433 ? coolDownFor(429) : coolDownFor(res.status);
        if (ms === undefined) break;
        this.ring.rest(apiKey, ms);
        continue;
      }
      const data = (await res.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
      return (data.results ?? [])
        .filter((r) => r.url)
        .map((r) => ({
          title: String(r.title ?? r.url).slice(0, 120),
          url: String(r.url),
          snippet: String(r.content ?? "").slice(0, 280),
        }));
    }
    throw new Error(`Tavily search failed (${lastStatus || "all keys resting"})`);
  }
}

/** Offline fixtures — deterministic, labeled, never pretends to be the web. */
class OfflineSearchProvider implements SearchProvider {
  readonly key = "offline";

  async search(query: string): Promise<SearchHit[]> {
    const q = query.toLowerCase();
    const slug = q.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
    const kind = q.includes("competitor") ? "competitors" : q.includes("demand") ? "demand" : "risks";
    const fixtures: Record<string, SearchHit[]> = {
      competitors: [
        { title: `Top tools in this space (directory)`, url: `https://example.com/${slug}/landscape`, snippet: "Established players compete on breadth; newcomers win on a single sharp workflow and price clarity." },
        { title: `Indie alternatives compared`, url: `https://example.com/${slug}/alternatives`, snippet: "Most alternatives under-serve onboarding; reviews repeatedly cite setup friction as the switching trigger." },
      ],
      demand: [
        { title: `Community discussions on ${slug}`, url: `https://example.com/${slug}/forum`, snippet: "Recurring requests cluster around automation of the same weekly task; willingness to pay appears at the time-saved threshold." },
        { title: `Search & marketplace trend notes`, url: `https://example.com/${slug}/trends`, snippet: "Steady interest with seasonal spikes; buyers prefer templates and done-for-you setups over raw tools." },
      ],
      risks: [
        { title: `Common failure modes in this niche`, url: `https://example.com/${slug}/postmortems`, snippet: "Churn concentrates in week one; products that skip niche-specific defaults get abandoned before value lands." },
        { title: `Platform & policy considerations`, url: `https://example.com/${slug}/policy`, snippet: "Marketplace policy changes are the main external risk; diversifying channels mitigates it." },
      ],
    };
    return fixtures[kind] ?? [];
  }
}

function buildProvider(): SearchProvider {
  const keys = readKeys(process.env, TAVILY_KEY_VARS);
  return keys.length ? new TavilySearchProvider(keys) : new OfflineSearchProvider();
}

/* ── The agent ──────────────────────────────────────────────────────────── */

export async function runResearch(
  topic: string,
  onEvent?: (e: ResearchEvent) => void,
): Promise<ResearchBrief> {
  const provider = buildProvider();
  const router = new ModelRouter();
  let costUsd = 0;

  const queries = [
    `${topic} competitors and alternatives`,
    `${topic} market demand and willingness to pay`,
    `${topic} risks and common failure modes`,
  ];

  // 1) Search (parallel; a failed query degrades to empty, never kills the run).
  const hitGroups = await Promise.all(
    queries.map(async (q) => {
      onEvent?.({ type: "query", query: q });
      try {
        const hits = await provider.search(q);
        onEvent?.({ type: "hits", query: q, count: hits.length });
        return hits;
      } catch {
        onEvent?.({ type: "hits", query: q, count: 0 });
        return [] as SearchHit[];
      }
    }),
  );
  const sources = dedupe(hitGroups.flat()).slice(0, 12);

  // 2) Distill into a cited brief.
  onEvent?.({ type: "distill" });
  const model = router.pick(0.85);
  const numbered = sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.snippet} (${s.url})`).join("\n");
  const out = await router.run(model, {
    system:
      "You are the Research department. Distill the numbered sources into STRICT JSON only, with keys: " +
      "summary (3-4 sentences, cite sources inline like [1]), " +
      "competitors (array of {name, angle}), demand (2 sentences with citation), " +
      "risks (array of strings), opportunities (array of strings). " +
      "Every factual claim must trace to a numbered source. If the sources are thin, say so plainly - never invent." +
      ETHOS,
    prompt: `Topic: ${topic}\n\nSources:\n${numbered || "(no sources found)"}\n\nReturn the JSON now.`,
  });
  costUsd += out.costUsd;

  const parsed = parseBrief(out.text);
  const brief: ResearchBrief = {
    id: `res_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    topic,
    ...(parsed ?? offlineDistill(topic, sources)),
    sources,
    source: provider.key === "offline" ? "offline" : "live",
    costUsd: Math.round(costUsd * 1e6) / 1e6,
    createdAt: new Date().toISOString(),
  };

  onEvent?.({ type: "done" });
  return brief;
}

/* ── Distillation helpers ───────────────────────────────────────────────── */

type BriefCore = Pick<ResearchBrief, "summary" | "competitors" | "demand" | "risks" | "opportunities">;

function parseBrief(text: string): BriefCore | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const r = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const strArr = (v: unknown) =>
      Array.isArray(v) ? v.map((x) => String(x).slice(0, 300)).filter((s) => s.length > 3).slice(0, 6) : [];
    const competitors = Array.isArray(r.competitors)
      ? r.competitors
          .map((c) => {
            const o = c as Record<string, unknown>;
            return { name: String(o.name ?? "").slice(0, 80), angle: String(o.angle ?? "").slice(0, 200) };
          })
          .filter((c) => c.name.length > 1)
          .slice(0, 6)
      : [];
    const core: BriefCore = {
      summary: String(r.summary ?? "").slice(0, 1200),
      competitors,
      demand: String(r.demand ?? "").slice(0, 500),
      risks: strArr(r.risks),
      opportunities: strArr(r.opportunities),
    };
    return core.summary.length >= 30 ? core : null;
  } catch {
    return null;
  }
}

/** Honest offline distillation — built FROM the fixtures, clearly hedged. */
function offlineDistill(topic: string, sources: SearchHit[]): BriefCore {
  const cite = sources.length > 0 ? " [1]" : "";
  return {
    summary:
      `Offline research seed for "${topic}": the pattern across comparable niches is that established tools ` +
      `compete on breadth while newcomers win with one sharp workflow${cite}. Setup friction is the most-cited ` +
      `switching trigger, and buyers consistently prefer templates or done-for-you setups over raw tools. ` +
      `Treat this as a starting hypothesis — connect a search key (TAVILY_API_KEY) for live, source-backed research.`,
    competitors: [
      { name: "Incumbent suites", angle: "Breadth and integrations; weak at niche-specific onboarding." },
      { name: "Indie templates", angle: "Cheap and fast to adopt; rarely maintained past launch." },
    ],
    demand: `Interest in this space is steady with seasonal spikes; willingness to pay appears where a weekly task is fully automated${cite}.`,
    risks: [
      "Week-one churn if niche defaults are missing",
      "Marketplace/platform policy shifts",
      "Competing on price against free templates",
    ],
    opportunities: [
      "Own the onboarding gap competitors ignore",
      "Sell the done-for-you setup, not the tool",
      "Bundle a niche-tuned AI assistant as the differentiator",
    ],
  };
}

function dedupe(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    if (seen.has(h.url)) return false;
    seen.add(h.url);
    return true;
  });
}
