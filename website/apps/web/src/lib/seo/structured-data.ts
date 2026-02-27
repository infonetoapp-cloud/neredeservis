import { getMarketingBaseUrl, getPanelBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

export function buildMarketingOrganizationStructuredData() {
  const marketingBaseUrl = getMarketingBaseUrl();
  const panelBaseUrl = getPanelBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NeredeServis",
    url: marketingBaseUrl,
    logo: toAbsoluteUrl(marketingBaseUrl, "/opengraph-image"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@neredeservis.app",
        availableLanguage: ["tr"],
      },
    ],
    sameAs: [panelBaseUrl],
  };
}

export function buildMarketingWebSiteStructuredData() {
  const marketingBaseUrl = getMarketingBaseUrl();
  const panelBaseUrl = getPanelBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NeredeServis",
    url: marketingBaseUrl,
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "LoginAction",
      target: toAbsoluteUrl(panelBaseUrl, "/login"),
      name: "Web panele giris",
    },
  };
}

