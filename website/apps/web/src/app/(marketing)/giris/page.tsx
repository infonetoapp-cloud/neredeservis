import type { Metadata } from "next";

import { LoginPageShell } from "@/components/auth/login-page-shell";
import { getPanelBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const panelBaseUrl = getPanelBaseUrl();

export const metadata: Metadata = {
  title: "Giriş | NeredeServis",
  description:
    "NeredeServis web paneline giriş: kurumsal operasyon ve bireysel şoför akışlarını aynı oturum katmanından başlatın.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: toAbsoluteUrl(panelBaseUrl, "/giris"),
  },
};

export default function GirisPage() {
  return (
    <LoginPageShell
      title="NeredeServis web paneline giriş"
      description="Kurumsal operasyon ve bireysel şoför akışlarını tek giriş katmanından başlatın."
    />
  );
}
