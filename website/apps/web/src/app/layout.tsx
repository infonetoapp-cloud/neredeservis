import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/app/app-providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
      <body
        className={`${plusJakarta.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
