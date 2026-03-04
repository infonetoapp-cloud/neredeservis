"use client";

import type {
  LandingFeaturesConfig,
  FeatureItem,
  FeatureColor,
} from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsIconPicker } from "@/components/platform/landing/cms-icon-picker";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";

const COLOR_OPTIONS: { value: FeatureColor; label: string }[] = [
  { value: "teal", label: "Teal" },
  { value: "sky", label: "Sky" },
  { value: "amber", label: "Amber" },
  { value: "violet", label: "Violet" },
  { value: "rose", label: "Rose" },
  { value: "emerald", label: "Emerald" },
  { value: "indigo", label: "Indigo" },
  { value: "orange", label: "Orange" },
];

interface Props {
  value: LandingFeaturesConfig;
  onChange: (val: LandingFeaturesConfig) => void;
  dirty?: boolean;
}

export function CmsFeaturesForm({ value, onChange, dirty }: Props) {
  return (
    <CmsSectionWrapper title="Özellikler" dirty={dirty}>
      <CmsCharCounterInput
        label="Bölüm Başlığı"
        value={value.sectionTitle}
        onChange={(v) => onChange({ ...value, sectionTitle: v })}
        maxLength={200}
      />
      <CmsCharCounterInput
        label="Bölüm Alt Yazısı"
        value={value.sectionSubtitle}
        onChange={(v) => onChange({ ...value, sectionSubtitle: v })}
        maxLength={500}
        multiline
      />

      <CmsSortableList<FeatureItem>
        items={value.items}
        onChange={(items) => onChange({ ...value, items })}
        createEmpty={() => ({
          icon: "CheckCircle2",
          title: "",
          description: "",
          color: "teal" as FeatureColor,
        })}
        maxItems={12}
        addLabel="Özellik Ekle"
        renderItem={(item, _i, update) => (
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <CmsIconPicker value={item.icon} onChange={(v) => update({ icon: v })} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Renk</label>
                <select
                  value={item.color}
                  onChange={(e) => update({ color: e.target.value as FeatureColor })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <CmsCharCounterInput
              label="Başlık"
              value={item.title}
              onChange={(v) => update({ title: v })}
              maxLength={100}
            />
            <CmsCharCounterInput
              label="Açıklama"
              value={item.description}
              onChange={(v) => update({ description: v })}
              maxLength={500}
              multiline
            />
          </div>
        )}
      />
    </CmsSectionWrapper>
  );
}
