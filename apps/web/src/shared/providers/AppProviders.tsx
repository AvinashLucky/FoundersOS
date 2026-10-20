"use client";

import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@shared/store/store";
import { ThemeProvider } from "@shared/providers/ThemeProvider";
import { ToastProvider } from "@shared/ui/Toaster";
import { CommandPalette } from "@features/command-palette/CommandPalette";

/**
 * All client-side providers in one place, nested in a sensible order:
 *   Redux (global UI state) → React Query (server data) → Theme (Strata) →
 *   Toasts (feedback). The ⌘K palette mounts once here so it works everywhere.
 * The root layout (a Server Component) renders this once around the app.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session. useState keeps it stable across renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initial="founder">
          <ToastProvider>
            {children}
            <CommandPalette />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
