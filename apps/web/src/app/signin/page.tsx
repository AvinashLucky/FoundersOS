import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { SignInScreen } from "@features/auth/SignInScreen";

/** /signin — if already signed in, go straight to the workspace. */
export default function SignInPage() {
  if (getSession()) redirect("/projects");
  return <SignInScreen />;
}
