"use client";

import type {
  LandingTrustedByConfig,
  TrustedByLogo,
} from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsImageUploader } from "@/components/platform/landing/cms-image-uploader";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";

interface Props {
  value: LandingTrustedByConfig;
  onChange: (val: LandingTrustedByConfig) => void;
  dirty?: boolean;
}

export function CmsTrustedByForm({ value, onChange, dirty }: Props) {
  return (
    <CmsSectionWrapper title="Güvenilen Markalar" dirty={dirty}>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          checked={value.visible}
          onChange={(e) => onChange({ ...value, visible: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        Bölüm Görünür
      </label>

      <CmsCharCounterInput
        label="Başlık"
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
        maxLength={200}
      />

      <CmsSortableList<TrustedByLogo>
        items={value.logos}
        onChange={(logos) => onChange({ ...value, logos })}
        createEmpty={() => ({ name: "", imageUrl: "" })}
        maxItems={20}
        addLabel="Logo Ekle"
        renderItem={(logo, i, update) => (
          <div className="space-y-3">
            <CmsCharCounterInput
              label="Marka Adı"
              value={logo.name}
              onChange={(v) => update({ name: v })}
              maxLength={100}
            />
            <CmsImageUploader
              storagePath={`site_media/trusted-by/logo-${i}`}
              value={logo.imageUrl}
              onChange={(v) => update({ imageUrl: v })}
            />
          </div>
        )}
      />
    </CmsSectionWrapper>
  );
}
