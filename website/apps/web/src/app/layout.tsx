import type { Metadata } from "next";
import { AppProviders } from "@/components/app/app-providers";
import { getMarketingBaseUrl } from "@/lib/seo/site-urls";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getMarketingBaseUrl()),
  title: {
    default: "NeredeServis — Kurumsal Servis Yönetim Platformu",
    template: "%s | NeredeServis",
  },
  description:
    "Tüm servis araçlarınızı tek panelden yönetin. Canlı takip, rota optimizasyonu, şoför yönetimi ve operasyonel raporlar. Personel, öğrenci, hasta — her sektöre uygun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
