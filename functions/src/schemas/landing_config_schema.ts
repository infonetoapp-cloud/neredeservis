import { z } from 'zod';

/* ================================================================== */
/*  Zod validation schema for LandingPageConfig                        */
/*  Mirrors the TypeScript types in the frontend                       */
/* ================================================================== */

const ctaPairSchema = z.object({
  text: z.string().max(100),
  link: z.string().max(300),
});

const navLinkSchema = z.object({
  label: z.string().max(100),
  href: z.string().max(300),
});

export const landingConfigSchema = z.object({
  seo: z.object({
    title: z.string().max(200),
    description: z.string().max(500),
    ogImageUrl: z.string().max(500),
  }).optional(),

  navbar: z.object({
    logoUrl: z.string().max(500),
    ctaText: z.string().max(100),
    ctaLink: z.string().max(300),
    links: z.array(navLinkSchema).max(8),
  }).optional(),

  hero: z.object({
    badgeText: z.string().max(200),
    badgeVisible: z.boolean(),
    headlineLine1: z.string().max(200),
    headlineLine2: z.string().max(200),
    subtitle: z.string().max(500),
    primaryCta: ctaPairSchema,
    secondaryCta: ctaPairSchema,
    heroImageUrl: z.string().max(500),
  }).optional(),

  stats: z.array(
    z.object({
      value: z.string().max(50),
      label: z.string().max(100),
    }),
  ).max(8).optional(),

  productPreview: z.object({
    visible: z.boolean(),
    screenshotUrl: z.string().max(500),
    caption: z.string().max(300),
  }).optional(),

  features: z.object({
    sectionTitle: z.string().max(200),
    sectionSubtitle: z.string().max(500),
    items: z.array(
      z.object({
        icon: z.string().max(50),
        title: z.string().max(100),
        description: z.string().max(500),
        color: z.enum(['teal', 'sky', 'amber', 'violet', 'rose', 'emerald', 'indigo', 'orange']),
      }),
    ).max(12),
  }).optional(),

  howItWorks: z.object({
    sectionTitle: z.string().max(200),
    steps: z.array(
      z.object({
        icon: z.string().max(50),
        title: z.string().max(100),
        description: z.string().max(500),
      }),
    ).max(6),
  }).optional(),

  pricing: z.object({
    sectionTitle: z.string().max(200),
    sectionSubtitle: z.string().max(500),
    plans: z.array(
      z.object({
        name: z.string().max(100),
        price: z.string().max(50),
        priceSuffix: z.string().max(20),
        description: z.string().max(300),
        features: z.array(z.string().max(200)).max(15),
        highlighted: z.boolean(),
        ctaText: z.string().max(100),
        ctaLink: z.string().max(300),
      }),
    ).max(6),
  }).optional(),

  bottomCta: z.object({
    headlineLine1: z.string().max(200),
    headlineLine2: z.string().max(200),
    subtitle: z.string().max(500),
    primaryCta: ctaPairSchema,
    secondaryCta: ctaPairSchema,
  }).optional(),

  footer: z.object({
    brandDescription: z.string().max(500),
    columns: z.array(
      z.object({
        title: z.string().max(100),
        links: z.array(navLinkSchema).max(10),
      }),
    ).max(5),
    copyrightText: z.string().max(200),
  }).optional(),

  trustedBy: z.object({
    visible: z.boolean(),
    title: z.string().max(200),
    logos: z.array(
      z.object({
        name: z.string().max(100),
        imageUrl: z.string().max(500),
      }),
    ).max(20),
  }).optional(),

  testimonials: z.object({
    visible: z.boolean(),
    title: z.string().max(200),
    items: z.array(
      z.object({
        quote: z.string().max(500),
        authorName: z.string().max(100),
        authorRole: z.string().max(100),
        authorImageUrl: z.string().max(500),
      }),
    ).max(10),
  }).optional(),
});

export type LandingConfigInput = z.infer<typeof landingConfigSchema>;
