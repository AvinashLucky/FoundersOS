"use client";

import { useEffect } from "react";

/** Global error boundary — catches render/runtime errors and offers recovery. */
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // In production this would report to the observability sink.
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent2">Something broke</div>
        <h1 className="mt-3 font-serif text-3xl font-light tracking-tight">A part of the company stumbled.</h1>
        <p className="mt-2 text-[14px] text-ink2">
          The error was logged. You can retry — your work is safe.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-md bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
