"use client";

import type { LandingProductPreviewConfig } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsImageUploader } from "@/components/platform/landing/cms-image-uploader";

interface Props {
  value: LandingProductPreviewConfig;
  onChange: (val: LandingProductPreviewConfig) => void;
  dirty?: boolean;
}

export function CmsProductPreviewForm({ value, onChange, dirty }: Props) {
  function set<K extends keyof LandingProductPreviewConfig>(
    key: K,
    val: LandingProductPreviewConfig[K],
  ) {
    onChange({ ...value, [key]: val });
  }

  return (
    <CmsSectionWrapper title="Ürün Önizleme" dirty={dirty}>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          checked={value.visible}
          onChange={(e) => set("visible", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        Bölüm Görünür
      </label>

      <CmsImageUploader
        storagePath="site_media/product-preview"
        value={value.screenshotUrl}
        onChange={(v) => set("screenshotUrl", v)}
      />

      <CmsCharCounterInput
        label="Alt Yazı"
        value={value.caption}
        onChange={(v) => set("caption", v)}
        maxLength={300}
        placeholder="Gerçek zamanlı servis takip paneli"
      />
    </CmsSectionWrapper>
  );
}
