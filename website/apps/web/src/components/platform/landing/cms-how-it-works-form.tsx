"use client";

import type { LandingHowItWorksConfig, HowItWorksStep } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsIconPicker } from "@/components/platform/landing/cms-icon-picker";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";

interface Props {
  value: LandingHowItWorksConfig;
  onChange: (val: LandingHowItWorksConfig) => void;
  dirty?: boolean;
}

export function CmsHowItWorksForm({ value, onChange, dirty }: Props) {
  return (
    <CmsSectionWrapper title="Nasıl Çalışır" dirty={dirty}>
      <CmsCharCounterInput
        label="Bölüm Başlığı"
        value={value.sectionTitle}
        onChange={(v) => onChange({ ...value, sectionTitle: v })}
        maxLength={200}
      />

      <CmsSortableList<HowItWorksStep>
        items={value.steps}
        onChange={(steps) => onChange({ ...value, steps })}
        createEmpty={() => ({ icon: "CheckCircle2", title: "", description: "" })}
        maxItems={6}
        addLabel="Adım Ekle"
        renderItem={(item, _i, update) => (
          <div className="space-y-3">
            <CmsIconPicker value={item.icon} onChange={(v) => update({ icon: v })} />
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
