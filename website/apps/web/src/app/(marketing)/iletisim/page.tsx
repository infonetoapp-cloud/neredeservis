import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/marketing/marketing-content-page";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "Iletisim | NeredeServis",
  description:
    "NeredeServis ile pilot onboarding, kurumsal demo ve operasyonel destek sureci icin iletisim kanallari.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/iletisim"),
  },
  openGraph: {
    title: "Iletisim | NeredeServis",
    description:
      "Pilot onboarding, kurumsal demo ve operasyonel destek sureci icin NeredeServis ile iletisime gecin.",
    url: toAbsoluteUrl(marketingBaseUrl, "/iletisim"),
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
};

export default function IletisimPage() {
  return (
    <MarketingContentPage
      badge="Iletisim"
      title="Iletisim ve Demo Talebi"
      description="Kurumsal demo, pilot onboarding, operasyon sorulari ve teknik uyum gorusmeleri icin iletisim noktalarimizi bu sayfada bulabilirsiniz."
      sections={[
        {
          heading: "Demo ve Pilot Talebi",
          body: "Pilot odakli calisma modelinde ilk gorusme 30 dakikalik urun akisi + operasyon senaryosu seklinde planlanir.",
          items: [
            "Canli panel akisi: routes / vehicles / drivers / live-ops",
            "Tenant rol modeli: owner, admin, dispatcher, viewer",
            "Onboarding hedefi: ilk 48 saatte operasyona gecis",
          ],
        },
        {
          heading: "Destek ve Operasyon Kanali",
          body: "Pilot surecinde olay yonetimi runbook tabanli ilerler. Kritik durumlar once operasyon etkisine gore siniflanir, sonra aksiyon plani paylasilir.",
          items: [
            "Destek e-postasi: support@neredeservis.app",
            "Pilot owner kanali: onboarding toplantisinda paylasilir",
            "Incident seviyesi: kritik / yuksek / normal",
          ],
        },
        {
          heading: "Teknik Uyum Basliklari",
          body: "Mevcut sisteminizle uyum acisindan onboarding oncesi bu basliklar netlestirilir.",
          items: [
            "Firebase auth domain ve rol modeli",
            "Mapbox token ve canli harita beklentisi",
            "Route/share link operasyon akisi",
          ],
        },
      ]}
      quickLinks={[
        { label: "Panele Giris", href: "/giris" },
        { label: "Ana Sayfa", href: "/" },
        { label: "Gizlilik", href: "/gizlilik" },
      ]}
      note="Iletisim talepleri onceliklendirme ile ele alinir. Kritik operasyon taleplerinde ilk donus hedefi ayni is gunudur."
    />
  );
}
