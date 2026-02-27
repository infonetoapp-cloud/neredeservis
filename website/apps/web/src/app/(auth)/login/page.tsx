import type { Metadata } from "next";

import { LoginPageShell } from "@/components/auth/login-page-shell";
import { getPanelBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const panelBaseUrl = getPanelBaseUrl();

export const metadata: Metadata = {
  title: "Login | NeredeServis",
  description:
    "Firma operasyonu ve bireysel sofor paneline giris: e-posta/sifre, Google ve Microsoft ile oturum acin.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: toAbsoluteUrl(panelBaseUrl, "/login"),
  },
};

export default function LoginPage() {
  return <LoginPageShell />;
}
