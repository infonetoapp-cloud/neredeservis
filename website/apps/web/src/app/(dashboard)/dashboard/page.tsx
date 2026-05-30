import { redirect } from "next/navigation";

export default function LegacyDashboardRedirectPage() {
  redirect("/c/internal/dashboard");
}
