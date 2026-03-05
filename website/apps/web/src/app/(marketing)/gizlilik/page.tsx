import type { Metadata } from "next";

import { MarketingContentPage } from "@/components/marketing/marketing-content-page";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "Gizlilik | NeredeServis",
  description:
    "NeredeServis gizlilik özetinde veri kapsamı, işleme amaçları, aktarım prensipleri ve güvenlik kontrolleri kurumsal düzeyde açıklanır.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/gizlilik"),
  },
  openGraph: {
    title: "Gizlilik | NeredeServis",
    description:
      "Veri işleme, güvenlik katmanları ve saklama yaklaşımı için NeredeServis gizlilik özeti.",
    url: toAbsoluteUrl(marketingBaseUrl, "/gizlilik"),
    type: "website",
    images: [
      {
        url: openGraphImageUrl,
        width: 1200,
        height: 630,
        alt: "NeredeServis gizlilik ve uyum özeti",
      },
    ],
  },
};

export default function GizlilikPage() {
  return (
    <MarketingContentPage
      badge="Gizlilik"
      title="Gizlilik Politikası Özeti"
      description="NeredeServis, kurumsal servis operasyonlarında işlenen verileri veri minimizasyonu, amaca bağlı işleme, erişim sınırlandırma ve denetlenebilirlik prensipleriyle yönetir."
      metaItems={[
        { label: "Belge Türü", value: "Kurumsal Gizlilik Özeti" },
        { label: "Son Güncelleme", value: "Mart 2026" },
        { label: "İletişim", value: "destek@neredeservis.app" },
        { label: "Barındırma", value: "Türkiye / Bölgesel Altyapı" },
      ]}
      sections={[
        {
          heading: "İşlenen Veri Kategorileri",
          body: "Platform üzerinde yalnızca hizmetin kurulumu, işletimi ve güvenliği için gerekli veri kategorileri işlenir.",
          items: [
            "Hesap verileri: ad-soyad, kurumsal e-posta, rol ve yetki bilgileri",
            "Operasyon verileri: rota, durak, sefer, araç ve şoför ilişkileri",
            "Canlı operasyon verileri: konum akışı, durum semantiği, zaman damgaları",
            "Güvenlik logları: erişim, hata ve kritik işlem denetim kayıtları",
          ],
        },
        {
          heading: "İşleme Amaçları ve Hukuki Dayanak",
          body: "Veriler; sözleşmenin ifası, operasyonel süreklilik, güvenlik ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir.",
          items: [
            "Hizmet sunumu, canlı takip ve operasyon planlama fonksiyonlarının yürütülmesi",
            "Kimlik doğrulama, erişim yetkilendirme ve hesap güvenliğinin sağlanması",
            "Yasal yükümlülükler ve denetim ihtiyaçları için kayıtların tutulması",
            "Açık rıza gerektiren süreçlerde ilgili kişiden ayrıca onay alınması",
          ],
        },
        {
          heading: "Veri Paylaşımı ve Aktarım",
          body: "Veriler, yalnızca hizmetin teknik işletimi veya hukuki yükümlülüklerin yerine getirilmesi için gerekli kapsamda paylaşılır.",
          items: [
            "Altyapı ve barındırma sağlayıcılarına sözleşmeye bağlı sınırlı erişim",
            "Yetkili kurum talepleri doğrultusunda mevzuata uygun paylaşım",
            "Tedarikçilerle gizlilik ve veri işleme taahhütleri (DPA) üzerinden çalışma modeli",
          ],
        },
        {
          heading: "Saklama Süresi ve İmha",
          body: "Saklama süreleri veri kategorisine, işleme amacına ve yasal zorunluluklara göre belirlenir; süresi dolan veriler silinir veya anonimleştirilir.",
          items: [
            "Kategori bazlı retention planı ile saklama sürelerinin yönetimi",
            "Silme taleplerinin kayıt altına alınması ve izlenebilir şekilde sonuçlandırılması",
            "İşleme amacı sona eren veriler için kontrollü imha süreçlerinin yürütülmesi",
          ],
        },
        {
          heading: "Güvenlik ve Erişim Kontrolleri",
          body: "Platform güvenliği, çok katmanlı erişim kontrolü, tenant izolasyonu ve olay izleme yaklaşımıyla sürdürülür.",
          items: [
            "Tenant izolasyonu ve rol tabanlı yetki modeli",
            "Kritik işlemler için denetim izi (audit trail)",
            "Yetkisiz erişimi önlemeye yönelik teknik ve idari kontroller",
            "Güvenlik olaylarında sınıflandırma, müdahale ve raporlama adımları",
          ],
        },
        {
          heading: "Haklar ve Başvuru",
          body: "İlgili kişiler, yürürlükteki mevzuat kapsamında tanımlı haklarını kullanmak üzere başvuru yapabilir.",
          items: [
            "Bilgi talebi, düzeltme, silme ve itiraz başvuruları",
            "Kimlik doğrulama sonrası değerlendirme, kayıt ve geri dönüş",
            "Başvuru kanalı: destek@neredeservis.app",
          ],
        },
      ]}
      faqItems={[
        {
          question: "Canlı konum verisi hangi kapsamda işlenir?",
          answer:
            "Konum verisi yalnızca operasyonel takip, rota yönetimi ve hizmet sürekliliği için gerekli olduğu ölçüde işlenir.",
        },
        {
          question: "Müşteri verileri üçüncü taraflarla paylaşılır mı?",
          answer:
            "Paylaşım yalnızca sözleşmesel tedarikçiler ve yasal zorunluluklar kapsamında, gerekli minimum veri prensibiyle yapılır.",
        },
        {
          question: "Silme talepleri nasıl yönetilir?",
          answer:
            "Talep kimlik doğrulama sonrası kayıt altına alınır, mevzuat ve ürün süreçlerine uygun şekilde tamamlanır.",
        },
      ]}
      quickLinks={[
        { label: "KVKK Aydınlatma Özeti", href: "/kvkk" },
        { label: "İletişim", href: "/iletisim" },
        { label: "Panel Girişi", href: "/giris" },
      ]}
      noteTitle="Yürürlük ve Kapsam"
      note="Bu içerik ürün seviyesinde kurumsal bilgilendirme özetidir. Nihai hukuki metinler ve sözleşmesel dokümanlar yayımlandığında sayfa resmi referanslarla güncellenir."
    />
  );
}
