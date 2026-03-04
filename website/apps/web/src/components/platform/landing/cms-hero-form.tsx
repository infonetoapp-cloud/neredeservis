"use client";

import type { LandingHeroConfig } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsImageUploader } from "@/components/platform/landing/cms-image-uploader";

interface Props {
  value: LandingHeroConfig;
  onChange: (val: LandingHeroConfig) => void;
  dirty?: boolean;
}

export function CmsHeroForm({ value, onChange, dirty }: Props) {
  function set<K extends keyof LandingHeroConfig>(key: K, val: LandingHeroConfig[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <CmsSectionWrapper title="Hero Bölümü" dirty={dirty}>
      {/* Badge */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={value.badgeVisible}
            onChange={(e) => set("badgeVisible", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          Badge Görünür
        </label>
      </div>
      <CmsCharCounterInput
        label="Badge Metni"
        value={value.badgeText}
        onChange={(v) => set("badgeText", v)}
        maxLength={200}
      />

      {/* Headlines */}
      <CmsCharCounterInput
        label="Başlık Satır 1"
        value={value.headlineLine1}
        onChange={(v) => set("headlineLine1", v)}
        maxLength={200}
      />
      <CmsCharCounterInput
        label="Başlık Satır 2 (Gradient)"
        value={value.headlineLine2}
        onChange={(v) => set("headlineLine2", v)}
        maxLength={200}
      />
      <CmsCharCounterInput
        label="Alt Yazı"
        value={value.subtitle}
        onChange={(v) => set("subtitle", v)}
        maxLength={500}
        multiline
      />

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <CmsCharCounterInput
          label="Birincil CTA Metni"
          value={value.primaryCta.text}
          onChange={(v) => set("primaryCta", { ...value.primaryCta, text: v })}
          maxLength={100}
        />
        <CmsCharCounterInput
          label="Birincil CTA Link"
          value={value.primaryCta.link}
          onChange={(v) => set("primaryCta", { ...value.primaryCta, link: v })}
          maxLength={300}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CmsCharCounterInput
          label="İkincil CTA Metni"
          value={value.secondaryCta.text}
          onChange={(v) => set("secondaryCta", { ...value.secondaryCta, text: v })}
          maxLength={100}
        />
        <CmsCharCounterInput
          label="İkincil CTA Link"
          value={value.secondaryCta.link}
          onChange={(v) => set("secondaryCta", { ...value.secondaryCta, link: v })}
          maxLength={300}
        />
      </div>

      {/* Hero Image */}
      <CmsImageUploader
        storagePath="site_media/hero-image"
        value={value.heroImageUrl}
        onChange={(v) => set("heroImageUrl", v)}
      />
    </CmsSectionWrapper>
  );
}
