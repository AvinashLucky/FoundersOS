"use client";

import { motion } from "framer-motion";
import { useTheme } from "@shared/providers/ThemeProvider";
import { Surface } from "@shared/ui/Surface";
import { Button } from "@shared/ui/Button";
import { rise } from "@shared/motion/variants";
import { WeeklyBriefCard } from "@modules/founder-intelligence";
import { AgentChorus } from "./components/AgentChorus";
import { ExecutiveAnswer } from "./components/ExecutiveAnswer";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

const AGENTS = [
  { abbr: "PM", name: "Product", role: "scope · PRD", done: true },
  { abbr: "AR", name: "Architecture", role: "system design", done: true },
  { abbr: "UX", name: "Design", role: "flow · DNA", done: true },
  { abbr: "QA", name: "QA + Security", role: "gates", done: true },
];

/**
 * The flagship screen. One intent line → the company works → one answer, with the
 * Founder Intelligence brief alongside. This composes the design system + modules;
 * it is the reference for the quality bar every other screen must meet.
 */
export function CommandSurface() {
  const { theme } = useTheme();

  return (
    <main className="mx-auto max-w-5xl px-7 py-16">
      {/* Header / project identity */}
      <motion.header variants={rise} initial="hidden" animate="show" className="mb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">
          {theme.domain} · {theme.character}
        </div>
        <h1 className="mt-4 font-serif text-4xl font-light leading-tight tracking-tight sm:text-5xl">
          What should we build,
          <br />
          <span className="text-accent2">today?</span>
        </h1>
      </motion.header>

      {/* Command line */}
      <motion.div variants={rise} initial="hidden" animate="show">
        <Surface elevation="raised" className="flex items-center gap-3.5 px-5 py-4">
          <span className="font-mono text-accent2">›</span>
          <span className="font-serif text-lg text-ink">Design the onboarding flow for my SaaS.</span>
          <span className="ml-1 inline-block h-5 w-0.5 animate-pulse2 bg-accent2" />
          <Button magnetic className="ml-auto px-4 py-2 text-[13px]">
            Run
          </Button>
        </Surface>
      </motion.div>

      {/* Company at work */}
      <section className="mt-8">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
          company at work — 4 departments, 9 tasks in parallel
        </div>
        <AgentChorus agents={AGENTS} />
      </section>

      {/* The single answer */}
      <section className="mt-8">
        <ExecutiveAnswer
          meta={[
            { value: "4", label: "departments" },
            { value: "11", label: "tasks · 9 parallel" },
            { value: "2", label: "assets reused" },
            { value: "$0.14", label: "spend · ~71% saved" },
            { value: "↩", label: "reversible" },
          ]}
        >
          Here&rsquo;s the plan for your onboarding flow: a three-step magic-link signup, a reused
          billing module from <span className="text-accent2">Project Atlas</span>, and a
          security-reviewed session model — kept on your Design DNA and routed through balanced
          models, with frontier reserved for the architecture call.
        </ExecutiveAnswer>
      </section>

      {/* Founder Intelligence + adaptive themes */}
      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <WeeklyBriefCard />
        <Surface className="p-card">
          <h3 className="font-serif text-xl">This project&rsquo;s identity</h3>
          <p className="mt-1 text-[13px] text-ink2">
            Switch identities — the whole surface re-tunes while the substrate, spacing and type stay
            constant.
          </p>
          <div className="mt-5">
            <ThemeSwitcher />
          </div>
        </Surface>
      </section>
    </main>
  );
}
