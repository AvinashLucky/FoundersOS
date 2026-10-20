import type { Metadata } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@shared/providers/AppProviders";
import "./globals.css";

// Three voices of Strata: system (sans), company (serif), machine (mono).
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap", style: ["normal", "italic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "FounderOS — your virtual AI software company",
  description: "An elite software company, calm on one surface. Built on the Strata design language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="founder" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="strata-field min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
