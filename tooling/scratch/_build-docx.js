const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak
} = require("docx");

const INK = "0B1020", INDIGO = "4F46E5", INDIGO_DK = "312E81", SLATE = "475569",
  LINE = "C7CCD9", HEAD_FILL = "EEF0FB", SOFT = "F5F6FB", GOLD = "B7791F";
const CONTENT_W = 9360;

function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(new TextRun({ text: tok.slice(2, -2), bold: true, ...base }));
    else if (tok.startsWith("`")) out.push(new TextRun({ text: tok.slice(1, -1), font: "Consolas", color: INDIGO_DK, ...base }));
    else out.push(new TextRun({ text: tok.slice(1, -1), italics: true, ...base }));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  if (out.length === 0) out.push(new TextRun({ text: "", ...base }));
  return out;
}
const P = (text, opts = {}) => new Paragraph({ spacing: { after: 140, line: 276 }, children: runs(text, { size: 21, color: INK }), ...opts });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(t, { size: 30, bold: true, color: INDIGO_DK }) });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(t, { size: 24, bold: true, color: INDIGO }) });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs(t, { size: 21, bold: true, color: INK }) });
const bullet = (t) => new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 70, line: 270 }, children: runs(t, { size: 21, color: INK }) });
const num = (t) => new Paragraph({ numbering: { reference: "n", level: 0 }, spacing: { after: 70, line: 270 }, children: runs(t, { size: 21, color: INK }) });
const quote = (t) => new Paragraph({ spacing: { before: 80, after: 160, line: 288 }, indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: INDIGO, space: 14 } }, shading: { type: ShadingType.CLEAR, fill: SOFT }, children: runs(t, { size: 22, color: INDIGO_DK }) });
const rule = () => new Paragraph({ spacing: { before: 60, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 1 } }, children: [new TextRun("")] });
const pb = () => new Paragraph({ children: [new PageBreak()] });

function table(headers, rows, widths) {
  const cell = (txt, { head = false, fill = null, bold = false, align = AlignmentType.LEFT, w } = {}) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } },
      shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
      margins: { top: 70, bottom: 70, left: 130, right: 130 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: align, spacing: { after: 0, line: 264 }, children: runs(txt, { size: 19, bold: head || bold, color: head ? INDIGO_DK : INK }) })],
    });
  const headRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { head: true, fill: HEAD_FILL, w: widths[i] })) });
  const bodyRows = rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, { fill: ri % 2 ? SOFT : null, bold: i === 0, w: widths[i] })) }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] });
}
const tocLine = (label) => new Paragraph({ spacing: { after: 64 }, tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: "dot" }], children: runs(label, { size: 20, color: INDIGO_DK, bold: true }) });

const cover = [
  new Paragraph({ spacing: { before: 1400, after: 0 }, children: [new TextRun({ text: "FOUNDER", bold: true, size: 88, color: INK }), new TextRun({ text: "OS", bold: true, size: 88, color: INDIGO })] }),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Your Virtual AI Software Company", size: 30, color: SLATE })] }),
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: INDIGO, space: 6 } }, spacing: { after: 260 }, children: [new TextRun("")] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "PRODUCT BIBLE", bold: true, size: 40, color: INDIGO_DK })] }),
  new Paragraph({ spacing: { after: 320 }, children: [new TextRun({ text: "Vision & Product Vision Document — the single source of truth", size: 22, color: SLATE, italics: true })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Step 1 of the FounderOS Operating Document", size: 20, color: INK })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Working title: AI Company OS", size: 20, color: SLATE })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Version 1.0 · Confidential", size: 20, color: SLATE })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Last updated: June 27, 2026", size: 20, color: SLATE })] }),
  new Paragraph({ spacing: { before: 520 }, children: [new TextRun({ text: "16 specialist agents   ·   12 core systems   ·   model-agnostic   ·   10x founder leverage   ·   ~70% inference saved", size: 18, color: GOLD })] }),
  pb(),
];
const toc = [H1("Contents"),
  tocLine("0 · Executive Summary"), tocLine("1 · The Category We Are Creating"), tocLine("2 · Product Philosophy"),
  tocLine("3 · Core Principles"), tocLine("4 · Mission"), tocLine("5 · Long-Term Vision"),
  tocLine("6 · Company Structure (The Product Is the Org)"), tocLine("7 · Differentiators & Moats"),
  tocLine("8 · Success Metrics"), tocLine("9 · Go-To-Market Direction"), tocLine("10 · Key Risks & How the Design Answers Them"),
  tocLine("11 · Future Roadmap"), tocLine("12 · Glossary"), tocLine("13 · Amendment Log"), pb()];

