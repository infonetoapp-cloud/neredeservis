import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/marketing/marketing-content-page";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "Gizlilik | NeredeServis",
  description:
    "NeredeServis gizlilik politikasi ozetinde veri isleme kapsami, erisim modeli ve saklama/silme yaklasimi yer alir.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/gizlilik"),
  },
  openGraph: {
    title: "Gizlilik | NeredeServis",
    description:
      "Veri isleme kapsami, erisim modeli ve saklama/silme yaklasimi icin NeredeServis gizlilik ozeti.",
    url: toAbsoluteUrl(marketingBaseUrl, "/gizlilik"),
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

export default function GizlilikPage() {
  return (
    <MarketingContentPage
      badge="Gizlilik"
      title="Gizlilik Politikasi Ozeti"
      description="NeredeServis, platformda islenen verileri operasyonel hizmet sunumu, guvenlik ve yasal yukumluluklar kapsaminda isler. Asagida urun seviyesi ozet bulunur."
      sections={[
        {
          heading: "Veri Isleme Kapsami",
          body: "Hesap, operasyon ve konum verileri; canli takip, rota yonetimi ve hizmet devamliiligi icin gerekli oldugu olcude islenir.",
          items: [
            "Hesap verileri: ad, e-posta, rol/membership",
            "Operasyon verileri: rota, durak, sefer ve audit kayitlari",
            "Canli veri: RTDB tabanli anlik konum akis semantikleri",
          ],
        },
        {
          heading: "Yetki ve Erisim",
          body: "Tenant izolasyonu, rol tabanli yetki modeli ve server-side policy dogrulamasi urunun temel guvenlik katmanlaridir.",
          items: [
            "Cross-tenant veri erisimi policy ile engellenir",
            "Kritik mutasyonlar audit event ile izlenir",
            "Callable response kontratlari runtime guard ile korunur",
          ],
        },
        {
          heading: "Saklama ve Silme",
          body: "Veri saklama ve silme yaklasimi retention planlari ve uyum sureci ile yonetilir. Isleme amaci sona eren veriler icin temizleme adimlari uygulanir.",
          items: [
            "Saklama sureleri urun/pilot politikalarina gore belirlenir",
            "Silme talepleri kayit altinda islenir",
            "Kritik degisikliklerde karar kaydi tutulur",
          ],
        },
      ]}
      quickLinks={[
        { label: "KVKK Ozeti", href: "/kvkk" },
        { label: "Iletisim", href: "/iletisim" },
        { label: "Panele Giris", href: "/giris" },
      ]}
      note="Bu sayfa urun seviyesinde bilgilendirme ozetidir; hukuki baglayici nihai metinler yayinlandiginda burada baglanti olarak sunulur."
    />
  );
}
