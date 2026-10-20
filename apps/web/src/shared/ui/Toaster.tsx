"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@shared/lib/utils";

/**
 * Toaster — quiet, ephemeral feedback (Strata: calm, never modal).
 * `useToast()` anywhere in the app → a small confirmation slides up from the
 * bottom and dissolves. At most 3 stack; each lives ~3.6s.
 */
type Tone = "default" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastApi {
  /** Show a toast. `tone` colors it: success (accent ✓) or error (pink). */
  toast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: Tone = "default") => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3600);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* The stack renders above everything; pointer-events only on the pills. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        role="status"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={cn(
                "pointer-events-auto flex items-center gap-2.5 rounded-md border px-4 py-2.5 font-mono text-[12px] shadow-2xl backdrop-blur-xl",
                t.tone === "error"
                  ? "border-pink-400/30 bg-pink-500/10 text-pink-200"
                  : "border-white/[0.13] bg-white/[0.06] text-ink",
              )}
            >
              {t.tone === "success" && <span className="text-accent2">✓</span>}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