const body = [];
const add = (...e) => e.forEach(x => body.push(x));

add(H1("How to read this document"));
add(P("This is the Bible — the single source of truth that every later artifact (PRDs, architecture docs, design system, GTM plan, investor materials) must trace back to. When a downstream decision conflicts with this document, either the decision is wrong or this document needs a deliberate, versioned amendment. Nothing here is code. Everything here is the *why* that makes the code worth writing."));
add(P("It is organized as a top-down narrative: first what category we are creating, then the philosophy and principles that govern every decision, then the mission and long-term vision, then the company structure (which in our case is also the product), then what makes us defensible, how we measure success, and where we are going."));
add(rule());

add(H1("0 · Executive Summary"));
add(P("FounderOS is a **Virtual AI Software Company**. A single founder describes intent in plain language; behind one calm surface, a coordinated organization of specialized AI agents — executives who steer and specialists who execute — debate, divide the work, build it, review each other, and return one unified, ship-ready answer."));
add(P("It is **not** a chatbot, **not** an AI IDE, and **not** a project-management tool. Those are tools you operate. FounderOS is an *organization you direct*. The difference is the entire thesis: you stop juggling a dozen tools and a dozen chatbots that each start from zero, and instead talk to a company that remembers everything, coordinates itself, and gets sharper with every project."));
add(P("Three forces make it work and make it defensible:"));
add(num("**A coordinated agent org**, not a list of bots — executives arbitrate, specialists execute, and review gates block low-quality output before it ever reaches the founder."));
add(num("**Memory that compounds** — every decision, asset, and pattern is remembered, connected in a knowledge graph, and reused before any new work begins. The OS gets measurably smarter *per founder* over time."));
add(num("**Cost as a first-class citizen** — a model router always sends each task to the cheapest capable model, escalating only on failure, cutting inference spend by roughly 70% while keeping the founder’s spend visible and governable."));
add(quote("The promise to the founder: the leverage of an entire elite software company, on one workspace, for one person."));

add(pb(), H1("1 · The Category We Are Creating"));
add(H2("1.1 The category does not exist yet"));
add(P("Software today is sold in three shapes, and a solo founder is forced to assemble all three by hand:"));
add(bullet("**Chat assistants** answer questions but forget context the moment a session ends and start every task from zero."));
add(bullet("**AI IDEs and copilots** generate code but assume you already are the architect, the PM, the designer, the QA lead, and the security reviewer."));
add(bullet("**Project and ops tools** track work but do none of it."));
add(P("Each is a *tool the founder operates*. The founder remains the integration layer — the only thing holding strategy, design, engineering, testing, security, and memory together is one exhausted human’s attention. Leverage is capped by attention."));
add(P("FounderOS defines a new category: the **Virtual AI Software Company** — software that behaves like an organization rather than a tool. You don’t operate it task-by-task; you *direct* it. The category’s defining property is that **the company is the interface.**"));
add(H2("1.2 The category name and its one-line definition"));
add(quote("Virtual AI Software Company — an operating system in which a coordinated organization of AI agents performs the full lifecycle of building software, presenting one executive-quality output while an internal org discovers, designs, builds, reviews, secures, and remembers the work."));
add(H2("1.3 Why now"));
add(P("Three curves crossed in our favor: frontier models became capable enough to play credible specialist roles; cheaper “good-enough” models made high-volume agent coordination affordable; and persistent, retrievable memory (vector + graph) matured enough to make a system that *remembers* practical. Owning the category means owning the orchestration, the memory, and the routing layers that sit *above* any single model — exactly the layers that don’t commoditize when the next model ships."));

