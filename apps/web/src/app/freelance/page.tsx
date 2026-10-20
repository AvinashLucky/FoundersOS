import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { FreelanceScreen } from "@features/freelance";

/** /freelance — the Freelance Studio. Server-guarded: must be signed in. */
export default function FreelancePage() {
  if (!getSession()) redirect("/signin");
  return <FreelanceScreen />;
}
