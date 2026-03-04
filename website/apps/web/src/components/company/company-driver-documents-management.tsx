"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Search,
  Trash2,
  Save,
  Loader2,
  ChevronRight,
  User,
} from "lucide-react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  listCompanyDriversForCompany,
  listDriverDocumentsForCompany,
  upsertDriverDocumentForCompany,
  deleteDriverDocumentForCompany,
  type CompanyDriverItem,
  type DriverDocumentSummary,
  type DriverDocumentItem,
  type DriverDocType,
  type DriverDocOverallStatus,
} from "@/features/company/company-client";

/* ─── Constants ─── */

type Props = { companyId: string };

const ALL_DOC_TYPES: DriverDocType[] = ["ehliyet", "src", "psikoteknik", "saglik"];

const DOC_TYPE_LABELS: Record<DriverDocType, string> = {
  ehliyet: "Ehliyet",
  src: "SRC Belgesi",
  psikoteknik: "Psikoteknik Raporu",
  saglik: "Sağlık Raporu",
};

const OVERALL_STATUS_CONFIG: Record<
  DriverDocOverallStatus,
  { label: string; icon: typeof CheckCircle2; className: string; badgeColor: string }
> = {
  ok: {
    label: "Belgeler Tamam",
    icon: CheckCircle2,
    className: "text-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-700 ring-emerald-300/40",
  },
  warning: {
    label: "Uyarı",
    icon: AlertTriangle,
    className: "text-amber-500",
    badgeColor: "bg-amber-100 text-amber-700 ring-amber-300/40",
  },
  blocked: {
    label: "Engel",
    icon: XCircle,
    className: "text-red-500",
    badgeColor: "bg-red-100 text-red-700 ring-red-300/40",
  },
  missing: {
    label: "Yüklenmemiş",
    icon: CircleDashed,
    className: "text-zinc-400",
    badgeColor: "bg-zinc-100 text-zinc-500 ring-zinc-300/40",
  },
};

type StatusFilter = "all" | DriverDocOverallStatus;
const FILTER_OPTIONS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "blocked", label: "Engel" },
  { key: "warning", label: "Uyarı" },
  { key: "missing", label: "Yüklenmemiş" },
  { key: "ok", label: "Tamam" },
];

/* ─── Helpers ─── */

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Date(parsed).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysRemainingLabel(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return `${Math.abs(days)} gün geçmiş`;
  if (days === 0) return "Bugün bitiyor";
  return `${days} gün kaldı`;
}

/** Build a "missing" summary for a driver that has no document data yet */
function buildEmptySummary(driver: CompanyDriverItem): DriverDocumentSummary {
  return {
    driverId: driver.driverId,
    driverName: driver.name,
    overallStatus: "missing",
    documents: ALL_DOC_TYPES.map((docType) => ({
      driverId: driver.driverId,
      docType,
      issueDate: null,
      expiryDate: null,
      licenseClass: null,
      note: null,
      status: "not_uploaded" as const,
      daysRemaining: null,
      uploadedAt: null,
      uploadedBy: null,
      updatedAt: null,
    })),
  };
}

/* ─── Component ─── */

