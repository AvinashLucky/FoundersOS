import { redirect } from "next/navigation";

/**
 * Home → the workspace. /projects guards the session and redirects to /signin
 * when needed. (The Command Surface returns as the per-project run view later.)
 */
export default function Home() {
  redirect("/projects");
}
