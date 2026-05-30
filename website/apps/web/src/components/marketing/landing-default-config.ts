import type { LandingPageConfig } from "./landing-config-types";

/* ================================================================== */
/*  Default landing page config — used as fallback before CMS data     */
/*  Also used by CMS "Reset" button                                    */
/* ================================================================== */

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  /* ─── SEO ─── */
  seo: {
    title: "NeredeServis — Kurumsal Servis Yönetim Platformu",
    description:
      "Tüm servis araçlarınızı tek panelden yönetin. Canlı takip, rota optimizasyonu, şoför yönetimi ve operasyonel raporlar. Personel, öğrenci, hasta — her sektöre uygun.",
    ogImageUrl: "",
  },

  /* ─── NAVBAR ─── */
  navbar: {
    logoUrl: "",
    ctaText: "Ücretsiz Başla",
    ctaLink: "/giris",
    links: [
      { label: "Özellikler", href: "#features" },
      { label: "Nasıl Çalışır", href: "#how-it-works" },
      { label: "Fiyatlandırma", href: "#pricing" },
      { label: "İletişim", href: "/iletisim" },
    ],
  },

  /* ─── HERO ─── */
  hero: {
    badgeText: "Şimdi canlı — tüm modüller aktif",
    badgeVisible: true,
    headlineLine1: "Servis operasyonunuzu",
    headlineLine2: "tek panelden yönetin.",
    subtitle:
      "Servis araçlarınızı canlı harita üzerinde takip edin, rotaları yönetin, şoförleri atayın. Personel, öğrenci, hasta — her sektörde çalışan kurumsal platform.",
    primaryCta: { text: "Ücretsiz demo başlat", link: "/giris" },
    secondaryCta: { text: "Bize ulaşın", link: "/iletisim" },
    heroImageUrl: "",
  },

  /* ─── STATS ─── */
  stats: [
    { value: "99.9%", label: "Uptime SLA" },
    { value: "<200ms", label: "Konum Gecikmesi" },
    { value: "7/24", label: "Destek" },
    { value: "KVKK", label: "Uyumlu" },
  ],

  /* ─── PRODUCT PREVIEW ─── */
  productPreview: {
    visible: true,
    screenshotUrl: "",
    caption: "",
  },

  /* ─── FEATURES ─── */
  features: {
    sectionTitle: "Operasyonun her adımı kontrol altında",
    sectionSubtitle:
      "Araç takibinden belge yönetimine, raporlamadan ekip yetkilendirmesine kadar ihtiyacınız olan her şey tek platformda.",
    items: [
      {
        icon: "MapPin",
        title: "Canlı Takip",
        description:
          "Tüm araçlarınızı harita üzerinde gerçek zamanlı izleyin. Konum, hız ve güzergah bilgileri anlık güncellenir.",
        color: "teal",
      },
      {
        icon: "Route",
        title: "Rota Yönetimi",
        description:
          "Güzergahlar oluşturun, durakları sıralayın, seferlere araç ve şoför atayın. Her rota için benzersiz takip kodu.",
        color: "sky",
      },
      {
        icon: "Car",
        title: "Araç Filosu",
        description:
          "Marka, model, plaka ve kapasite bilgileriyle filoyu yönetin. 3 durumlu kontrol: aktif, bakımda, pasif.",
        color: "amber",
      },
      {
        icon: "Users",
        title: "Ekip & Rol Yönetimi",
        description:
          "Sahip, yönetici, operatör ve izleyici rolleriyle yetkilendirme. E-posta ile toplu davet.",
        color: "violet",
      },
      {
        icon: "Shield",
        title: "Şoför Belgeleri",
        description:
          "Ehliyet, SRC ve sağlık raporlarını dijital ortamda takip edin. Süre dolduğunda otomatik uyarı.",
        color: "rose",
      },
      {
        icon: "FileSpreadsheet",
        title: "Raporlar & Dışa Aktarma",
        description:
          "Verilerinizi CSV olarak dışa aktarın veya şablonla toplu içe aktarın. Operasyonel veriler her zaman elinizde.",
        color: "emerald",
      },
    ],
  },

  /* ─── HOW IT WORKS ─── */
  howItWorks: {
    sectionTitle: "3 adımda operasyona başlayın",
    steps: [
      {
        icon: "Zap",
        title: "Şirketinizi oluşturun",
        description:
          "30 saniyede hesabınızı açın, şirketinizi ekleyin ve logonuzu yükleyin.",
      },
      {
        icon: "Bus",
        title: "Filoyu kurun",
        description:
          "Araçları, rotaları ve durakları tanımlayın. CSV ile toplu veri aktarın.",
      },
      {
        icon: "Globe",
        title: "Operasyona başlayın",
        description:
          "Şoförleri atayın, canlı takibi açın, yolcularınıza takip linki gönderin.",
      },
    ],
  },

  /* ─── PRICING ─── */
  pricing: {
    sectionTitle: "İhtiyacınıza göre esnek planlar",
    sectionSubtitle:
      "Küçük filolardan kurumsal operasyonlara kadar ölçeklenebilir fiyat yapısı. İlk 14 gün ücretsiz, kredi kartı gerekmez.",
    plans: [
      {
        name: "Başlangıç",
        price: "Ücretsiz",
        priceSuffix: "",
        description: "Küçük filolar için.",
        features: ["5 araç", "2 rota", "Canlı takip", "CSV dışa aktarma"],
        highlighted: false,
        ctaText: "Ücretsiz Dene",
        ctaLink: "/giris",
      },
      {
        name: "Profesyonel",
        price: "₺1.490",
        priceSuffix: "/ay",
        description: "Büyüyen operasyonlar.",
        features: [
          "25 araç",
          "Sınırsız rota",
          "Şoför belge takibi",
          "Toplu içe aktarma",
          "Öncelikli destek",
        ],
        highlighted: true,
        ctaText: "Hemen Başla",
        ctaLink: "/giris",
      },
      {
        name: "Kurumsal",
        price: "Özel",
        priceSuffix: "",
        description: "Büyük filolar için.",
        features: [
          "Sınırsız araç",
          "API erişimi",
          "SSO entegrasyonu",
          "Özel SLA",
          "Dedike hesap yöneticisi",
        ],
        highlighted: false,
        ctaText: "İletişime Geç",
        ctaLink: "/iletisim",
      },
    ],
  },

  /* ─── BOTTOM CTA ─── */
  bottomCta: {
    headlineLine1: "Operasyonunuzu dijitalleştirmeye",
    headlineLine2: "bugün başlayın.",
    subtitle:
      "Hesabınızı oluşturun, 5 dakikada ilk rotanızı ekleyin. İlk 14 gün tamamen ücretsiz.",
    primaryCta: { text: "Ücretsiz hesap oluştur", link: "/giris" },
    secondaryCta: { text: "Demo talep et", link: "/iletisim" },
  },

  /* ─── FOOTER ─── */
  footer: {
    brandDescription:
      "Türkiye'nin modern kurumsal servis yönetim platformu. Canlı takip, rota ve filo yönetimi.",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Özellikler", href: "#features" },
          { label: "Fiyatlandırma", href: "#pricing" },
          { label: "Nasıl Çalışır", href: "#how-it-works" },
        ],
      },
      {
        title: "Şirket",
        links: [
          { label: "İletişim", href: "/iletisim" },
          { label: "Gizlilik Politikası", href: "/gizlilik" },
          { label: "KVKK", href: "/kvkk" },
        ],
      },
      {
        title: "Hesap",
        links: [
          { label: "Giriş Yap", href: "/giris" },
          { label: "Kayıt Ol", href: "/register" },
        ],
      },
    ],
    copyrightText: "© 2026 NeredeServis. Tüm hakları saklıdır.",
  },

  /* ─── TRUSTED BY ─── */
  trustedBy: {
    visible: false,
    title: "Güvenilen kurumlarca tercih ediliyor",
    logos: [],
  },

  /* ─── TESTIMONIALS ─── */
  testimonials: {
    visible: false,
    title: "Müşterilerimiz ne diyor?",
    items: [],
  },
};
