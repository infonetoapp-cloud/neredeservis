import type { Metadata } from "next";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";
import { DEFAULT_LANDING_CONFIG } from "@/components/marketing/landing-default-config";
import { LandingPageLive } from "@/components/marketing/landing-page-live";

const baseUrl = getMarketingBaseUrl();
const seo = DEFAULT_LANDING_CONFIG.seo;

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  robots: { index: true, follow: true },
  alternates: { canonical: baseUrl },
  openGraph: {
    title: seo.title,
    description: seo.description,
    url: baseUrl,
    type: "website",
    siteName: "NeredeServis",
    images: seo.ogImageUrl
      ? [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: seo.title }]
      : [{ url: toAbsoluteUrl(baseUrl, "/opengraph-image"), width: 1200, height: 630, alt: seo.title }],
  },
};

export default function MarketingHomePage() {
  return <LandingPageLive />;
}
