import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/app/app-providers";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");
const twitterImageUrl = toAbsoluteUrl(marketingBaseUrl, "/twitter-image");

export const metadata: Metadata = {
  metadataBase: new URL(marketingBaseUrl),
  title: "NeredeServis | Servis Operasyon Platformu",
  description:
    "Servis sirketleri ve bireysel soforler icin rota, sefer ve canli operasyon yonetimi.",
  applicationName: "NeredeServis",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NeredeServis | Servis Operasyon Platformu",
    description:
      "Servis sirketleri ve bireysel soforler icin rota, sefer ve canli operasyon yonetimi.",
    url: marketingBaseUrl,
    siteName: "NeredeServis",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: openGraphImageUrl,
        width: 1200,
        height: 630,
        alt: "NeredeServis web operasyon paneli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeredeServis | Servis Operasyon Platformu",
    description:
      "Servis sirketleri ve bireysel soforler icin rota, sefer ve canli operasyon yonetimi.",
    images: [twitterImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
