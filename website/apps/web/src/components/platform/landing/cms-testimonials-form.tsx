"use client";

import type {
  LandingTestimonialsConfig,
  TestimonialItem,
} from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsImageUploader } from "@/components/platform/landing/cms-image-uploader";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";

interface Props {
  value: LandingTestimonialsConfig;
  onChange: (val: LandingTestimonialsConfig) => void;
  dirty?: boolean;
}

export function CmsTestimonialsForm({ value, onChange, dirty }: Props) {
  return (
    <CmsSectionWrapper title="Müşteri Yorumları" dirty={dirty}>
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

      <CmsSortableList<TestimonialItem>
        items={value.items}
        onChange={(items) => onChange({ ...value, items })}
        createEmpty={() => ({
          quote: "",
          authorName: "",
          authorRole: "",
          authorImageUrl: "",
        })}
        maxItems={10}
        addLabel="Yorum Ekle"
        renderItem={(item, i, update) => (
          <div className="space-y-3">
            <CmsCharCounterInput
              label="Alıntı"
              value={item.quote}
              onChange={(v) => update({ quote: v })}
              maxLength={500}
              multiline
            />
            <div className="grid grid-cols-2 gap-3">
              <CmsCharCounterInput
                label="İsim"
                value={item.authorName}
                onChange={(v) => update({ authorName: v })}
                maxLength={100}
              />
              <CmsCharCounterInput
                label="Unvan"
                value={item.authorRole}
                onChange={(v) => update({ authorRole: v })}
                maxLength={100}
              />
            </div>
            <CmsImageUploader
              storagePath={`site_media/testimonials/author-${i}`}
              value={item.authorImageUrl}
              onChange={(v) => update({ authorImageUrl: v })}
            />
          </div>
        )}
      />
    </CmsSectionWrapper>
  );
}
