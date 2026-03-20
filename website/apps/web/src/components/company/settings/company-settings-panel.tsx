"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Building2,
  Bell,
  Key,
  Webhook,
  Save,
  Loader2,
  CheckCircle2,
  Camera,
  Trash2,
  Car,
  Calendar,
  Shield,
  Hash,
} from "lucide-react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  getCompanyProfileForCompany,
  removeCompanyLogo,
  updateCompanyProfileForCompany,
  uploadCompanyLogo,
  type CompanyProfile,
} from "@/features/company/company-client";

/* ─── Constants ─── */

type SettingsTab = "profile" | "notifications" | "integrations";

const TABS: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: "profile", label: "Şirket Profili", icon: Building2 },
  { id: "notifications", label: "Bildirimler", icon: Bell },
  { id: "integrations", label: "Entegrasyonlar", icon: Key },
];

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type Props = { companyId: string };

/* ─── Main Component ─── */

export function CompanySettingsPanel({ companyId }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { memberRole } = useCompanyMembership();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-zinc-200 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-orange-500 text-orange-700"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "profile" ? (
          <ProfileTab companyId={companyId} memberRole={memberRole} />
        ) : activeTab === "notifications" ? (
          <NotificationsTab />
        ) : (
          <IntegrationsTab companyId={companyId} />
        )}
      </div>
    </div>
  );
}

/* ─── Profile Tab ─── */

