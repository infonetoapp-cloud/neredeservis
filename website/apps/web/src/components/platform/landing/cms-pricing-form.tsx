"use client";

import type {
  LandingPricingConfig,
  PricingPlan,
} from "@/components/marketing/landing-config-types";
import { CmsSectionWrapper } from "@/components/platform/landing/cms-section-wrapper";
import { CmsCharCounterInput } from "@/components/platform/landing/cms-char-counter-input";
import { CmsSortableList } from "@/components/platform/landing/cms-sortable-list";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  value: LandingPricingConfig;
  onChange: (val: LandingPricingConfig) => void;
  dirty?: boolean;
}

function PlanFeatureList({
  features,
  onChange,
}: {
  features: string[];
  onChange: (f: string[]) => void;
}) {
  const [newFeature, setNewFeature] = useState("");

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">Plan Özellikleri</label>
      <div className="space-y-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={f}
              onChange={(e) => {
                const next = [...features];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-400"
              maxLength={200}
            />
            <button
              type="button"
              onClick={() => onChange(features.filter((_, j) => j !== i))}
              className="p-1 text-slate-400 hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {features.length < 15 && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFeature.trim()) {
                onChange([...features, newFeature.trim()]);
                setNewFeature("");
              }
            }}
            className="flex-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-teal-400"
            placeholder="Yeni özellik ekle…"
            maxLength={200}
          />
          <button
            type="button"
            onClick={() => {
              if (newFeature.trim()) {
                onChange([...features, newFeature.trim()]);
                setNewFeature("");
              }
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function CmsPricingForm({ value, onChange, dirty }: Props) {
  return (
    <CmsSectionWrapper title="Fiyatlandırma" dirty={dirty}>
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

      <CmsSortableList<PricingPlan>
        items={value.plans}
        onChange={(plans) => onChange({ ...value, plans })}
        createEmpty={() => ({
          name: "",
          price: "",
          priceSuffix: "/ay",
          description: "",
          features: [],
          highlighted: false,
          ctaText: "Başla",
          ctaLink: "/register",
        })}
        maxItems={6}
        addLabel="Plan Ekle"
        renderItem={(plan, _i, update) => (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={plan.highlighted}
                  onChange={(e) => update({ highlighted: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Öne Çıkar
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CmsCharCounterInput
                label="Plan Adı"
                value={plan.name}
                onChange={(v) => update({ name: v })}
                maxLength={100}
              />
              <CmsCharCounterInput
                label="Fiyat"
                value={plan.price}
                onChange={(v) => update({ price: v })}
                maxLength={50}
              />
              <CmsCharCounterInput
                label="Fiyat Eki"
                value={plan.priceSuffix}
                onChange={(v) => update({ priceSuffix: v })}
                maxLength={20}
              />
            </div>
            <CmsCharCounterInput
              label="Açıklama"
              value={plan.description}
              onChange={(v) => update({ description: v })}
              maxLength={300}
            />
            <div className="grid grid-cols-2 gap-3">
              <CmsCharCounterInput
                label="CTA Metni"
                value={plan.ctaText}
                onChange={(v) => update({ ctaText: v })}
                maxLength={100}
              />
              <CmsCharCounterInput
                label="CTA Link"
                value={plan.ctaLink}
                onChange={(v) => update({ ctaLink: v })}
                maxLength={300}
              />
            </div>
            <PlanFeatureList
              features={plan.features}
              onChange={(f) => update({ features: f })}
            />
          </div>
        )}
      />
    </CmsSectionWrapper>
  );
}
