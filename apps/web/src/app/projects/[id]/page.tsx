import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { ProjectWorkspaceScreen } from "@features/project-workspace";

/** /projects/:id — a single project's workspace. Server-guarded. */
export default function ProjectPage({ params }: { params: { id: string } }) {
  if (!getSession()) redirect("/signin");
  return <ProjectWorkspaceScreen projectId={params.id} />;
}