export function CompanyDriverDocumentsManagement({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole } = useCompanyMembership();

  /* ── Data ── */
  const [drivers, setDrivers] = useState<CompanyDriverItem[] | null>(null);
  const [docSummaries, setDocSummaries] = useState<Map<string, DriverDocumentSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── UI ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [editingDocType, setEditingDocType] = useState<DriverDocType | null>(null);
  const [savingDocType, setSavingDocType] = useState<DriverDocType | null>(null);
  const [deletingDocType, setDeletingDocType] = useState<DriverDocType | null>(null);

  /* ── Draft form ── */
  const [draftIssueDate, setDraftIssueDate] = useState("");
  const [draftExpiryDate, setDraftExpiryDate] = useState("");
  const [draftLicenseClass, setDraftLicenseClass] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const canWrite = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";

  /* ── Flash info message ── */
  const flashInfo = useCallback((message: string) => {
    setInfoMessage(message);
    if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    infoTimerRef.current = setTimeout(() => setInfoMessage(null), 4000);
  }, []);

  /* ── Fetch: drivers (primary) + document data (enrichment) ── */
  useEffect(() => {
    if (status !== "signed_in") return;
    let cancelled = false;
    setLoading(true);

    // 1. Always fetch driver list (proven API)
    listCompanyDriversForCompany({ companyId, limit: 200 })
      .then((driverItems) => {
        if (cancelled) return;
        setDrivers(driverItems);
        setErrorMessage(null);
        setLoading(false);

        // 2. Then try to fetch document data as enrichment
        listDriverDocumentsForCompany({ companyId })
          .then((docItems) => {
            if (cancelled) return;
            const map = new Map<string, DriverDocumentSummary>();
            for (const item of docItems) {
              map.set(item.driverId, item);
            }
            setDocSummaries(map);
          })
          .catch(() => {
            // Document fetch failed — not critical, drivers still show with "missing" status
          });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setErrorMessage(error instanceof Error ? error.message : "Şoför listesi yüklenemedi.");
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, refreshNonce, status]);

  /* ── Merge: drivers + document summaries ── */
  const summaries = useMemo(() => {
    if (!drivers) return [];
    return drivers.map((driver) => {
      const existing = docSummaries.get(driver.driverId);
      if (existing) return { ...existing, driverName: driver.name };
      return buildEmptySummary(driver);
    });
  }, [drivers, docSummaries]);

  /* ── Filtered + sorted ── */
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr");
    return summaries.filter((s) => {
      if (statusFilter !== "all" && s.overallStatus !== statusFilter) return false;
      if (!query) return true;
      return s.driverName.toLocaleLowerCase("tr").includes(query);
    });
  }, [summaries, searchQuery, statusFilter]);

  /* ── Metrics ── */
  const metrics = useMemo(() => {
    return {
      total: summaries.length,
      ok: summaries.filter((s) => s.overallStatus === "ok").length,
      warning: summaries.filter((s) => s.overallStatus === "warning").length,
      blocked: summaries.filter((s) => s.overallStatus === "blocked").length,
      missing: summaries.filter((s) => s.overallStatus === "missing").length,
    };
  }, [summaries]);

  /* ── Auto-select ── */
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedDriverId(null);
      return;
    }
    if (selectedDriverId && filtered.some((s) => s.driverId === selectedDriverId)) return;
    setSelectedDriverId(filtered[0]?.driverId ?? null);
  }, [filtered, selectedDriverId]);

  const selectedSummary = useMemo(
    () => filtered.find((s) => s.driverId === selectedDriverId) ?? null,
    [filtered, selectedDriverId],
  );

  /* ── Open edit form ── */
  const openEdit = useCallback(
    (doc: DriverDocumentItem) => {
      setEditingDocType(doc.docType);
      setDraftIssueDate(doc.issueDate ?? "");
      setDraftExpiryDate(doc.expiryDate ?? "");
      setDraftLicenseClass(doc.licenseClass ?? "");
      setDraftNote(doc.note ?? "");
    },
    [],
  );

  /* ── Save document ── */
  const handleSave = useCallback(
    async (docType: DriverDocType) => {
      if (!selectedDriverId) return;
      setSavingDocType(docType);
      setErrorMessage(null);
      try {
        await upsertDriverDocumentForCompany({
          companyId,
          driverId: selectedDriverId,
          docType,
          issueDate: draftIssueDate || undefined,
          expiryDate: draftExpiryDate || undefined,
          licenseClass: draftLicenseClass || undefined,
          note: draftNote || undefined,
        });
        setEditingDocType(null);
        setRefreshNonce((n) => n + 1);
        flashInfo(`${DOC_TYPE_LABELS[docType]} kaydedildi.`);
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Belge kaydedilemedi.");
      } finally {
        setSavingDocType(null);
      }
    },
    [companyId, selectedDriverId, draftIssueDate, draftExpiryDate, draftLicenseClass, draftNote, flashInfo],
  );

  /* ── Delete document ── */
  const handleDelete = useCallback(
    async (docType: DriverDocType) => {
      if (!selectedDriverId) return;
      if (!window.confirm(`${DOC_TYPE_LABELS[docType]} belgesini silmek istediğinize emin misiniz?`)) return;
      setDeletingDocType(docType);
      setErrorMessage(null);
      try {
        await deleteDriverDocumentForCompany({
          companyId,
          driverId: selectedDriverId,
          docType,
        });
        setRefreshNonce((n) => n + 1);
        flashInfo(`${DOC_TYPE_LABELS[docType]} silindi.`);
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Belge silinemedi.");
      } finally {
        setDeletingDocType(null);
      }
    },
    [companyId, selectedDriverId, flashInfo],
  );

  /* ── Loading ── */
  if (status !== "signed_in" || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {status !== "signed_in" ? "Oturum kontrol ediliyor…" : "Şoförler yükleniyor…"}
      </div>
    );
  }

  /* ── Error state ── */
  if (!drivers && errorMessage) {
    return (
      <div className="space-y-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => {
              setErrorMessage(null);
              setRefreshNonce((n) => n + 1);
            }}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty state: no drivers ── */
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-200 bg-white py-20">
        <div className="rounded-full bg-orange-50 p-4">
          <User className="h-8 w-8 text-orange-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">Henüz şoför kaydı bulunamadı</p>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Şoför Belgeler sayfasında, şoförlerinizin ehliyet, SRC, psikoteknik ve sağlık belgelerini takip edebilirsiniz.
            Önce <span className="font-semibold text-orange-600">Şoförler</span> sayfasından en az bir şoför
            hesabı oluşturun.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Messages ── */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 font-medium underline"
          >
            Kapat
          </button>
        </div>
      )}
      {infoMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {infoMessage}
        </div>
      )}

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Toplam Şoför", value: metrics.total, color: "text-zinc-700" },
          { label: "Tamam", value: metrics.ok, color: "text-emerald-600" },
          { label: "Uyarı", value: metrics.warning, color: "text-amber-500" },
          { label: "Engel", value: metrics.blocked, color: "text-red-500" },
          { label: "Eksik", value: metrics.missing, color: "text-zinc-400" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center"
          >
            <span className={`text-2xl font-bold ${m.color}`}>{m.value}</span>
            <p className="mt-0.5 text-xs text-zinc-500">{m.label}</p>
          </div>
        ))}
      </div>

      {/* ── Split pane ── */}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* ── Master list ── */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Şoför ara…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === opt.key
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[calc(100vh-340px)] space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2">
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-400">Sonuç bulunamadı.</p>
            )}
            {filtered.map((summary) => {
              const cfg = OVERALL_STATUS_CONFIG[summary.overallStatus];
              const Icon = cfg.icon;
              const isSelected = summary.driverId === selectedDriverId;
              return (
                <button
                  key={summary.driverId}
                  onClick={() => setSelectedDriverId(summary.driverId)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "bg-orange-50 ring-1 ring-orange-300"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${cfg.className}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800">
                      {summary.driverName}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${cfg.badgeColor}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="space-y-3">
          {!selectedSummary ? (
            <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white py-20 text-sm text-zinc-400">
              Bir şoför seçin
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4">
                {(() => {
                  const cfg = OVERALL_STATUS_CONFIG[selectedSummary.overallStatus];
                  const Icon = cfg.icon;
                  return <Icon className={`h-6 w-6 ${cfg.className}`} />;
                })()}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-800">
                    {selectedSummary.driverName}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      OVERALL_STATUS_CONFIG[selectedSummary.overallStatus].badgeColor
                    }`}
                  >
                    {OVERALL_STATUS_CONFIG[selectedSummary.overallStatus].label}
                  </span>
                </div>
              </div>

              {/* Document cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedSummary.documents.map((doc) => (
                  <DocumentCard
                    key={doc.docType}
                    doc={doc}
                    canWrite={canWrite}
                    isEditing={editingDocType === doc.docType}
                    isSaving={savingDocType === doc.docType}
                    isDeleting={deletingDocType === doc.docType}
                    draftIssueDate={draftIssueDate}
                    draftExpiryDate={draftExpiryDate}
                    draftLicenseClass={draftLicenseClass}
                    draftNote={draftNote}
                    onDraftIssueDateChange={setDraftIssueDate}
                    onDraftExpiryDateChange={setDraftExpiryDate}
                    onDraftLicenseClassChange={setDraftLicenseClass}
                    onDraftNoteChange={setDraftNote}
                    onEdit={() => openEdit(doc)}
                    onCancelEdit={() => setEditingDocType(null)}
                    onSave={() => handleSave(doc.docType)}
                    onDelete={() => handleDelete(doc.docType)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Document Card ─── */

const DOC_STATUS_STYLE: Record<
  string,
  { bg: string; border: string; icon: typeof CheckCircle2; iconClass: string; label: string }
> = {
  valid: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    label: "Geçerli",
  },
  expiring_soon: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    label: "Süresi Yaklaşıyor",
  },
  expired: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
    iconClass: "text-red-500",
    label: "Süresi Geçmiş",
  },
  not_uploaded: {
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    icon: CircleDashed,
    iconClass: "text-zinc-400",
    label: "Yüklenmemiş",
  },
};

function DocumentCard({
  doc,
  canWrite,
  isEditing,
  isSaving,
  isDeleting,
  draftIssueDate,
  draftExpiryDate,
  draftLicenseClass,
  draftNote,
  onDraftIssueDateChange,
  onDraftExpiryDateChange,
  onDraftLicenseClassChange,
  onDraftNoteChange,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  doc: DriverDocumentItem;
  canWrite: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  draftIssueDate: string;
  draftExpiryDate: string;
  draftLicenseClass: string;
  draftNote: string;
  onDraftIssueDateChange: (v: string) => void;
  onDraftExpiryDateChange: (v: string) => void;
  onDraftLicenseClassChange: (v: string) => void;
  onDraftNoteChange: (v: string) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const style = DOC_STATUS_STYLE[doc.status] ?? DOC_STATUS_STYLE.not_uploaded;
  const StatusIcon = style.icon;

  return (
    <div
      className={`rounded-xl border ${style.border} ${style.bg} p-4 transition-shadow hover:shadow-sm`}
    >
      {/* Title row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${style.iconClass}`} />
          <h4 className="text-sm font-semibold text-zinc-800">
            {DOC_TYPE_LABELS[doc.docType]}
          </h4>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            doc.status === "valid"
              ? "bg-emerald-100 text-emerald-700"
              : doc.status === "expiring_soon"
                ? "bg-amber-100 text-amber-700"
                : doc.status === "expired"
                  ? "bg-red-100 text-red-700"
                  : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {style.label}
        </span>
      </div>

      {isEditing ? (
        /* ── Edit form ── */
        <div className="space-y-2.5">
          {doc.docType === "ehliyet" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Ehliyet Sınıfı</label>
              <input
                type="text"
                value={draftLicenseClass}
                onChange={(e) => onDraftLicenseClassChange(e.target.value)}
                placeholder="Ör: B, C, D, E"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">İhraç Tarihi</label>
              <input
                type="date"
                value={draftIssueDate}
                onChange={(e) => onDraftIssueDateChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Bitiş Tarihi</label>
              <input
                type="date"
                value={draftExpiryDate}
                onChange={(e) => onDraftExpiryDateChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Not</label>
            <textarea
              value={draftNote}
              onChange={(e) => onDraftNoteChange(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="İsteğe bağlı not…"
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Kaydet
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100"
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        /* ── Display ── */
        <div className="space-y-1.5">
          {doc.status !== "not_uploaded" ? (
            <>
              {doc.licenseClass && (
                <p className="text-xs text-zinc-600">
                  <span className="font-medium">Sınıf:</span> {doc.licenseClass}
                </p>
              )}
              <p className="text-xs text-zinc-600">
                <span className="font-medium">İhraç:</span> {formatDate(doc.issueDate)}
              </p>
              <p className="text-xs text-zinc-600">
                <span className="font-medium">Bitiş:</span> {formatDate(doc.expiryDate)}
              </p>
              {doc.daysRemaining !== null && (
                <p
                  className={`text-xs font-medium ${
                    doc.status === "expired"
                      ? "text-red-600"
                      : doc.status === "expiring_soon"
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  {daysRemainingLabel(doc.daysRemaining)}
                </p>
              )}
              {doc.note && (
                <p className="text-xs text-zinc-500 italic">Not: {doc.note}</p>
              )}
            </>
          ) : (
            <p className="py-2 text-xs text-zinc-400">Belge henüz eklenmemiş.</p>
          )}

          {canWrite && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onEdit}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
              >
                {doc.status === "not_uploaded" ? "Ekle" : "Düzenle"}
              </button>
              {doc.status !== "not_uploaded" && (
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Sil
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