function ProfileTab({
  companyId,
  memberRole,
}: {
  companyId: string;
  memberRole: string | null;
}) {
  const { status } = useAuthSession();
  const canWrite = memberRole === "owner" || memberRole === "admin";

  /* ── State ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  /* ── Original values for dirty check ── */
  const [original, setOriginal] = useState<CompanyProfile | null>(null);

  /* ── Load profile ── */
  useEffect(() => {
    if (status !== "signed_in") return;
    let cancelled = false;
    setLoading(true);

    getCompanyProfileForCompany({ companyId })
      .then((profile) => {
        if (cancelled) return;
        setName(profile.name);
        setLogoUrl(profile.logoUrl);
        setOriginal(profile);
        setLoading(false);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setErrorMessage(error instanceof Error ? error.message : "Profil yüklenemedi.");
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, status]);

  /* ── Dirty check ── */
  const isDirty = original !== null && name !== original.name;

  /* ── Show transient success ── */
  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 4000);
  }, []);

  /* ── Logo upload handler ── */
  const handleLogoChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setErrorMessage("Yalnızca PNG, JPEG veya WebP dosyaları kabul edilir.");
        return;
      }
      if (file.size > MAX_LOGO_SIZE) {
        setErrorMessage("Logo dosya boyutu en fazla 2 MB olabilir.");
        return;
      }

      setUploadingLogo(true);
      setErrorMessage(null);

      try {
        const uploadResult = await uploadCompanyLogo(companyId, file);
        const downloadUrl = uploadResult.logoUrl;
        setLogoUrl(downloadUrl);
        setOriginal((prev) => (prev ? { ...prev, logoUrl: downloadUrl } : prev));
        showSuccess("Logo güncellendi.");
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Logo yüklenemedi.");
      } finally {
        setUploadingLogo(false);
      }
    },
    [companyId, showSuccess],
  );

  /* ── Remove logo ── */
  const handleRemoveLogo = useCallback(async () => {
    if (!canWrite) return;
    setUploadingLogo(true);
    setErrorMessage(null);

    try {
      await removeCompanyLogo(companyId);
      setLogoUrl(null);
      setOriginal((prev) => (prev ? { ...prev, logoUrl: null } : prev));
      showSuccess("Logo kaldırıldı.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Logo kaldırılamadı.");
    } finally {
      setUploadingLogo(false);
    }
  }, [companyId, canWrite, showSuccess]);

  /* ── Save name ── */
  const handleSave = useCallback(async () => {
    if (!isDirty || !canWrite) return;
    setSaving(true);
    setErrorMessage(null);

    try {
      const payload: { companyId: string; name?: string } = { companyId };
      if (name !== original?.name) payload.name = name;

      await updateCompanyProfileForCompany(payload);

      setOriginal((prev) => (prev ? { ...prev, name } : prev));
      showSuccess("Değişiklikler kaydedildi.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }, [companyId, name, original, isDirty, canWrite, showSuccess]);

  /* ── Loading ── */
  if (status !== "signed_in" || loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Profil yükleniyor…
      </div>
    );
  }

  const statusLabel =
    original?.status === "active"
      ? "Aktif"
      : original?.status === "suspended"
        ? "Askıya Alınmış"
        : "Arşivlenmiş";
  const statusColor =
    original?.status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : original?.status === "suspended"
        ? "bg-amber-100 text-amber-700"
        : "bg-zinc-100 text-zinc-600";

  return (
    <div className="space-y-8">
      {/* Messages */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* ─── Logo + Name section ─── */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-zinc-200 bg-zinc-100">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Şirket logosu"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-10 w-10 text-zinc-300" />
              </div>
            )}

            {/* Upload overlay */}
            {canWrite && (
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
            )}
          </div>

          {/* Remove logo button */}
          {canWrite && logoUrl && (
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={handleRemoveLogo}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
              title="Logoyu kaldır"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        {/* Name + status */}
        <div className="flex-1 text-center sm:text-left">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Şirket adı
              </label>
              <input
                type="text"
                value={name}
                onChange={canWrite ? (e) => setName(e.target.value) : undefined}
                readOnly={!canWrite}
                placeholder="Şirket adı giriniz"
                className="w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
              />
            </div>
            {canWrite && (
              <p className="text-xs text-zinc-400">
                Logo yüklemek için resme tıklayın. Maks. 2 MB, PNG/JPG/WebP.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Info Cards ─── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Hash} label="Şirket ID" value={companyId} mono />
        <InfoCard
          icon={Shield}
          label="Durum"
          value={statusLabel}
          badge
          badgeColor={statusColor}
        />
        <InfoCard
          icon={Car}
          label="Araç Limiti"
          value={String(original?.vehicleLimit ?? "—")}
        />
        <InfoCard
          icon={Calendar}
          label="Oluşturulma"
          value={
            original?.createdAt
              ? new Date(original.createdAt).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "—"
          }
        />
      </div>

      {/* ─── Save button ─── */}
      {canWrite && (
        <div className="flex justify-end border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={!isDirty || saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Info Card ─── */

function InfoCard({
  icon: Icon,
  label,
  value,
  mono,
  badge,
  badgeColor,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  badgeColor?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {badge ? (
        <span
          className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColor ?? "bg-zinc-100 text-zinc-600"}`}
        >
          {value}
        </span>
      ) : (
        <p
          className={`mt-1 text-base font-bold text-zinc-800 ${mono ? "font-mono text-sm" : ""}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

/* ─── Notifications Tab ─── */

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Bildirim tercihleri</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Operasyonel uyarıları ve bildirimleri kişiselleştirin.
        </p>
      </div>

      <div className="space-y-3">
        <NotificationToggle
          label="Bağlantı kopan araç uyarısı"
          description="Araç 5+ dakika sinyal göndermezse bildirim al"
          defaultOn
        />
        <NotificationToggle
          label="Geciken sefer uyarısı"
          description="Sefer planlanandan 15+ dakika geç kalırsa bildirim al"
          defaultOn
        />
        <NotificationToggle
          label="Yeni üye katılımı"
          description="Yeni bir üye şirkete katıldığında bildirim al"
          defaultOn={false}
        />
        <NotificationToggle
          label="Günlük operasyon özeti"
          description="Her gün saat 20:00'de operasyon özeti e-postası al"
          defaultOn={false}
        />
        <NotificationToggle
          label="Hız limiti aşımı"
          description="Araç belirlenen hız limitini aştığında anında bildirim al"
          defaultOn
        />
      </div>

      <p className="text-xs text-zinc-400">
        Bildirim tercihleri yakında aktif olacaktır. Tercihleriniz kaydedilmemektedir.
      </p>
    </div>
  );
}

/* ─── Integrations Tab ─── */

function IntegrationsTab({ companyId }: { companyId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">API ve entegrasyonlar</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Harici sistemlerle entegrasyon için API anahtarı ve webhook ayarları.
        </p>
      </div>

      {/* API Key section */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <Key className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-900">API Anahtarı</div>
            <div className="mt-0.5 text-xs text-zinc-500">Şirket ID: {companyId}</div>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-400 transition disabled:cursor-not-allowed"
          >
            Anahtar oluştur
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          API anahtarları henüz aktif değil. Bu özellik yakında kullanıma sunulacak.
        </p>
      </div>

      {/* Webhook section */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <Webhook className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-900">Webhook ayarları</div>
            <div className="mt-0.5 text-xs text-zinc-500">
              Olay tetiklemelerini harici URL&apos;lere yönlendirin
            </div>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-400 transition disabled:cursor-not-allowed"
          >
            Webhook ekle
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Webhook entegrasyonu henüz aktif değil. Bu özellik yakında kullanıma sunulacak.
        </p>
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */

function NotificationToggle({
  label,
  description,
  defaultOn,
}: {
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn ?? false);

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <div className="text-sm font-medium text-zinc-900">{label}</div>
        <div className="mt-0.5 text-xs text-zinc-500">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          on ? "bg-orange-500" : "bg-zinc-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