add(pb(), H1("2 · Product Philosophy"));
add(P("The philosophy is the worldview. Every principle, feature, and trade-off below descends from these five beliefs."));
add(H3("The company is the interface."));
add(P("People don’t want more tools; they want outcomes. The highest form of an AI product is not a better chat box but a better *org chart* — a team you can address as one entity. We hide the machinery and present a colleague, not a control panel."));
add(H3("One mind in front, many minds behind."));
add(P("The founder should feel they are talking to one trusted executive. The debate, disagreement, and review among agents is real and rigorous — and invisible by default. Complexity is the system’s job to absorb, not the founder’s job to manage."));
add(H3("Decisions over deliverables."));
add(P("Generating code, copy, or designs is the easy 20%. The hard, valuable 80% is helping a founder make *better decisions* — what to build, what to skip, which trade-off to accept, when not to rewrite. FounderOS optimizes for judgment, not output volume."));
add(H3("Memory is the moat."));
add(P("A company’s value is its accumulated, reusable knowledge. An assistant that forgets is an intern that never grows. FounderOS treats every interaction as an investment in a compounding asset that belongs to the founder."));
add(H3("Frugality is a feature, not an afterthought."));
add(P("Intelligence you can’t afford to run is not intelligence. Spending the least to clear the bar — and showing the founder exactly what was spent and why — is a core part of the product, not a billing detail."));

add(pb(), H1("3 · Core Principles"));
add(P("These are the operating laws. They are testable: any feature can be checked against them."));
add(table(["Principle", "What it means"], [
  ["P1 — Unified, not fragmented.", "One request yields one output. The org’s internal deliberation is surfaced only when the founder asks to see it. We never make the founder assemble the answer from competing fragments."],
  ["P2 — Memory that compounds.", "Every project, decision, component, and insight is written to memory, indexed, and reused. The system must demonstrably improve per founder over time; “stateless” is a bug."],
  ["P3 — Cost as a first-class citizen.", "The router defaults to the cheapest capable model. Spend is visible, attributable, and governable. Escalation to a frontier model is a deliberate, logged event."],
  ["P4 — Review before delivery.", "Nothing reaches the founder without passing the relevant review gates (architecture, QA, security, cost, accessibility). Quality is enforced, not hoped for."],
  ["P5 — Model-agnostic by design.", "Free, local, Gemini, Claude, OpenAI, and whatever ships next all sit behind one interface. The routing layer is ours; the product is never hard-coupled to one vendor."],
  ["P6 — Multi-perspective by default.", "Every non-trivial decision is examined through business, product, user-psychology, engineering, architecture, security, cost, scalability, accessibility, maintainability, and performance lenses."],
  ["P7 — Evolve, don’t churn.", "The system proposes newer, safer, more effective approaches only when the benefit is meaningful. It resists unnecessary rewrites; novelty must earn its place."],
  ["P8 — The founder is always in command.", "Agents advise, draft, and recommend; the founder decides. Autonomy increases only as trust is earned; every autonomous action is reversible and logged."],
  ["P9 — Transparency on demand.", "The single output is the default, but the full reasoning, the agents involved, the models used, and the cost incurred are always one click away."],
  ["P10 — Learn from the open world.", "Continuously learns from public engineering blogs, design resources, conference talks, open docs, and open-source communities — turning best practices into the founder’s defaults."],
], [2900, 6460]));

