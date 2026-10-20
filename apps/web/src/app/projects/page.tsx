import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { ProjectsScreen } from "@features/projects";

/** /projects — the workspace home. Server-guarded: must be signed in. */
export default function ProjectsPage() {
  if (!getSession()) redirect("/signin");
  return <ProjectsScreen />;
}
