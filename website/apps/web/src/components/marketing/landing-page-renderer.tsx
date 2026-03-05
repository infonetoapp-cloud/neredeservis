import type { LandingPageConfig } from "./landing-config-types";
import { LandingNavbar } from "./sections/landing-navbar";
import { LandingHero } from "./sections/landing-hero";
import { LandingStats } from "./sections/landing-stats";
import { LandingProductPreview } from "./sections/landing-product-preview";
import { LandingFeatures } from "./sections/landing-features";
import { LandingHowItWorks } from "./sections/landing-how-it-works";
import { LandingPricing } from "./sections/landing-pricing";
import { LandingBottomCta } from "./sections/landing-bottom-cta";
import { LandingFooter } from "./sections/landing-footer";

interface Props {
  config: LandingPageConfig;
}

/**
 * Renders all landing page sections in order.
 * Each section receives only the slice of config it needs.
 */
export function LandingPageRenderer({ config }: Props) {
  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-brand/20">
      <LandingNavbar navbar={config.navbar} />
      <LandingHero hero={config.hero} />
      <LandingStats stats={config.stats} />
      <LandingProductPreview preview={config.productPreview} />
      <LandingFeatures features={config.features} />
      <LandingHowItWorks howItWorks={config.howItWorks} />
      <LandingPricing pricing={config.pricing} />
      <LandingBottomCta bottomCta={config.bottomCta} />
      <LandingFooter footer={config.footer} />
    </main>
  );
}
