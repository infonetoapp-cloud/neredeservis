import type { Metadata } from "next";

import { LoginPageShell } from "@/components/auth/login-page-shell";
import { getPanelBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const panelBaseUrl = getPanelBaseUrl();

export const metadata: Metadata = {
  title: "Kurumsal Giriş | NeredeServis",
  description:
    "NeredeServis kurumsal web paneline giriş: şirket operasyon ekipleri ve platform yöneticileri için güvenli erişim ekranı.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: toAbsoluteUrl(panelBaseUrl, "/giris"),
  },
};

export default function GirisPage() {
  return (
    <LoginPageShell
      title="NeredeServis kurumsal giriş"
      description="Operasyon ekibinizin paneline güvenli şekilde erişin."
    />
  );
}
