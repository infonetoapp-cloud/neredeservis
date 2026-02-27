import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/marketing/marketing-content-page";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "KVKK | NeredeServis",
  description:
    "NeredeServis KVKK aydinlatma ozetinde veri sorumlusu kapsami, islenen veri kategorileri ve basvuru adimlari aciklanir.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/kvkk"),
  },
  openGraph: {
    title: "KVKK | NeredeServis",
    description:
      "KVKK kapsaminda veri sorumlusu kapsami, islenen veri kategorileri ve basvuru adimlari icin NeredeServis ozeti.",
    url: toAbsoluteUrl(marketingBaseUrl, "/kvkk"),
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

export default function KvkkPage() {
  return (
    <MarketingContentPage
      badge="KVKK"
      title="KVKK Aydinlatma Ozeti"
      description="6698 sayili KVKK kapsaminda, veri isleme sureclerine iliskin urun seviyesinde temel bilgilendirme ozetini bu sayfada sunuyoruz."
      sections={[
        {
          heading: "Veri Sorumlusu ve Amac",
          body: "Platformda islenen veriler; kimliklendirme, operasyon yonetimi, canli izleme ve guvenlik surecleri kapsaminda kullanilir.",
          items: [
            "Hizmetin sunulmasi ve surekliliginin saglanmasi",
            "Yetki ve erisim kontrollerinin uygulanmasi",
            "Operasyonel kayit ve denetim izi olusturulmasi",
          ],
        },
        {
          heading: "Islenen Veri Kategorileri",
          body: "Kimlik/iletisim, operasyon, rota/durak ve canli konum verileri; urun fonksiyonlariyla sinirli olarak islenir.",
          items: [
            "Kimlik ve iletisim bilgileri",
            "Rota, durak, sefer ve arac iliskili operasyon kayitlari",
            "Canli konum ve baglanti durumu semantik verileri",
          ],
        },
        {
          heading: "Haklar ve Basvuru",
          body: "KVKK kapsamindaki haklar icin basvuru kanallari ve cevap surecleri tanimlidir; talepler kayda alinarak degerlendirilir.",
          items: [
            "Basvuru kanali: support@neredeservis.app",
            "Kimlik dogrulama sonrasi talep isleme",
            "Yanit ve kayit sureclerinde izlenebilirlik",
          ],
        },
      ]}
      quickLinks={[
        { label: "Gizlilik Ozeti", href: "/gizlilik" },
        { label: "Iletisim", href: "/iletisim" },
        { label: "Ana Sayfa", href: "/" },
      ]}
      note="Bu icerik KVKK ozet bilgilendirmesidir. Nihai hukuki metin yayini sonrasinda resmi metne yonlendirme bu sayfaya eklenir."
    />
  );
}
