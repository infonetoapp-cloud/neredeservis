/* ================================================================== */
/*  LandingPageConfig — Shared type for landing page CMS               */
/*  Used by: backend (Zod schema), frontend (sections), CMS (forms)    */
/* ================================================================== */

/** SEO & meta bilgileri */
export interface LandingSeoConfig {
  title: string;
  description: string;
  ogImageUrl: string;
}

/** Navbar linkleri */
export interface NavLink {
  label: string;
  href: string;
}

export interface LandingNavbarConfig {
  logoUrl: string;
  ctaText: string;
  ctaLink: string;
  links: NavLink[];
}

/** CTA buton çifti */
export interface CtaPair {
  text: string;
  link: string;
}

/** Hero bölümü */
export interface LandingHeroConfig {
  badgeText: string;
  badgeVisible: boolean;
  headlineLine1: string;
  headlineLine2: string;
  subtitle: string;
  primaryCta: CtaPair;
  secondaryCta: CtaPair;
  heroImageUrl: string;
}

/** İstatistik öğesi */
export interface StatItem {
  value: string;
  label: string;
}

/** Ürün önizleme */
export interface LandingProductPreviewConfig {
  visible: boolean;
  screenshotUrl: string;
  caption: string;
}

/** Özellik kartı renk seçenekleri */
export type FeatureColor =
  | "teal"
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "indigo"
  | "orange";

/** Tek özellik kartı */
export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  color: FeatureColor;
}

/** Özellikler bölümü */
export interface LandingFeaturesConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  items: FeatureItem[];
}

/** Nasıl çalışır adımı */
export interface HowItWorksStep {
  icon: string;
  title: string;
  description: string;
}

/** Nasıl çalışır bölümü */
export interface LandingHowItWorksConfig {
  sectionTitle: string;
  steps: HowItWorksStep[];
}

/** Fiyatlandırma planı */
export interface PricingPlan {
  name: string;
  price: string;
  priceSuffix: string;
  description: string;
  features: string[];
  highlighted: boolean;
  ctaText: string;
  ctaLink: string;
}

/** Fiyatlandırma bölümü */
export interface LandingPricingConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  plans: PricingPlan[];
}

/** Alt CTA bölümü */
export interface LandingBottomCtaConfig {
  headlineLine1: string;
  headlineLine2: string;
  subtitle: string;
  primaryCta: CtaPair;
  secondaryCta: CtaPair;
}

/** Footer sütunu */
export interface FooterColumn {
  title: string;
  links: NavLink[];
}

/** Footer bölümü */
export interface LandingFooterConfig {
  brandDescription: string;
  columns: FooterColumn[];
  copyrightText: string;
}

/** Müşteri logosu */
export interface TrustedByLogo {
  name: string;
  imageUrl: string;
}

/** Müşteri logoları bölümü */
export interface LandingTrustedByConfig {
  visible: boolean;
  title: string;
  logos: TrustedByLogo[];
}

/** Testimonial */
export interface TestimonialItem {
  quote: string;
  authorName: string;
  authorRole: string;
  authorImageUrl: string;
}

/** Testimonials bölümü */
export interface LandingTestimonialsConfig {
  visible: boolean;
  title: string;
  items: TestimonialItem[];
}

/* ================================================================== */
/*  Ana config arayüzü                                                 */
/* ================================================================== */

export interface LandingPageConfig {
  seo: LandingSeoConfig;
  navbar: LandingNavbarConfig;
  hero: LandingHeroConfig;
  stats: StatItem[];
  productPreview: LandingProductPreviewConfig;
  features: LandingFeaturesConfig;
  howItWorks: LandingHowItWorksConfig;
  pricing: LandingPricingConfig;
  bottomCta: LandingBottomCtaConfig;
  footer: LandingFooterConfig;
  trustedBy: LandingTrustedByConfig;
  testimonials: LandingTestimonialsConfig;
}
