import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/marketing/marketing-content-page";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "Gizlilik | NeredeServis",
  description:
    "NeredeServis gizlilik politikası özetinde veri işleme kapsamı, erişim modeli ve saklama/silme yaklaşımı yer alır.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/gizlilik"),
  },
  openGraph: {
    title: "Gizlilik | NeredeServis",
    description:
      "Veri işleme kapsamı, erişim modeli ve saklama/silme yaklaşımı için NeredeServis gizlilik özeti.",
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
      title="Gizlilik Politikası Özeti"
      description="NeredeServis, platformda işlenen verileri operasyonel hizmet sunumu, güvenlik ve yasal yükümlülükler kapsamında işler. Aşağıda ürün seviyesi özet bulunur."
      sections={[
        {
          heading: "Veri İşleme Kapsamı",
          body: "Hesap, operasyon ve konum verileri; canlı takip, rota yönetimi ve hizmet devamlılığı için gerekli olduğu ölçüde işlenir.",
          items: [
            "Hesap verileri: ad, e-posta, rol/membership",
            "Operasyon verileri: rota, durak, sefer ve audit kayıtları",
            "Canlı veri: RTDB tabanlı anlık konum akış semantikleri",
          ],
        },
        {
          heading: "Yetki ve Erişim",
          body: "Tenant izolasyonu, rol tabanlı yetki modeli ve server-side policy doğrulaması ürünün temel güvenlik katmanlarıdır.",
          items: [
            "Cross-tenant veri erişimi policy ile engellenir",
            "Kritik mutasyonlar audit event ile izlenir",
            "Callable response kontratları runtime guard ile korunur",
          ],
        },
        {
          heading: "Saklama ve Silme",
          body: "Veri saklama ve silme yaklaşımı retention planları ve uyum süreci ile yönetilir. İşleme amacı sona eren veriler için temizleme adımları uygulanır.",
          items: [
            "Saklama süreleri ürün/pilot politikalarına göre belirlenir",
            "Silme talepleri kayıt altında işlenir",
            "Kritik değişikliklerde karar kaydı tutulur",
          ],
        },
      ]}
      quickLinks={[
        { label: "KVKK Özeti", href: "/kvkk" },
        { label: "İletişim", href: "/iletisim" },
        { label: "Panele Giriş", href: "/giris" },
      ]}
      note="Bu sayfa ürün seviyesinde bilgilendirme özetidir; hukuki bağlayıcı nihai metinler yayınlandığında burada bağlantı olarak sunulur."
    />
  );
}
