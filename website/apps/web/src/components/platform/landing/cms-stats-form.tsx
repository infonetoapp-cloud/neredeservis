"use client";

import type { StatItem } from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";

interface Props {
  value: StatItem[];
  onChange: (val: StatItem[]) => void;
  dirty?: boolean;
}

export function CmsStatsForm({ value, onChange, dirty }: Props) {
  return (
    <CmsSectionWrapper title="İstatistikler" dirty={dirty}>
      <CmsSortableList
        items={value}
        onChange={onChange}
        createEmpty={() => ({ value: "0", label: "" })}
        maxItems={8}
        addLabel="İstatistik Ekle"
        renderItem={(item, _i, update) => (
          <div className="grid grid-cols-2 gap-3">
            <CmsCharCounterInput
              label="Değer"
              value={item.value}
              onChange={(v) => update({ value: v })}
              maxLength={50}
              placeholder="150+"
            />
            <CmsCharCounterInput
              label="Etiket"
              value={item.label}
              onChange={(v) => update({ label: v })}
              maxLength={100}
              placeholder="Aktif Okul"
            />
          </div>
        )}
      />
    </CmsSectionWrapper>
  );
}
