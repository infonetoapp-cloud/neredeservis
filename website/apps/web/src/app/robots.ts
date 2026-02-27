import type { MetadataRoute } from "next";

import { getMarketingBaseUrl } from "@/lib/seo/site-urls";

export default function robots(): MetadataRoute.Robots {
  const marketingBaseUrl = getMarketingBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/iletisim", "/gizlilik", "/kvkk"],
        disallow: [
          "/admin",
          "/dashboard",
          "/drivers",
          "/vehicles",
          "/routes",
          "/live-ops",
          "/mode-select",
          "/login",
          "/giris",
          "/r/",
        ],
      },
    ],
    sitemap: `${marketingBaseUrl}/sitemap.xml`,
    host: marketingBaseUrl,
  };
}
