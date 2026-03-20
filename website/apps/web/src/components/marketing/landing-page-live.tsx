"use client";

import { useEffect, useState } from "react";

import type { LandingPageConfig } from "@/components/marketing/landing-config-types";
import { DEFAULT_LANDING_CONFIG } from "@/components/marketing/landing-default-config";
import { LandingPageRenderer } from "@/components/marketing/landing-page-renderer";
import { fetchLandingConfig } from "@/features/platform/platform-landing-client";

/**
 * Client component: self-hosted backend'den landing config okur, merge eder, render eder.
 * İlk render DEFAULT ile anında olur, remote config gelince günceller.
 */
export function LandingPageLive() {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const remote = await fetchLandingConfig();
        if (cancelled || !remote) return;

        // Deep merge: her section için, remote varsa onu kullan, yoksa default kalsın
        const merged: LandingPageConfig = {
          seo: remote.seo ?? DEFAULT_LANDING_CONFIG.seo,
          navbar: remote.navbar ?? DEFAULT_LANDING_CONFIG.navbar,
          hero: remote.hero ?? DEFAULT_LANDING_CONFIG.hero,
          stats: remote.stats ?? DEFAULT_LANDING_CONFIG.stats,
          productPreview: remote.productPreview ?? DEFAULT_LANDING_CONFIG.productPreview,
          features: remote.features ?? DEFAULT_LANDING_CONFIG.features,
          howItWorks: remote.howItWorks ?? DEFAULT_LANDING_CONFIG.howItWorks,
          pricing: remote.pricing ?? DEFAULT_LANDING_CONFIG.pricing,
          bottomCta: remote.bottomCta ?? DEFAULT_LANDING_CONFIG.bottomCta,
          footer: remote.footer ?? DEFAULT_LANDING_CONFIG.footer,
          trustedBy: remote.trustedBy ?? DEFAULT_LANDING_CONFIG.trustedBy,
          testimonials: remote.testimonials ?? DEFAULT_LANDING_CONFIG.testimonials,
        };

        setConfig(merged);
      } catch {
        // Hata durumunda default config ile devam et
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return <LandingPageRenderer config={config} />;
}
