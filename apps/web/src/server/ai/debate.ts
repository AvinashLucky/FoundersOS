import { ModelRouter } from "./router";
import { ETHOS } from "./governors";
import type { DebateEntry, DepartmentResult, Stance } from "./types";

/**
 * The debate round — departments challenge each other before the CEO decides.
 * ─────────────────────────────────────────────────────────────────────────
 * After the initial takes, each activated department reviews the OTHERS' work
 * and returns 1–2 short points, each tagged support / challenge / concern.
 * Genuine tension is a hard requirement: consensus theater is worthless, so
 * if a round somehow produces zero pushback we inject a role-appropriate
 * challenge from the fallback matrix.
 *
 * Cost discipline: critiques route through the CHEAP tier (they're short,
 * reactive judgments — not generation-heavy work). Offline, the EchoProvider
 * can't produce JSON, so a deterministic role-flavoured fallback speaks in
 * each department's voice — distinct, opinionated, never filler.
 * ─────────────────────────────────────────────────────────────────────────
 */
const STANCES: Stance[] = ["support", "challenge", "concern"];

/**
 * The fallback matrix — who pushes on whom, and about what. Written the way
 * each department actually thinks: QA distrusts unstated failure modes, UX
 * defends the core flow, AR defends buildability, PM defends the window.
 */
const FALLBACK: Record<
  string,
  Array<{ to: string; stance: Stance; text: (intent: string) => string }>
> = {
  QA: [
    {
      to: "AR",
      stance: "challenge",
      text: (i) =>
        `The architecture take on "${truncIntent(i)}" names no failure mode. What happens when the primary path times out mid-write? I need retries and a rollback story defined before we build, not after the first incident.`,
    },
    {
      to: "PM",
      stance: "concern",
      text: () =>
        `Scope reads wider than one release. Every added surface multiplies the untested edge cases — phase it, or accept that QA becomes the bottleneck.`,
    },
    {
      to: "UX",
      stance: "concern",
      text: () =>
        `The proposed flow has states nobody specced: empty, error, offline. If Design doesn't define them, users will meet the unstyled versions.`,
    },
  ],
  UX: [
    {
      to: "PM",
      stance: "challenge",
      text: () =>
        `The scope buries the one flow users actually came for. Cut to the core journey this release — every secondary feature dilutes the first-run experience we'll be judged on.`,
    },
    {
      to: "AR",
      stance: "concern",
      text: () =>
        `If the backend shape dictates the interface, this will feel like a database with buttons. The API contract should follow the user flow, not the schema.`,
    },
    {
      to: "QA",
      stance: "support",
      text: () =>
        `Agreed on the risk list — the edge cases QA named are exactly the states I want designed deliberately, not discovered in production.`,
    },
  ],
  AR: [
    {
      to: "UX",
      stance: "concern",
      text: () =>
        `The flow as designed implies live updates everywhere — that's websockets, retry logic, and cache invalidation. Buildable, but it doubles the surface; a static-first version ships weeks sooner.`,
    },
    {
      to: "PM",
      stance: "support",
      text: () =>
        `The scope is technically sound — the phasing is realistic and nothing here fights the existing architecture.`,
    },
    {
      to: "QA",
      stance: "challenge",
      text: () =>
        `Full coverage on every path before launch is the slowest possible route. Gate the critical writes, monitor the rest — perfection here costs us the window.`,
    },
  ],
  PM: [
    {
      to: "AR",
      stance: "challenge",
      text: () =>
        `"The simplest design that scales" still lands two weeks past the window by my read. What do we drop to ship on time — scale headroom we don't need yet, or a feature users do?`,
    },
    {
      to: "UX",
      stance: "support",
      text: () =>
        `The flow-first cut matches the user problem we prioritised — aligned on shipping the core journey before anything decorative.`,
    },
    {
      to: "QA",
      stance: "concern",
      text: () =>
        `The risk list is right but unranked. If everything is critical, nothing is — I need the top three blockers, not the full catalogue.`,
    },
  ],
};

