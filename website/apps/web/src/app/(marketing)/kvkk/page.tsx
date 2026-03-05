import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/marketing/marketing-content-page";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "KVKK | NeredeServis",
  description:
    "NeredeServis KVKK aydınlatma özetinde veri sorumlusu kapsamı, işlenen veri kategorileri ve başvuru adımları açıklanır.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/kvkk"),
  },
  openGraph: {
    title: "KVKK | NeredeServis",
    description:
      "KVKK kapsamında veri sorumlusu kapsamı, işlenen veri kategorileri ve başvuru adımları için NeredeServis özeti.",
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
      title="KVKK Aydınlatma Özeti"
      description="6698 sayılı KVKK kapsamında, veri işleme süreçlerine ilişkin ürün seviyesinde temel bilgilendirme özetini bu sayfada sunuyoruz."
      sections={[
        {
          heading: "Veri Sorumlusu ve Amaç",
          body: "Platformda işlenen veriler; kimliklendirme, operasyon yönetimi, canlı izleme ve güvenlik süreçleri kapsamında kullanılır.",
          items: [
            "Hizmetin sunulması ve sürekliliğinin sağlanması",
            "Yetki ve erişim kontrollerinin uygulanması",
            "Operasyonel kayıt ve denetim izi oluşturulması",
          ],
        },
        {
          heading: "İşlenen Veri Kategorileri",
          body: "Kimlik/iletişim, operasyon, rota/durak ve canlı konum verileri; ürün fonksiyonlarıyla sınırlı olarak işlenir.",
          items: [
            "Kimlik ve iletişim bilgileri",
            "Rota, durak, sefer ve araç ilişkili operasyon kayıtları",
            "Canlı konum ve bağlantı durumu semantik verileri",
          ],
        },
        {
          heading: "Haklar ve Başvuru",
          body: "KVKK kapsamındaki haklar için başvuru kanalları ve cevap süreçleri tanımlıdır; talepler kayda alınarak değerlendirilir.",
          items: [
            "Başvuru kanalı: support@neredeservis.app",
            "Kimlik doğrulama sonrası talep işleme",
            "Yanıt ve kayıt süreçlerinde izlenebilirlik",
          ],
        },
      ]}
      quickLinks={[
        { label: "Gizlilik Özeti", href: "/gizlilik" },
        { label: "İletişim", href: "/iletisim" },
        { label: "Ana Sayfa", href: "/" },
      ]}
      note="Bu içerik KVKK özet bilgilendirmesidir. Nihai hukuki metin yayını sonrasında resmi metne yönlendirme bu sayfaya eklenir."
    />
  );
}