add(pb(), H1("4 · Mission"));
add(quote("Give every founder the leverage of an elite software company."));
add(P("We exist to collapse the distance between an idea and a well-built, well-reasoned product — so that the constraint on what one person can create is their judgment and ambition, not their headcount, budget, or the number of tools they can hold in their head at once."));
add(P("Concretely, the mission is achieved when a solo founder can take an idea from discovery through research, design, architecture, build, QA, security review, and deployment — and arrive at decisions and deliverables that would normally require a funded team — inside one workspace, at a cost they control, with a system that remembers everything it learns along the way."));
add(H1("5 · Long-Term Vision"));
add(H3("Three-year horizon: the default way one person builds software."));
add(P("A founder opens FounderOS the way a CEO walks into their company on Monday. The OS already knows the portfolio, the design DNA, the past decisions, and the open opportunities. Work begins mid-context, never from zero."));
add(H3("Five-year horizon: the org becomes proactive."));
add(P("FounderOS stops waiting to be asked. The Opportunity Radar surfaces what to build next; the Technology Radar flags what to adopt or retire; the Evolution Engine proposes and (with permission) applies improvements across the founder’s portfolio. The founder’s role shifts from operator to genuine executive."));
add(H3("Ten-year horizon: the OS for teams, then for an economy of builders."));
add(P("What began as leverage for one founder becomes shared infrastructure for studios and teams — shared memory, shared design DNA, governed autonomy. The long arc bends toward a world where the bottleneck on creation is imagination and good judgment, and where building excellent software no longer requires assembling and managing a large organization first."));
add(P("The vision is deliberately bounded by the principles: more autonomy, never less command; more memory, never less transparency; more capability, never less frugality."));

add(pb(), H1("6 · Company Structure (The Product Is the Org)"));
add(P("In FounderOS the org chart *is* the product architecture. The founder sits at the top as the sole human executive. Below sits a three-layer organization of AI roles. Each role is a configurable agent with its own system prompt, tools, default model tier, and review duties — and every one is model-switchable."));
add(H2("6.1 The Executive Layer — steer"));
add(P("The executives translate between the founder and the operational org. They own direction, decomposition, and the final voice."));
add(table(["Agent", "Mandate", "Tier"], [
  ["CEO Agent", "Sets direction, arbitrates trade-offs, owns the single unified output — the voice the founder hears.", "Frontier"],
  ["COO Agent", "Decomposes intent into work, schedules operational agents, tracks delivery — the orchestrator.", "Balanced"],
  ["CTO Agent", "Owns technical strategy, stack decisions, and the bar for architecture and code review.", "Frontier"],
], [1900, 6060, 1400]));
add(H2("6.2 The Operational Layer — execute"));
add(P("Thirteen specialists do the work of a full software company. Each is a domain expert with explicit review duties toward the others."));
add(table(["Agent", "Responsibility"], [
  ["Product Manager", "PRDs, scope, prioritization, acceptance criteria"],
  ["Business Analyst", "Idea scoring, market and viability analysis"],
  ["Competitor Researcher", "Landscape scans, feature and pricing diffs"],
  ["UX Lead", "Flows, information architecture, wireframes, usability heuristics"],
  ["UI Designer", "Visual design, screens, Design DNA application"],
  ["System Architect", "Data models, services, API and infrastructure design"],
  ["Senior Developer", "Implementation guidance, code generation"],
  ["QA Engineer", "Test plans, edge cases, acceptance gates"],
  ["Automation Tester", "Generates and runs automated test suites"],
  ["Security Engineer", "Threat modeling, dependency and secret hygiene, security review gates"],
  ["Content Writer", "Copy, docs, marketing and in-product text"],
  ["Cost Controller", "Tracks spend, enforces budgets, flags waste"],
  ["Memory Manager", "Writes, indexes, and retrieves project memory"],
], [2700, 6660]));
add(H2("6.3 The Coordination Layer — the connective tissue"));
add(P("Twelve core systems make the org function as one entity rather than a crowd of bots:"));
add(bullet("**Agent Orchestrator** — turns intent into a dependency-aware task graph, runs agents in parallel, manages a shared “blackboard” of working state, and enforces review gates before delivery."));
add(bullet("**Model Router** — scores every task and routes it to the lowest-cost model that clears the bar."));
add(bullet("**Memory Architecture** — four layers, from the live run to lifelong founder knowledge."));
add(bullet("**Knowledge Graph** — projects, decisions, components, and insights as nodes; reuse and dependency as edges."));
add(bullet("**Four Intelligence Engines** — Design DNA, Opportunity Radar, Technology Radar, Project Evolution Engine."));
add(bullet("**Supporting runtime** — the project workspace surface, the data layer (Postgres + pgvector + row-level security per workspace), the typed API surface (streaming runs over SSE), backend services, the cost ledger, and the security/governance layer."));
add(H2("6.4 How one request flows through the org"));
add(P("The founder’s single prompt travels an eight-stage loop: **intent in → the COO decomposes it into a task graph → the router assigns the cheapest capable model to each task → specialists execute in parallel against a shared blackboard → agents review each other against acceptance criteria → review gates pass or send work back → the CEO synthesizes one unified answer → the Memory Manager writes the result, decisions, and reusable assets back to memory.** One deliverable out — and the company is a little smarter than it was an hour ago."));
add(H2("6.5 Memory and the four Intelligence Engines"));
add(P("Memory has four layers: the **run/working memory** of a single session’s blackboard; **project memory** spanning a project’s life; **founder memory**, the lifelong, cross-project knowledge of how this founder thinks and builds; and the **knowledge graph** that connects it all for retrieval and reuse."));
add(P("On top of compounded memory, four engines run continuously and turn that memory into proactive leverage:"));
add(table(["Engine", "What it does"], [
  ["Design DNA", "Learns the founder’s design language and keeps every screen and UI agent on-brand automatically."],
  ["Opportunity Radar", "Scores and surfaces what to build next, drawn from the founder’s portfolio and the open world."],
  ["Technology Radar", "Flags newer, safer, more effective approaches to adopt — and aging ones to retire — without forcing churn."],
  ["Project Evolution Engine", "Proposes and (with permission) applies improvements so projects compound rather than stagnate."],
], [2700, 6660]));

