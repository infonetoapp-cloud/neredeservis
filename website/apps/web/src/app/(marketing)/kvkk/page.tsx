import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/marketing/marketing-content-page";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "KVKK | NeredeServis",
  description:
    "NeredeServis KVKK aydınlatma özetinde veri sorumlusu kapsamı, işlenen veri kategorileri, hukuki dayanaklar ve başvuru yöntemi açıklanır.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/kvkk"),
  },
  openGraph: {
    title: "KVKK | NeredeServis",
    description:
      "KVKK kapsamında veri sorumlusu çerçevesi, işleme amaçları ve haklar için NeredeServis özeti.",
    url: toAbsoluteUrl(marketingBaseUrl, "/kvkk"),
    type: "website",
    images: [
      {
        url: openGraphImageUrl,
        width: 1200,
        height: 630,
        alt: "NeredeServis KVKK aydınlatma özeti",
      },
    ],
  },
};

export default function KvkkPage() {
  return (
    <MarketingContentPage
      badge="KVKK"
      title="KVKK Aydınlatma Özeti"
      description="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, platform hizmetleri sırasında yürütülen veri işleme faaliyetlerine ilişkin temel aydınlatma çerçevemizi sunarız."
      metaItems={[
        { label: "Belge Türü", value: "KVKK Aydınlatma Özeti" },
        { label: "Son Güncelleme", value: "Mart 2026" },
        { label: "Başvuru", value: "destek@neredeservis.app" },
        { label: "Yanıt Süreci", value: "Yasal süreler içinde" },
      ]}
      sections={[
        {
          heading: "Veri Sorumlusu",
          body: "NeredeServis, platform hizmetlerinin kurulması, işletilmesi ve destek süreçlerinde veri sorumlusu sıfatıyla hareket eder.",
          items: [
            "Kurumsal müşteri hesaplarının yönetimi ve yetkilendirme süreçleri",
            "Operasyonel veri akışlarının yönetimi ve hizmet sürekliliği",
            "Denetim, güvenlik ve mevzuata uyum süreçlerinin yürütülmesi",
          ],
        },
        {
          heading: "İşlenen Veri Kategorileri",
          body: "İşlenen veriler, hizmet kapsamı ve veri minimizasyonu ilkesi doğrultusunda kategori bazlı yönetilir.",
          items: [
            "Kimlik ve iletişim verileri (ad-soyad, kurumsal e-posta, görev bilgisi)",
            "Operasyon verileri (rota, durak, sefer, araç/şoför ilişkileri)",
            "Canlı izleme verileri (konum akışı, durum ve zaman damgası)",
            "Sistem ve güvenlik günlükleri (erişim, hata, işlem kayıtları)",
          ],
        },
        {
          heading: "İşleme Amaçları",
          body: "Kişisel veriler, sözleşmesel yükümlülüklerin yerine getirilmesi ve operasyonların güvenli biçimde yürütülmesi amacıyla işlenir.",
          items: [
            "Hizmetin sunulması, operasyon yönetimi ve kullanıcı deneyiminin sürdürülmesi",
            "Kimlik doğrulama, erişim yönetimi ve hesap güvenliği",
            "Destek, hata analizi, kalite iyileştirme ve olay müdahalesi",
            "Mevzuat kaynaklı bildirim, kayıt ve raporlama yükümlülükleri",
          ],
        },
        {
          heading: "Aktarım Yapılan Taraflar",
          body: "Kişisel veriler, yalnızca işleme amacıyla sınırlı olmak üzere hizmet sağlayıcılar ve yetkili kurumlarla paylaşılabilir.",
          items: [
            "Barındırma, altyapı ve teknik işletim hizmeti sağlayıcıları",
            "Sözleşmesel yükümlülük kapsamında destek alınan iş ortakları",
            "Hukuki zorunluluk halinde yetkili kamu kurum ve kuruluşları",
          ],
        },
        {
          heading: "Saklama Süresi ve İmha",
          body: "Veriler, ilgili mevzuat ve işleme amacı doğrultusunda saklanır; süre sonunda silinir, yok edilir veya anonim hale getirilir.",
          items: [
            "Kategori bazlı saklama planı ve gözden geçirme periyotları",
            "Talep bazlı silme/düzeltme süreçlerinin izlenebilir yönetimi",
            "İmha süreçlerinde teknik ve idari kontrol adımları",
          ],
        },
        {
          heading: "Haklar ve Başvuru",
          body: "İlgili kişiler, KVKK Madde 11 kapsamında tanımlı haklarını kullanmak üzere başvuru yapabilir.",
          items: [
            "Başvuru kanalı: destek@neredeservis.app",
            "Kimlik doğrulama sonrası başvurunun değerlendirilmesi",
            "Yasal süreler içinde yanıt ve süreç kayıtlarının tutulması",
          ],
        },
      ]}
      faqItems={[
        {
          question: "Başvurular hangi kanaldan alınır?",
          answer:
            "KVKK kapsamındaki başvurular destek@neredeservis.app üzerinden alınır ve kimlik doğrulama ile işleme alınır.",
        },
        {
          question: "Veri güncelleme veya silme talebi nasıl işlenir?",
          answer:
            "Talep kayda alınır, ilgili sistemlerde doğrulanır ve mevzuata uygun süreç adımlarıyla sonuçlandırılır.",
        },
        {
          question: "Veri aktarımı hangi koşullarda yapılır?",
          answer:
            "Aktarım, sadece hizmetin teknik işletimi veya yasal zorunluluklar için, gerekli minimum veri prensibiyle yapılır.",
        },
      ]}
      quickLinks={[
        { label: "Gizlilik Politikası Özeti", href: "/gizlilik" },
        { label: "İletişim", href: "/iletisim" },
        { label: "Ana Sayfa", href: "/" },
      ]}
      noteTitle="Hukuki Not"
      note="Bu içerik ürün seviyesinde KVKK aydınlatma özetidir ve hukuki danışmanlık yerine geçmez. Nihai metinler ile sözleşmesel dokümanlar yayımlandığında sayfa resmi referanslarla güncellenir."
    />
  );
}
