"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Car,
  Download,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Truck,
  Upload,
  Users,
  CheckCircle2,
  AlertCircle,
  FileDown,
  X,
  ArrowRight,
} from "lucide-react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  listCompanyVehiclesForCompany,
  listCompanyRoutesForCompany,
  listCompanyDriversForCompany,
  listCompanyMembersForCompany,
  createCompanyVehicleForCompany,
  createCompanyDriverAccountForCompany,
  inviteCompanyMemberByEmailForCompany,
  type CompanyVehicleItem,
  type CompanyRouteItem,
  type CompanyDriverItem,
  type CompanyMemberItem,
  type CompanyMemberRole,
} from "@/features/company/company-client";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type CardStatus = "idle" | "loading" | "done" | "error";

interface CardDef {
  id: string;
  title: string;
  description: string;
  icon: typeof Car;
  accentClass: string;
  iconBgClass: string;
  importable: boolean;
}

interface ImportPreview {
  cardId: string;
  headers: string[];
  rows: string[][];
  errors: string[];
}

interface ImportProgress {
  total: number;
  done: number;
  succeeded: number;
  failed: number;
  errors: string[];
  finished: boolean;
}

/* ================================================================== */
/*  Card definitions                                                   */
/* ================================================================== */

const CARDS: CardDef[] = [
  {
    id: "vehicles",
    title: "Araçlar",
    description: "Plaka, marka, model, yıl, kapasite ve durum bilgileri.",
    icon: Car,
    accentClass: "text-teal-700",
    iconBgClass: "bg-teal-100",
    importable: true,
  },
  {
    id: "routes",
    title: "Rotalar",
    description: "Güzergah adı, sefer kodu, saat, araç ve yolcu sayısı.",
    icon: MapPin,
    accentClass: "text-sky-700",
    iconBgClass: "bg-sky-100",
    importable: false,
  },
  {
    id: "drivers",
    title: "Şoförler",
    description: "Şoför adı, telefon, plaka bilgileri.",
    icon: Truck,
    accentClass: "text-amber-700",
    iconBgClass: "bg-amber-100",
    importable: true,
  },
  {
    id: "members",
    title: "Üyeler",
    description: "E-posta ile toplu davet gönderimi.",
    icon: Users,
    accentClass: "text-violet-700",
    iconBgClass: "bg-violet-100",
    importable: true,
  },
];

/* ================================================================== */
/*  CSV Utilities                                                      */
/* ================================================================== */

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF";
  const csvContent =
    bom +
    [headers.map(escapeCSV).join(",")]
      .concat(rows.map((row) => row.map(escapeCSV).join(",")))
      .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCSVText(text: string): string[][] {
  // Strip BOM
  const clean = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  const row: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && clean[i + 1] === "\n") i++;
        row.push(current.trim());
        if (row.some((c) => c !== "")) rows.push([...row]);
        row.length = 0;
        current = "";
      } else {
        current += ch;
      }
    }
  }
  // Last row
  row.push(current.trim());
  if (row.some((c) => c !== "")) rows.push([...row]);

  return rows;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/* ================================================================== */
/*  Templates                                                          */
/* ================================================================== */

interface TemplateSpec {
  headers: string[];
  examples: string[][];
  fileName: string;
}

const TEMPLATES: Record<string, TemplateSpec> = {
  vehicles: {
    headers: ["Plaka", "Marka", "Model", "Yıl", "Kapasite"],
    examples: [
      ["34 ABC 123", "Mercedes", "Sprinter", "2022", "16"],
      ["06 XY 456", "Ford", "Transit", "2021", "14"],
    ],
    fileName: "arac_sablonu.csv",
  },
  drivers: {
    headers: ["Şoför Adı", "Telefon", "Plaka"],
    examples: [
      ["Ahmet Yılmaz", "+905551234567", "34 ABC 123"],
      ["Mehmet Kaya", "+905559876543", "06 XY 456"],
    ],
    fileName: "sofor_sablonu.csv",
  },
  members: {
    headers: ["E-posta", "Rol"],
    examples: [
      ["operator@sirket.com", "dispatcher"],
      ["izleyici@sirket.com", "viewer"],
    ],
    fileName: "uye_sablonu.csv",
  },
};

