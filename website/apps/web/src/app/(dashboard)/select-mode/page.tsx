import { redirect } from "next/navigation";

export default function LegacySelectModeRedirectPage() {
  redirect("/dashboard");
}
