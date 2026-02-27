import type { Metadata } from "next";

import { LoginPageShell } from "@/components/auth/login-page-shell";
import { getPanelBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const panelBaseUrl = getPanelBaseUrl();

export const metadata: Metadata = {
  title: "Giris | NeredeServis",
  description:
    "NeredeServis web paneline giris: kurumsal operasyon ve bireysel sofor akislarini ayni oturum katmanindan baslatin.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: toAbsoluteUrl(panelBaseUrl, "/login"),
  },
};

export default function GirisPage() {
  return (
    <LoginPageShell
      title="NeredeServis web paneline giris"
      description="Kurumsal operasyon ve bireysel sofor akislarini tek giris katmanindan baslatin."
    />
  );
}
