import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { OverviewScreen } from "@features/overview/OverviewScreen";

/** /overview — workspace analytics & spend. Server-guarded. */
export default function OverviewPage() {
  if (!getSession()) redirect("/signin");
  return <OverviewScreen />;
}
