import { redirect } from "next/navigation";

export default function LegacyModeSelectRedirectPage() {
  redirect("/select-company");
}