/* ================================================================== */
/*  Export CSV builders                                                 */
/* ================================================================== */

function buildVehicleCSV(items: CompanyVehicleItem[]) {
  const headers = [
    "Plaka",
    "Marka",
    "Model",
    "Yıl",
    "Kapasite",
    "Durum",
    "Oluşturulma",
  ];
  const statusMap: Record<string, string> = {
    active: "Aktif",
    maintenance: "Bakımda",
    inactive: "Pasif",
  };
  const rows = items.map((v) => [
    v.plate,
    v.brand ?? "",
    v.model ?? "",
    v.year != null ? String(v.year) : "",
    v.capacity != null ? String(v.capacity) : "",
    statusMap[v.status] ?? v.status,
    formatDate(v.createdAt),
  ]);
  return { headers, rows };
}

function buildRouteCSV(items: CompanyRouteItem[]) {
  const headers = [
    "Rota Adı",
    "Sefer Kodu",
    "Sefer Saati",
    "Zaman Dilimi",
    "Yolcu Sayısı",
    "Araç Plakası",
    "Başlangıç",
    "Bitiş",
    "Misafir Takip",
    "Arşivlenmiş",
  ];
  const timeSlotMap: Record<string, string> = {
    morning: "Sabah",
    evening: "Akşam",
    midday: "Öğle",
    custom: "Özel",
  };
  const rows = items.map((r) => [
    r.name,
    r.srvCode ?? "",
    r.scheduledTime ?? "",
    r.timeSlot ? (timeSlotMap[r.timeSlot] ?? r.timeSlot) : "",
    String(r.passengerCount),
    r.vehiclePlate ?? "",
    r.startAddress ?? "",
    r.endAddress ?? "",
    r.allowGuestTracking ? "Evet" : "Hayır",
    r.isArchived ? "Evet" : "Hayır",
  ]);
  return { headers, rows };
}

function buildDriverCSV(items: CompanyDriverItem[]) {
  const headers = [
    "Şoför Adı",
    "Plaka",
    "Durum",
    "Atanma Durumu",
    "Atanan Rotalar",
    "Son Görülme",
  ];
  const rows = items.map((d) => [
    d.name,
    d.plateMasked,
    d.status === "active" ? "Aktif" : "Pasif",
    d.assignmentStatus === "assigned" ? "Atanmış" : "Atanmamış",
    d.assignedRoutes.map((r) => r.routeName).join("; "),
    formatDate(d.lastSeenAt),
  ]);
  return { headers, rows };
}

function buildMemberCSV(items: CompanyMemberItem[]) {
  const headers = ["Ad Soyad", "E-posta", "Telefon", "Rol", "Durum", "Kayıt Tarihi"];
  const roleMap: Record<string, string> = {
    owner: "Sahip",
    admin: "Yönetici",
    dispatcher: "Operatör",
    viewer: "İzleyici",
  };
  const statusMap: Record<string, string> = {
    active: "Aktif",
    invited: "Davet Edildi",
    suspended: "Askıda",
  };
  const rows = items.map((m) => [
    m.displayName ?? "",
    m.email ?? "",
    m.phone ?? "",
    roleMap[m.role] ?? m.role,
    statusMap[m.status] ?? m.status,
    formatDate(m.createdAt),
  ]);
  return { headers, rows };
}

/* ================================================================== */
/*  Import validators                                                  */
/* ================================================================== */

const VALID_ROLES = new Set(["admin", "dispatcher", "viewer"]);

function validateVehicleRows(rows: string[][]): string[] {
  const errors: string[] = [];
  rows.forEach((row, i) => {
    const plate = row[0]?.trim();
    if (!plate) errors.push(`Satır ${i + 1}: Plaka boş olamaz.`);
    const year = row[3]?.trim();
    if (year && (isNaN(Number(year)) || Number(year) < 1900 || Number(year) > 2100)) {
      errors.push(`Satır ${i + 1}: Geçersiz yıl "${year}".`);
    }
    const capacity = row[4]?.trim();
    if (capacity && (isNaN(Number(capacity)) || Number(capacity) < 1)) {
      errors.push(`Satır ${i + 1}: Geçersiz kapasite "${capacity}".`);
    }
  });
  return errors;
}

