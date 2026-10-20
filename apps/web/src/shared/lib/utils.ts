import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (later wins on conflict). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a USD cost compactly for the cost meter. */
export function formatCost(usd: number): string {
  return usd < 1 ? `$${usd.toFixed(2)}` : `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
