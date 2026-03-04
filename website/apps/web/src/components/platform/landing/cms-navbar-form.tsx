"use client";

import type { LandingNavbarConfig } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsImageUploader } from "@/components/platform/landing/cms-image-uploader";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";

interface Props {
  value: LandingNavbarConfig;
  onChange: (val: LandingNavbarConfig) => void;
  dirty?: boolean;
}

export function CmsNavbarForm({ value, onChange, dirty }: Props) {
  function set<K extends keyof LandingNavbarConfig>(key: K, val: LandingNavbarConfig[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <CmsSectionWrapper title="Navbar" dirty={dirty}>
      <CmsImageUploader
        storagePath="site_media/navbar-logo"
        value={value.logoUrl}
        onChange={(v) => set("logoUrl", v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <CmsCharCounterInput
          label="CTA Metni"
          value={value.ctaText}
          onChange={(v) => set("ctaText", v)}
          maxLength={100}
        />
        <CmsCharCounterInput
          label="CTA Link"
          value={value.ctaLink}
          onChange={(v) => set("ctaLink", v)}
          maxLength={300}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-slate-700">
          Menü Linkleri
        </label>
        <CmsSortableList
          items={value.links}
          onChange={(links) => set("links", links)}
          createEmpty={() => ({ label: "", href: "" })}
          maxItems={8}
          addLabel="Link Ekle"
          renderItem={(item, _i, update) => (
            <div className="grid grid-cols-2 gap-3">
              <CmsCharCounterInput
                label="Etiket"
                value={item.label}
                onChange={(v) => update({ label: v })}
                maxLength={100}
              />
              <CmsCharCounterInput
                label="Href"
                value={item.href}
                onChange={(v) => update({ href: v })}
                maxLength={300}
              />
            </div>
          )}
        />
      </div>
    </CmsSectionWrapper>
  );
}