function validateDriverRows(rows: string[][]): string[] {
  const errors: string[] = [];
  rows.forEach((row, i) => {
    const name = row[0]?.trim();
    if (!name) errors.push(`Satır ${i + 1}: Şoför adı boş olamaz.`);
  });
  return errors;
}

function validateMemberRows(rows: string[][]): string[] {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  rows.forEach((row, i) => {
    const email = row[0]?.trim();
    if (!email) {
      errors.push(`Satır ${i + 1}: E-posta boş olamaz.`);
    } else if (!emailRegex.test(email)) {
      errors.push(`Satır ${i + 1}: Geçersiz e-posta "${email}".`);
    }
    const role = row[1]?.trim().toLowerCase();
    if (!role) {
      errors.push(`Satır ${i + 1}: Rol boş olamaz.`);
    } else if (!VALID_ROLES.has(role)) {
      errors.push(
        `Satır ${i + 1}: Geçersiz rol "${role}". Geçerli: admin, dispatcher, viewer.`,
      );
    }
  });
  return errors;
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

type Props = { companyId: string };

export function CompanyExportPanel({ companyId }: Props) {
  const { status } = useAuthSession();

  /* ── export/download states ── */
  const [cardStates, setCardStates] = useState<
    Record<string, { status: CardStatus; count?: number; error?: string }>
  >({});

  /* ── import states ── */
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* ── helpers ── */
  const setCardStatus = useCallback(
    (id: string, s: CardStatus, extra?: { count?: number; error?: string }) => {
      setCardStates((prev) => ({
        ...prev,
        [id]: { status: s, count: extra?.count, error: extra?.error },
      }));
    },
    [],
  );

  /* ── export handler ── */
  const handleExport = useCallback(
    async (cardId: string) => {
      if (status !== "signed_in") return;
      setCardStatus(cardId, "loading");
      try {
        const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        switch (cardId) {
          case "vehicles": {
            const items = await listCompanyVehiclesForCompany({ companyId });
            const d = buildVehicleCSV(items);
            downloadCSV(`araclar_${ts}.csv`, d.headers, d.rows);
            setCardStatus(cardId, "done", { count: items.length });
            break;
          }
          case "routes": {
            const items = await listCompanyRoutesForCompany({ companyId });
            const d = buildRouteCSV(items);
            downloadCSV(`rotalar_${ts}.csv`, d.headers, d.rows);
            setCardStatus(cardId, "done", { count: items.length });
            break;
          }
          case "drivers": {
            const items = await listCompanyDriversForCompany({ companyId });
            const d = buildDriverCSV(items);
            downloadCSV(`soforler_${ts}.csv`, d.headers, d.rows);
            setCardStatus(cardId, "done", { count: items.length });
            break;
          }
          case "members": {
            const items = await listCompanyMembersForCompany({ companyId });
            const d = buildMemberCSV(items);
            downloadCSV(`uyeler_${ts}.csv`, d.headers, d.rows);
            setCardStatus(cardId, "done", { count: items.length });
            break;
          }
        }
        setTimeout(() => {
          setCardStates((prev) => {
            const c = prev[cardId];
            return c?.status === "done" ? { ...prev, [cardId]: { status: "idle" } } : prev;
          });
        }, 5000);
      } catch (error: unknown) {
        setCardStatus(cardId, "error", {
          error: error instanceof Error ? error.message : "İndirme başarısız.",
        });
      }
    },
    [companyId, status, setCardStatus],
  );

  /* ── template download ── */
  const handleTemplateDownload = useCallback((cardId: string) => {
    const tpl = TEMPLATES[cardId];
    if (!tpl) return;
    downloadCSV(tpl.fileName, tpl.headers, tpl.examples);
  }, []);

  /* ── file upload → preview ── */
  const handleFileSelect = useCallback(
    (cardId: string, e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset input
      const input = fileInputRefs.current[cardId];
      if (input) input.value = "";

      if (!file) return;
      if (!file.name.endsWith(".csv")) {
        setCardStatus(cardId, "error", { error: "Yalnızca CSV dosyaları kabul edilir." });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const parsed = parseCSVText(text);

        if (parsed.length < 2) {
          setCardStatus(cardId, "error", {
            error: "CSV dosyasında en az 1 başlık ve 1 veri satırı olmalıdır.",
          });
          return;
        }

        const tpl = TEMPLATES[cardId];
        if (!tpl) return;

        // Check header match
        const fileHeaders = parsed[0]!;
        const expectedLen = tpl.headers.length;
        const headerMatch = tpl.headers.every(
          (h, i) => fileHeaders[i]?.toLowerCase() === h.toLowerCase(),
        );

        if (!headerMatch) {
          setCardStatus(cardId, "error", {
            error: `Başlık uyumsuz. Beklenen: ${tpl.headers.join(", ")}`,
          });
          return;
        }

        const dataRows = parsed.slice(1);

        // Validate
        let errors: string[] = [];
        switch (cardId) {
          case "vehicles":
            errors = validateVehicleRows(dataRows);
            break;
          case "drivers":
            errors = validateDriverRows(dataRows);
            break;
          case "members":
            errors = validateMemberRows(dataRows);
            break;
        }

        // Limit to first 5 validation errors in preview
        setImportPreview({
          cardId,
          headers: tpl.headers,
          rows: dataRows,
          errors: errors.slice(0, 8),
        });
        setImportProgress(null);
      };
      reader.readAsText(file, "utf-8");
    },
    [setCardStatus],
  );

  /* ── run import ── */
  const handleImport = useCallback(async () => {
    if (!importPreview || importPreview.errors.length > 0) return;
    const { cardId, rows } = importPreview;

    const progress: ImportProgress = {
      total: rows.length,
      done: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      finished: false,
    };
    setImportProgress({ ...progress });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        switch (cardId) {
          case "vehicles": {
            const plate = row[0]?.trim() ?? "";
            const brand = row[1]?.trim() || undefined;
            const model = row[2]?.trim() || undefined;
            const yearStr = row[3]?.trim();
            const capStr = row[4]?.trim();
            await createCompanyVehicleForCompany({
              companyId,
              plate,
              brand: brand ?? null,
              model: model ?? null,
              year: yearStr ? Number(yearStr) : null,
              capacity: capStr ? Number(capStr) : undefined,
            });
            break;
          }
          case "drivers": {
            const name = row[0]?.trim() ?? "";
            const phone = row[1]?.trim() || undefined;
            const plate = row[2]?.trim() || undefined;
            await createCompanyDriverAccountForCompany({
              companyId,
              name,
              phone,
              plate,
            });
            break;
          }
          case "members": {
            const email = row[0]?.trim() ?? "";
            const role = (row[1]?.trim().toLowerCase() ?? "viewer") as CompanyMemberRole;
            await inviteCompanyMemberByEmailForCompany({
              companyId,
              email,
              role,
            });
            break;
          }
        }
        progress.succeeded++;
      } catch (error: unknown) {
        progress.failed++;
        const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
        progress.errors.push(`Satır ${i + 1}: ${msg}`);
      }
      progress.done++;
      setImportProgress({ ...progress });
    }

    progress.finished = true;
    setImportProgress({ ...progress });
  }, [importPreview, companyId]);

  /* ── close modal ── */
  const closePreview = useCallback(() => {
    setImportPreview(null);
    setImportProgress(null);
  }, []);

  /* ── card title map for modal ── */
  const cardTitleMap: Record<string, string> = {
    vehicles: "Araçlar",
    drivers: "Şoförler",
    members: "Üyeler",
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-5 py-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
          <div>
            <p className="text-sm font-medium text-teal-800">
              Dışa &amp; içe aktarma
            </p>
            <p className="mt-0.5 text-xs text-teal-600">
              Verileri CSV olarak indirin veya şablon dosyayı doldurup toplu veri
              yükleyin. Şablonları indirip örnek satırları inceledikten sonra kendi
              verilerinizle doldurun.
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => {
          const state = cardStates[card.id] ?? { status: "idle" as CardStatus };
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              {/* Icon + title */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${card.iconBgClass}`}
                >
                  <Icon className={`h-5 w-5 ${card.accentClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900">{card.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <div className="mt-3 min-h-[1.5rem]">
                {state.status === "done" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {state.count} kayıt indirildi
                  </span>
                )}
                {state.status === "error" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {state.error}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Download CSV */}
                <ActionBtn
                  disabled={state.status === "loading"}
                  onClick={() => handleExport(card.id)}
                  icon={
                    state.status === "loading" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )
                  }
                  label={state.status === "loading" ? "Hazırlanıyor…" : "CSV İndir"}
                />

                {/* Import buttons */}
                {card.importable && (
                  <>
                    <ActionBtn
                      onClick={() => handleTemplateDownload(card.id)}
                      icon={<FileDown className="h-3.5 w-3.5" />}
                      label="Şablon"
                      subtle
                    />
                    <ActionBtn
                      onClick={() => fileInputRefs.current[card.id]?.click()}
                      icon={<Upload className="h-3.5 w-3.5" />}
                      label="CSV Yükle"
                      accent
                    />
                    <input
                      ref={(el) => {
                        fileInputRefs.current[card.id] = el;
                      }}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileSelect(card.id, e)}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-zinc-400">
        Periyodik otomatik rapor gönderimi ve PDF dışa aktarma yakında eklenecektir.
      </p>

      {/* ─── Import Preview Modal ─── */}
      {importPreview && (
        <ImportModal
          preview={importPreview}
          progress={importProgress}
          cardTitle={cardTitleMap[importPreview.cardId] ?? importPreview.cardId}
          onImport={handleImport}
          onClose={closePreview}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Action Button                                                      */
/* ================================================================== */

function ActionBtn({
  onClick,
  icon,
  label,
  disabled,
  subtle,
  accent,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  subtle?: boolean;
  accent?: boolean;
}) {
  let cls =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50";

  if (accent) {
    cls += " border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100";
  } else if (subtle) {
    cls += " border border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700";
  } else {
    cls += " border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300";
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cls}>
      {icon}
      {label}
    </button>
  );
}

/* ================================================================== */
/*  Import Modal                                                       */
/* ================================================================== */

function ImportModal({
  preview,
  progress,
  cardTitle,
  onImport,
  onClose,
}: {
  preview: ImportPreview;
  progress: ImportProgress | null;
  cardTitle: string;
  onImport: () => void;
  onClose: () => void;
}) {
  const hasErrors = preview.errors.length > 0;
  const isImporting = progress !== null && !progress.finished;
  const isFinished = progress?.finished === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {cardTitle} — İçe Aktarma
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {preview.rows.length} satır bulundu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-auto px-6 py-4">
          {/* Validation errors */}
          {hasErrors && (
            <div className="mb-4 space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                Dosyada {preview.errors.length} hata bulundu
              </p>
              {preview.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">
                  {err}
                </p>
              ))}
              <p className="pt-1 text-xs text-red-500">
                Lütfen dosyayı düzeltip tekrar yükleyin.
              </p>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="mb-4 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-300"
                    style={{
                      width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-zinc-600">
                  {progress.done}/{progress.total}
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-600">
                  <CheckCircle2 className="mr-1 inline h-3 w-3" />
                  {progress.succeeded} başarılı
                </span>
                {progress.failed > 0 && (
                  <span className="text-red-600">
                    <AlertCircle className="mr-1 inline h-3 w-3" />
                    {progress.failed} hatalı
                  </span>
                )}
              </div>

              {/* Errors */}
              {progress.errors.length > 0 && (
                <div className="mt-1 max-h-24 overflow-auto text-xs text-red-600">
                  {progress.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}

              {/* Finished */}
              {isFinished && (
                <p className="text-sm font-medium text-emerald-700">
                  İçe aktarma tamamlandı.
                </p>
              )}
            </div>
          )}

          {/* Preview table */}
          {!progress && (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-3 py-2 font-medium text-zinc-500">#</th>
                    {preview.headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-medium text-zinc-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-zinc-50 last:border-0">
                      <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                      {preview.headers.map((_, ci) => (
                        <td key={ci} className="px-3 py-2 text-zinc-700">
                          {row[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {preview.rows.length > 50 && (
                    <tr>
                      <td
                        colSpan={preview.headers.length + 1}
                        className="px-3 py-2 text-center text-zinc-400"
                      >
                        … ve {preview.rows.length - 50} satır daha
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          {isFinished ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Kapat
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={onImport}
                disabled={hasErrors || isImporting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                {isImporting
                  ? `${progress?.done ?? 0}/${progress?.total ?? 0}`
                  : `${preview.rows.length} kayıt içe aktar`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

