"use client";

import type { LandingFooterConfig, NavLink } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";

interface Props {
  value: LandingFooterConfig;
  onChange: (val: LandingFooterConfig) => void;
  dirty?: boolean;
}

export function CmsFooterForm({ value, onChange, dirty }: Props) {
  function set<K extends keyof LandingFooterConfig>(key: K, val: LandingFooterConfig[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <CmsSectionWrapper title="Footer" dirty={dirty}>
      <CmsCharCounterInput
        label="Marka Açıklaması"
        value={value.brandDescription}
        onChange={(v) => set("brandDescription", v)}
        maxLength={500}
        multiline
      />
      <CmsCharCounterInput
        label="Telif Hakkı Metni"
        value={value.copyrightText}
        onChange={(v) => set("copyrightText", v)}
        maxLength={200}
      />

      {/* Footer columns */}
      <div>
        <label className="mb-2 block text-xs font-medium text-slate-700">
          Footer Sütunları
        </label>
        <CmsSortableList
          items={value.columns}
          onChange={(cols) => set("columns", cols)}
          createEmpty={() => ({ title: "", links: [] })}
          maxItems={5}
          addLabel="Sütun Ekle"
          renderItem={(col, _i, updateCol) => (
            <div className="space-y-3">
              <CmsCharCounterInput
                label="Sütun Başlığı"
                value={col.title}
                onChange={(v) => updateCol({ title: v })}
                maxLength={100}
              />
              <label className="mb-1 block text-xs font-medium text-slate-600">Linkler</label>
              <CmsSortableList<NavLink>
                items={col.links}
                onChange={(links) => updateCol({ links })}
                createEmpty={() => ({ label: "", href: "" })}
                maxItems={10}
                addLabel="Link Ekle"
                renderItem={(link, _j, updateLink) => (
                  <div className="grid grid-cols-2 gap-2">
                    <CmsCharCounterInput
                      label="Etiket"
                      value={link.label}
                      onChange={(v) => updateLink({ label: v })}
                      maxLength={100}
                    />
                    <CmsCharCounterInput
                      label="Href"
                      value={link.href}
                      onChange={(v) => updateLink({ href: v })}
                      maxLength={300}
                    />
                  </div>
                )}
              />
            </div>
          )}
        />
      </div>
    </CmsSectionWrapper>
  );
}
