"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@shared/ui/Button";
import { Surface } from "@shared/ui/Surface";
import { rise } from "@shared/motion/variants";

/**
 * Sign-in. Posts an email to /api/v1/auth which issues an httpOnly session
 * cookie, then routes to the workspace. (Dev sign-in; magic-link/OAuth later.)
 */
export function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function signIn() {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Sign-in failed");
      router.push("/projects");
      router.refresh();
    } catch {
      setError("Couldn't sign in. Check your email and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <motion.div variants={rise} initial="hidden" animate="show" className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="font-serif text-4xl font-light tracking-tight">
            Founder<span className="text-accent2">OS</span>
          </div>
          <p className="mt-2 text-[14px] text-ink2">Your virtual AI software company.</p>
        </div>
        <Surface className="p-6">
          <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
            Email
          </label>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void signIn()}
            placeholder="you@company.com"
            className="mt-2 w-full rounded-md border border-white/15 bg-base px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 focus:border-accent2"
          />
          {error && <p className="mt-3 text-[12px] text-pink-400">{error}</p>}
          <Button
            onClick={() => void signIn()}
            disabled={!valid || loading}
            className={`mt-4 w-full py-3 text-sm ${!valid || loading ? "opacity-50" : ""}`}
          >
            {loading ? "Signing in…" : "Continue"}
          </Button>
          <p className="mt-4 text-center font-mono text-[10px] text-ink4">
            Dev sign-in · no password · your email maps to your workspace
          </p>
        </Surface>
      </motion.div>
    </main>
  );
}
