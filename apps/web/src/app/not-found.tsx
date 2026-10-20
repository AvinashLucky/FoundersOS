import Link from "next/link";

/** 404 — keeps the founder oriented and one click from home. */
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent2">404</div>
        <h1 className="mt-3 font-serif text-3xl font-light tracking-tight">This page isn&rsquo;t in the company.</h1>
        <p className="mt-2 text-[14px] text-ink2">The link may be old or the project moved.</p>
        <Link
          href="/projects"
          className="mt-5 inline-block rounded-md border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm text-ink hover:bg-white/[0.07]"
        >
          Back to projects
        </Link>
      </div>
    </main>
  );
}
