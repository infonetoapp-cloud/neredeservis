"use client";

import type { LandingSeoConfig } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";

interface Props {
  value: LandingSeoConfig;
  onChange: (val: LandingSeoConfig) => void;
  dirty?: boolean;
}

export function CmsSeoForm({ value, onChange, dirty }: Props) {
  function set<K extends keyof LandingSeoConfig>(key: K, val: LandingSeoConfig[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <CmsSectionWrapper title="SEO Ayarları" dirty={dirty}>
      <CmsCharCounterInput
        label="Sayfa Başlığı (title)"
        value={value.title}
        onChange={(v) => set("title", v)}
        maxLength={200}
        placeholder="NeredeServis — Öğrenci Servis Takip Platformu"
      />
      <CmsCharCounterInput
        label="Açıklama (description)"
        value={value.description}
        onChange={(v) => set("description", v)}
        maxLength={500}
        multiline
        placeholder="Öğrenci servislerini gerçek zamanlı takip edin..."
      />
      <CmsCharCounterInput
        label="OG Image URL"
        value={value.ogImageUrl}
        onChange={(v) => set("ogImageUrl", v)}
        maxLength={500}
        placeholder="https://..."
      />
    </CmsSectionWrapper>
  );
}
