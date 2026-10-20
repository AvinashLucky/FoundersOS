import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { BoardroomScreen } from "@features/boardroom";

/** /boardroom — Mission Control, live inside the product. Server-guarded. */
export default function BoardroomPage() {
  if (!getSession()) redirect("/signin");
  return <BoardroomScreen />;
}
