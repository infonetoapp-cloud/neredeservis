"use client";

import type { LandingBottomCtaConfig } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";

interface Props {
  value: LandingBottomCtaConfig;
  onChange: (val: LandingBottomCtaConfig) => void;
  dirty?: boolean;
}

export function CmsBottomCtaForm({ value, onChange, dirty }: Props) {
  function set<K extends keyof LandingBottomCtaConfig>(key: K, val: LandingBottomCtaConfig[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <CmsSectionWrapper title="Alt CTA Bandı" dirty={dirty}>
      <CmsCharCounterInput
        label="Başlık Satır 1"
        value={value.headlineLine1}
        onChange={(v) => set("headlineLine1", v)}
        maxLength={200}
      />
      <CmsCharCounterInput
        label="Başlık Satır 2"
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
    </CmsSectionWrapper>
  );
}