add(pb(), H1("7 · Differentiators & Moats"));
add(H2("7.1 What makes FounderOS different"));
add(P("**An org, not a bot list.** Competitors ship a roster of agents you must coordinate. FounderOS ships the *coordination* — orchestration, internal debate, and review gates — as the product. The founder addresses one entity."));
add(P("**One output, internal rigor.** The founder is never asked to referee competing agent answers. The system resolves disagreement internally and delivers a single executive-quality result, with the full debate available on demand."));
add(P("**Compounding, portable memory.** The longer a founder uses FounderOS, the better it gets *for them specifically* — design DNA, decision history, reusable components, and a personal knowledge graph that no fresh chat session can replicate."));
add(P("**Cost-routing as a built-in advantage.** Bring-your-own-key on every tier plus a router that defaults to the cheapest capable model means frontier-quality outcomes without frontier-everywhere bills — roughly 70% inference savings versus calling a top model for every task."));
add(P("**Decision-first, multi-perspective.** Eleven lenses (business through performance) are applied to every meaningful choice. The output is a recommendation a founder can *act on*, not just an artifact they have to evaluate."));
add(H2("7.2 The moats (in order of durability)"));
add(num("**Founder memory & knowledge graph (deepest moat).** Per-founder compounding data creates switching costs that grow every week. Owned data, not a model anyone can call."));
add(num("**Orchestration & review IP.** Task-graph decomposition, the blackboard protocol, and review-gate logic are the hard-won layer that sits above any model and survives model churn."));
add(num("**The routing layer.** Owning model-agnostic routing means every new, cheaper, or better model makes FounderOS *stronger*, not obsolete."));
add(num("**Design DNA & taste capture.** Learning a founder’s aesthetic and standards is sticky and personal."));
add(num("**Category ownership & narrative.** Being the company that *defined* the Virtual AI Software Company shapes how the market evaluates everyone who follows."));
add(H2("7.3 What we deliberately do not do"));
add(P("We don’t make the founder pick agents or models per task. We don’t chase novelty for its own sake or push rewrites without meaningful benefit. We don’t hide cost. We don’t lock the founder to one model vendor. We don’t optimize for output volume over decision quality. Each “don’t” is a principle made visible."));

