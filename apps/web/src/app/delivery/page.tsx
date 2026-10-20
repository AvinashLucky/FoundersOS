import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { DeliveryStudio } from "@features/delivery";

/** /delivery — client requirement → sellable Solution Blueprint. Server-guarded. */
export default function DeliveryPage() {
  if (!getSession()) redirect("/signin");
  return <DeliveryStudio />;
}
