import type { MetadataRoute } from "next";

import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const INDEXABLE_MARKETING_PATHS = ["/", "/iletisim", "/gizlilik", "/kvkk"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const marketingBaseUrl = getMarketingBaseUrl();
  const now = new Date();

  return INDEXABLE_MARKETING_PATHS.map((path) => ({
    url: toAbsoluteUrl(marketingBaseUrl, path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