add(pb(), H1("8 · Success Metrics"));
add(H2("8.1 North Star Metric"));
add(quote("Founder Leverage Ratio — the amount of credible, ship-ready, multi-disciplinary output a single founder produces per unit of their own attention."));
add(P("Everything else is a supporting metric. If the North Star moves, we are delivering on the mission; if it stalls, no other metric matters."));
add(H2("8.2 Supporting metrics, by theme"));
add(table(["Theme", "Representative metrics"], [
  ["Leverage & value", "Time-to-decision and time-to-deliverable; tasks per founder-hour; share of work accepted unchanged; disciplines engaged per project."],
  ["Memory compounding", "Solution-reuse rate; per-founder quality lift (week 12 vs week 1); knowledge-graph density growth per active founder."],
  ["Cost discipline", "Average cost per delivered output; % handled by sub-frontier tiers; realized savings vs frontier-everywhere (~70%); budget adherence."],
  ["Quality & trust", "Review-gate pass rate; post-delivery defect rate; security findings caught pre- vs post-delivery; inspection and override rates."],
  ["Business health", "Activation (first unified deliverable shipped); week-4 and week-12 retention; Free→Founder→Studio conversion; NRR; portfolio size."],
], [2300, 7060]));
add(H2("8.3 Guardrail (counter) metrics"));
add(P("To make sure we don’t win the wrong way: founder override rate shouldn’t spike (a sign the org is wrong, not helpful); rewrite/churn rate must stay low (P7); cost-per-output must not creep; and inspection rate climbing toward 100% would signal eroding trust in the single-output promise."));

add(pb(), H1("9 · Go-To-Market Direction"));
add(P("This is strategic direction, not the full GTM plan."));
add(P("**Who first.** Technical and semi-technical solo founders and indie builders who already feel the pain of juggling tools and starting every chat from zero — the people for whom “one founder, the leverage of a company” is visceral, not aspirational."));
add(P("**The wedge.** Bring-your-own-key, a free Solo tier with the core agent loop, and a single undeniable “wow”: one prompt → a coordinated org → one ship-ready output that visibly remembers the last one. Land on leverage, expand on memory."));
add(P("**Pricing philosophy.** Priced on *leverage, not seats*. BYO-key keeps inference at cost on every tier; plans gate org depth, memory retention, and the intelligence engines."));
add(table(["Plan", "Price", "Who it’s for"], [
  ["Solo", "Free (BYO key)", "Single active project, core agent loop — the wedge."],
  ["Founder", "$29 / mo", "The full org for one builder."],
  ["Studio", "$99 / mo", "Agencies and small teams; shared memory & design DNA."],
  ["Enterprise", "Custom", "Self-host, SSO, governance."],
], [1900, 2300, 5160]));
add(P("**The expansion path.** Single founder → multi-project portfolio → studio/team with shared memory and design DNA → enterprise with governance and self-hosting. Memory is the gravity that pulls each step."));
add(P("**The narrative.** Sell the category, not the features. “Stop talking to agents. Talk to a company.” Every piece of content reinforces that FounderOS is an organization you direct, and that it compounds."));

add(pb(), H1("10 · Key Risks & How the Design Answers Them"));
add(table(["Risk", "How the design answers it"], [
  ["Quality / trust — a wrong single output breaks the whole promise.", "Enforced review gates (P4), multi-perspective rigor (P6), transparency-on-demand (P9)."],
  ["Cost runaway — agent orgs get expensive fast.", "Cost as a first-class principle (P3), the router (P5), BYO-key, Cost Controller with visible budgets."],
  ["Model dependency — tying to one vendor is fragile.", "Model-agnostic routing (P5) — every new model is an upgrade, not a threat."],
  ["Over-automation — founders fear agents acting alone.", "The founder is always in command (P8); autonomy is earned, logged, reversible."],
  ["Complexity leaking to the user.", "Unified output (P1); the org’s debate stays invisible unless summoned."],
  ["Cold-start emptiness — engines need data.", "Sequence Design DNA and the Radars late, after memory and the graph are populated."],
  ["Category education cost.", "Lead with one undeniable demo and a sharp “company, not chatbot” narrative."],
], [3700, 5660]));

