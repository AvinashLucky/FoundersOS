import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { DemoMode } from "@features/demo";

/** /demo — the self-driving keynote. Server-guarded like every surface. */
export default function DemoPage() {
  if (!getSession()) redirect("/signin");
  return <DemoMode />;
}
