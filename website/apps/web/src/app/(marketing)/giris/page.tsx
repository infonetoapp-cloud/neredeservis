import type { Metadata } from "next";

import { LoginPageShell } from "@/components/auth/login-page-shell";
import { getPanelBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const panelBaseUrl = getPanelBaseUrl();

export const metadata: Metadata = {
  title: "Kurumsal Giris | NeredeServis",
  description:
    "NeredeServis kurumsal web paneline giris: sirket operasyon ekipleri ve platform owner ayni guvenli giris katmanindan ilerler.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: toAbsoluteUrl(panelBaseUrl, "/giris"),
  },
};

export default function GirisPage() {
  return (
    <LoginPageShell
      title="NeredeServis kurumsal web paneli girisi"
      description="Sadece kurumsal operasyon ekipleri ve platform owner hesabi icin tasarlanmis guvenli giris sayfasi."
    />
  );
}
