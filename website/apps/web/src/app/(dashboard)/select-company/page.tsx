import { redirect } from "next/navigation";

export default function LegacySelectCompanyRedirectPage() {
  redirect("/dashboard");
}
