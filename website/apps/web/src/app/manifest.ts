import type { MetadataRoute } from "next";

import { getMarketingBaseUrl, getPanelBaseUrl } from "@/lib/seo/site-urls";

export default function manifest(): MetadataRoute.Manifest {
  const marketingBaseUrl = getMarketingBaseUrl();
  const panelBaseUrl = getPanelBaseUrl();

  return {
    name: "NeredeServis Web",
    short_name: "NeredeServis",
    description:
      "Firma operasyonu ve bireysel şoför akışlarını yönetmek için NeredeServis web paneli.",
    start_url: `${panelBaseUrl}/giris`,
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1d4ed8",
    lang: "tr-TR",
    categories: ["business", "productivity", "maps-navigation"],
    icons: [
      {
        src: `${marketingBaseUrl}/icon`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: `${marketingBaseUrl}/apple-icon`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