function truncIntent(i: string): string {
  return i.length > 60 ? `${i.slice(0, 60)}…` : i;
}

/**
 * Run the debate: every activated department critiques the others.
 * Returns the entries (deterministic order: department order, then per-critic
 * order) plus the round's total model cost. Needs ≥2 departments to debate.
 */
export async function generateDebate(
  router: ModelRouter,
  intent: string,
  departments: DepartmentResult[],
): Promise<{ entries: DebateEntry[]; costUsd: number }> {
  if (departments.length < 2) return { entries: [], costUsd: 0 };

  let costUsd = 0;

  const perCritic = await Promise.all(
    departments.map(async (critic) => {
      const others = departments.filter((d) => d.abbr !== critic.abbr);
      const brief = others
        .map((o) => `${o.abbr} (${o.role}): ${o.output.slice(0, 400)}`)
        .join("\n");

      const model = router.pick(0.7); // cheap tier — short reactive judgments
      const out = await router.run(model, {
        system:
          `You are the ${critic.role} department (${critic.abbr}) in a product debate. ` +
          `Review the OTHER departments' takes and respond with STRICT JSON only - an array of 1 to 2 objects ` +
          `with keys: to (one of ${others.map((o) => `"${o.abbr}"`).join(", ")}), ` +
          `stance ("support" | "challenge" | "concern"), text (one or two sharp sentences in your department's voice). ` +
          `Be honest, not polite: at least one entry must be a "challenge" or "concern" naming a real risk, ` +
          `trade-off, or disagreement. Never invent facts.` +
          ETHOS,
        prompt: `Intent: ${intent}\n\nYour own take (for context): ${critic.output.slice(0, 300)}\n\nThe other departments said:\n${brief}\n\nReturn the JSON array now.`,
      });
      costUsd += out.costUsd;

      const parsed = parseCritiques(out.text, critic.abbr, others.map((o) => o.abbr));
      if (parsed.length > 0) return parsed;

      // Offline / unparseable → the critic's fallback voice, aimed only at
      // departments actually in the room.
      return fallbackCritiques(critic.abbr, others.map((o) => o.abbr), intent);
    }),
  );

  const entries = perCritic.flat();

  // Governor of honesty: a debate with zero pushback is consensus theater.
  if (!entries.some((e) => e.stance === "challenge" || e.stance === "concern")) {
    const abbrs = departments.map((d) => d.abbr);
    const forced = fallbackCritiques(abbrs[0]!, abbrs.slice(1), intent).find(
      (e) => e.stance !== "support",
    );
    if (forced) entries.push(forced);
  }

  return { entries, costUsd };
}

/** Parse a model's critique JSON defensively (model output is untrusted). */
function parseCritiques(text: string, from: string, validTargets: string[]): DebateEntry[] {
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end <= start) return [];
    const raw = JSON.parse(text.slice(start, end + 1)) as unknown;
    if (!Array.isArray(raw)) return [];

    return raw
      .slice(0, 2)
      .map((item) => {
        const r = item as Record<string, unknown>;
        return {
          from,
          to: String(r.to ?? ""),
          stance: (STANCES.includes(r.stance as Stance) ? r.stance : "concern") as Stance,
          text: String(r.text ?? "").trim().slice(0, 400),
        };
      })
      .filter((e) => validTargets.includes(e.to) && e.to !== from && e.text.length >= 10);
  } catch {
    return [];
  }
}

/** Deterministic role-flavoured critiques for offline runs. */
function fallbackCritiques(from: string, targets: string[], intent: string): DebateEntry[] {
  const options = (FALLBACK[from] ?? []).filter((o) => targets.includes(o.to));
  return options.slice(0, 2).map((o) => ({
    from,
    to: o.to,
    stance: o.stance,
    text: o.text(intent),
  }));
}
