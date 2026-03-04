"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Loader2, ExternalLink, RefreshCw } from "lucide-react";

import type { LandingPageConfig } from "@/components/marketing/landing-config-types";
import { DEFAULT_LANDING_CONFIG } from "@/components/marketing/landing-default-config";
import {
  platformGetLandingConfig,
  platformSaveLandingConfig,
} from "@/features/platform/platform-landing-client";

import { CmsSeoForm } from "@/components/platform/landing/cms-seo-form";
import { CmsNavbarForm } from "@/components/platform/landing/cms-navbar-form";
import { CmsHeroForm } from "@/components/platform/landing/cms-hero-form";
import { CmsStatsForm } from "@/components/platform/landing/cms-stats-form";
import { CmsProductPreviewForm } from "@/components/platform/landing/cms-product-preview-form";
import { CmsFeaturesForm } from "@/components/platform/landing/cms-features-form";
import { CmsHowItWorksForm } from "@/components/platform/landing/cms-how-it-works-form";
import { CmsPricingForm } from "@/components/platform/landing/cms-pricing-form";
import { CmsBottomCtaForm } from "@/components/platform/landing/cms-bottom-cta-form";
import { CmsFooterForm } from "@/components/platform/landing/cms-footer-form";
import { CmsTrustedByForm } from "@/components/platform/landing/cms-trusted-by-form";
import { CmsTestimonialsForm } from "@/components/platform/landing/cms-testimonials-form";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export function LandingCmsPanel() {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [original, setOriginal] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Section dirty tracking ─────────────────────────────────────────────────
  function isDirty(key: keyof LandingPageConfig): boolean {
    return JSON.stringify(config[key]) !== JSON.stringify(original[key]);
  }

  const anyDirty = JSON.stringify(config) !== JSON.stringify(original);

  // ─── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await platformGetLandingConfig();
      if (res.exists && res.config) {
        const merged: LandingPageConfig = {
          seo: res.config.seo ?? DEFAULT_LANDING_CONFIG.seo,
          navbar: res.config.navbar ?? DEFAULT_LANDING_CONFIG.navbar,
          hero: res.config.hero ?? DEFAULT_LANDING_CONFIG.hero,
          stats: res.config.stats ?? DEFAULT_LANDING_CONFIG.stats,
          productPreview: res.config.productPreview ?? DEFAULT_LANDING_CONFIG.productPreview,
          features: res.config.features ?? DEFAULT_LANDING_CONFIG.features,
          howItWorks: res.config.howItWorks ?? DEFAULT_LANDING_CONFIG.howItWorks,
          pricing: res.config.pricing ?? DEFAULT_LANDING_CONFIG.pricing,
          bottomCta: res.config.bottomCta ?? DEFAULT_LANDING_CONFIG.bottomCta,
          footer: res.config.footer ?? DEFAULT_LANDING_CONFIG.footer,
          trustedBy: res.config.trustedBy ?? DEFAULT_LANDING_CONFIG.trustedBy,
          testimonials: res.config.testimonials ?? DEFAULT_LANDING_CONFIG.testimonials,
        };
        setConfig(merged);
        setOriginal(merged);
      }
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Config yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setStatus("saving");
    setErrorMsg(null);
    try {
      await platformSaveLandingConfig(config);
      setOriginal(config);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Kaydetme hatası.");
    }
  }

  // ─── Section updater ───────────────────────────────────────────────────────
  function updateSection<K extends keyof LandingPageConfig>(
    key: K,
    val: LandingPageConfig[K],
  ) {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        <span className="ml-2 text-sm text-slate-500">Yükleniyor…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Ana Sayfa İçerik Yönetimi
          </h2>
          {anyDirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Kaydedilmemiş
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={status === "saving"}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Yenile
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Önizle
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={!anyDirty || status === "saving"}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "saving" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {status === "saved" ? "Kaydedildi ✓" : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {status === "error" && errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}
      {status === "saved" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Değişiklikler başarıyla kaydedildi.
        </div>
      )}

      {/* Section forms */}
      <CmsSeoForm
        value={config.seo}
        onChange={(v) => updateSection("seo", v)}
        dirty={isDirty("seo")}
      />
      <CmsNavbarForm
        value={config.navbar}
        onChange={(v) => updateSection("navbar", v)}
        dirty={isDirty("navbar")}
      />
      <CmsHeroForm
        value={config.hero}
        onChange={(v) => updateSection("hero", v)}
        dirty={isDirty("hero")}
      />
      <CmsStatsForm
        value={config.stats}
        onChange={(v) => updateSection("stats", v)}
        dirty={isDirty("stats")}
      />
      <CmsProductPreviewForm
        value={config.productPreview}
        onChange={(v) => updateSection("productPreview", v)}
        dirty={isDirty("productPreview")}
      />
      <CmsFeaturesForm
        value={config.features}
        onChange={(v) => updateSection("features", v)}
        dirty={isDirty("features")}
      />
      <CmsHowItWorksForm
        value={config.howItWorks}
        onChange={(v) => updateSection("howItWorks", v)}
        dirty={isDirty("howItWorks")}
      />
      <CmsPricingForm
        value={config.pricing}
        onChange={(v) => updateSection("pricing", v)}
        dirty={isDirty("pricing")}
      />
      <CmsBottomCtaForm
        value={config.bottomCta}
        onChange={(v) => updateSection("bottomCta", v)}
        dirty={isDirty("bottomCta")}
      />
      <CmsFooterForm
        value={config.footer}
        onChange={(v) => updateSection("footer", v)}
        dirty={isDirty("footer")}
      />
      <CmsTrustedByForm
        value={config.trustedBy}
        onChange={(v) => updateSection("trustedBy", v)}
        dirty={isDirty("trustedBy")}
      />
      <CmsTestimonialsForm
        value={config.testimonials}
        onChange={(v) => updateSection("testimonials", v)}
        dirty={isDirty("testimonials")}
      />
    </div>
  );
}
