"use client";

/**
 * SystemMap — the infrastructure, animated.
 * An honest SVG diagram of the REAL request path we built:
 *
 *   Browser (⌘K UI) → /api/v1 guard stack (same-origin · session · rate limit ·
 *   safety gate) → Model Router (cheapest-capable + fallback) → activated
 *   departments (PM/AR/UX/QA) → Debate → CEO → persisted to Memory
 *   (runs · notes · listings) → streamed back over SSE.
 *
 * Packets pulse along the paths via SVG dash animation — pure CSS, no library,
 * honors prefers-reduced-motion. Every node on this map exists in the repo.
 */
export function SystemMap() {
  return (
    <div className="w-full">
      <svg
        viewBox="0 0 980 460"
        role="img"
        aria-label="FounderOS architecture: browser through guards, router, departments, debate, CEO, memory, streamed back over SSE"
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="sm-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6d5df6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
          <style>{`
            .sm-box{fill:rgba(255,255,255,.03);stroke:rgba(255,255,255,.14);rx:10}
            .sm-hot{stroke:rgba(34,211,238,.45)}
            .sm-t{fill:#eef0f6;font:500 13px Inter,system-ui,sans-serif}
            .sm-s{fill:#7d8294;font:400 9.5px 'JetBrains Mono',monospace}
            .sm-g{fill:#b6bac8;font:400 10px 'JetBrains Mono',monospace}
            .sm-line{stroke:rgba(255,255,255,.16);stroke-width:1.4;fill:none}
            .sm-flow{stroke:url(#sm-grad);stroke-width:1.6;fill:none;stroke-dasharray:5 9;animation:sm-dash 1.6s linear infinite}
            .sm-back{stroke:rgba(34,211,238,.55);stroke-width:1.4;fill:none;stroke-dasharray:3 10;animation:sm-dash 1.2s linear infinite reverse}
            @keyframes sm-dash{to{stroke-dashoffset:-28}}
            @media (prefers-reduced-motion: reduce){.sm-flow,.sm-back{animation:none}}
          `}</style>
        </defs>

        {/* Browser */}
        <rect className="sm-box" x="20" y="180" width="130" height="90" rx="10" />
        <text className="sm-t" x="38" y="212">Browser</text>
        <text className="sm-s" x="38" y="230">⌘K palette · SSE</text>
        <text className="sm-s" x="38" y="244">optimistic UI</text>

        {/* Guard stack */}
        <rect className="sm-box sm-hot" x="205" y="140" width="170" height="170" rx="10" />
        <text className="sm-t" x="224" y="170">/api/v1 guards</text>
        <text className="sm-g" x="224" y="194">▸ same-origin (CSRF)</text>
        <text className="sm-g" x="224" y="212">▸ signed session</text>
        <text className="sm-g" x="224" y="230">▸ workspace tenancy</text>
        <text className="sm-g" x="224" y="248">▸ rate limits</text>
        <text className="sm-g" x="224" y="266">▸ safety gate</text>
        <text className="sm-g" x="224" y="284">▸ zod validation</text>

        {/* Router */}
        <rect className="sm-box" x="430" y="60" width="160" height="96" rx="10" />
        <text className="sm-t" x="448" y="90">Model Router</text>
        <text className="sm-s" x="448" y="108">cheapest capable</text>
        <text className="sm-s" x="448" y="122">echo · haiku · sonnet · opus</text>
        <text className="sm-s" x="448" y="136">fallback → never fails</text>

        {/* Departments */}
        <rect className="sm-box" x="430" y="186" width="160" height="88" rx="10" />
        <text className="sm-t" x="448" y="214">Departments</text>
        <text className="sm-s" x="448" y="232">PM · AR · UX · QA</text>
        <text className="sm-s" x="448" y="246">minimum-set activation</text>
        <text className="sm-s" x="448" y="260">budget governor</text>

        {/* Research */}
        <rect className="sm-box" x="430" y="304" width="160" height="88" rx="10" />
        <text className="sm-t" x="448" y="332">Research</text>
        <text className="sm-s" x="448" y="350">search seam (live/offline)</text>
        <text className="sm-s" x="448" y="364">cited briefs only</text>
        <text className="sm-s" x="448" y="378">idea agent · scoring</text>

        {/* Debate + CEO */}
        <rect className="sm-box sm-hot" x="650" y="140" width="150" height="170" rx="10" />
        <text className="sm-t" x="668" y="170">Debate → CEO</text>
        <text className="sm-g" x="668" y="194">challenge · concern</text>
        <text className="sm-g" x="668" y="212">· support</text>
        <text className="sm-g" x="668" y="234">tension guaranteed</text>
        <text className="sm-g" x="668" y="256">CEO resolves every</text>
        <text className="sm-g" x="668" y="272">disagreement</text>
        <text className="sm-g" x="668" y="294">one answer + receipt</text>

        {/* Memory */}
        <rect className="sm-box" x="855" y="150" width="110" height="150" rx="10" />
        <text className="sm-t" x="871" y="180">Memory</text>
        <text className="sm-s" x="871" y="200">runs · notes</text>
        <text className="sm-s" x="871" y="214">briefs · listings</text>
        <text className="sm-s" x="871" y="234">Mongo / in-mem</text>
        <text className="sm-s" x="871" y="254">recalled into</text>
        <text className="sm-s" x="871" y="268">every next run</text>

        {/* Forward flows */}
        <path className="sm-flow" d="M150 225 H205" />
        <path className="sm-flow" d="M375 200 C405 180 405 120 430 108" />
        <path className="sm-flow" d="M375 228 H430" />
        <path className="sm-flow" d="M375 260 C405 280 405 336 430 340" />
        <path className="sm-flow" d="M590 108 C625 120 625 170 650 185" />
        <path className="sm-flow" d="M590 228 H650" />
        <path className="sm-flow" d="M590 345 C630 350 640 300 650 285" />
        <path className="sm-flow" d="M800 225 H855" />

        {/* SSE return path */}
        <path className="sm-back" d="M855 290 C500 430 180 380 90 272" />
        <text className="sm-s" x="420" y="428">SSE — plan · departments · critiques · decision, streamed live</text>
      </svg>
    </div>
  );
}