add(pb(), H1("11 · Future Roadmap"));
add(P("The roadmap is sequenced by dependency, not excitement. Memory is the foundation everything reads from; the router makes the org affordable; the orchestrator coordinates it; surfaces and intelligence engines layer on only once memory has compounded. The critical path **Memory → Router → Orchestrator** is strictly sequential."));
add(table(["Release", "When", "Goal"], [
  ["MVP — Prove the loop", "Months 0–3", "One prompt → coordinated agents → one output, with working memory and routing, demonstrably better than chatting with separate bots. The existence proof of the category."],
  ["Phase 1 — The full org", "Months 3–6", "All 16 agents, the project lifecycle, and persistent project memory across the workspace’s core screens."],
  ["Phase 2 — Intelligence", "Months 6–9", "Design DNA, Opportunity & Technology Radar, and the knowledge graph turn memory into proactive leverage."],
  ["Phase 3 — Autonomy", "Months 9–12", "The Evolution Engine proposes and applies improvements; agents act with less supervision, staying reversible and logged."],
  ["Phase 4 — Teams & scale", "Year 2", "Multi-seat studios, shared memory, self-host, SSO, and governance — the OS for whole teams."],
], [2500, 1600, 5260]));
add(P("Each phase is gated by the prior phase’s North Star movement, not by the calendar alone. We do not advance to intelligence and autonomy until the underlying memory is dense enough to make them high-signal."));

add(pb(), H1("12 · Glossary"));
add(table(["Term", "Meaning"], [
  ["Virtual AI Software Company", "The category: software that behaves like an organization you direct, not a tool you operate."],
  ["Agent", "A configurable AI role with its own prompt, tools, default model tier, and review duties."],
  ["Orchestrator", "The system that turns intent into a task graph and coordinates agents."],
  ["Blackboard", "Shared working memory all agents read and write during a single run."],
  ["Review gate", "An acceptance check that must pass before output reaches the founder."],
  ["Model Router", "The layer that sends each task to the cheapest capable model."],
  ["Tier", "A cost/capability band of models: Local ($0) → Fast ($) → Balanced ($$) → Frontier ($$$)."],
  ["Design DNA", "The learned, reusable design language of a founder."],
  ["Knowledge Graph", "The connected memory of projects, decisions, components, and insights."],
  ["Founder Leverage Ratio", "The North Star: ship-ready multidisciplinary output per unit of founder attention."],
], [3000, 6360]));
add(H1("13 · Amendment Log"));
add(table(["Version", "Date", "Change"], [
  ["1.0", "2026-06-27", "Initial Product Bible synthesized from the AI Company OS blueprint and significantly enhanced (category, philosophy, principles, moats, metrics, GTM, risks)."],
], [1300, 1700, 6360]));
add(rule());
add(quote("Next step in the operating document: Step 2 — translate this Bible into a PRD and the first release’s acceptance criteria, starting with the MVP “prove the loop” scope."));
add(P("*This is the source of truth. Amend it deliberately; never drift from it silently.*", { alignment: AlignmentType.CENTER }));

const doc = new Document({
  creator: "FounderOS", title: "FounderOS — Product Bible",
  styles: {
    default: { document: { run: { font: "Calibri", size: 21, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, font: "Calibri", color: INDIGO_DK }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: INDIGO, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Calibri", color: INDIGO }, paragraph: { spacing: { before: 200, after: 110 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 21, bold: true, font: "Calibri", color: INK }, paragraph: { spacing: { before: 140, after: 70 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { run: { color: INDIGO }, paragraph: { indent: { left: 600, hanging: 280 } } } }] },
    { reference: "n", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 320 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9360 }], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } }, children: [new TextRun({ text: "FounderOS", bold: true, size: 16, color: INDIGO }), new TextRun({ text: "  ·  Product Bible", size: 16, color: SLATE }), new TextRun({ text: "\tCONFIDENTIAL · v1.0", size: 15, color: SLATE })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9360 }], children: [new TextRun({ text: "Source of truth — amend deliberately", size: 15, color: SLATE, italics: true }), new TextRun({ text: "\t", size: 15 }), new TextRun({ children: ["Page ", PageNumber.CURRENT], size: 16, color: SLATE })] })] }) },
    children: [...cover, ...toc, ...body],
  }],
});
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(process.argv[2], buf); console.log("written", buf.length); });
