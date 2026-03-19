import type {
  CompanyInviteStatus,
  CompanyMemberRole,
} from "@/features/company/company-client";

export const ROLE_OPTIONS: CompanyMemberRole[] = ["owner", "admin", "dispatcher", "viewer"];

export const ROLE_LABELS: Record<CompanyMemberRole, string> = {
  owner: "Sahip",
  admin: "Yönetici",
  dispatcher: "Operasyon",
  viewer: "Goruntuleyici",
};

export const INVITE_STATUS_LABELS: Record<CompanyInviteStatus, string> = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  declined: "Reddedildi",
  revoked: "Iptal Edildi",
};

export const MEMBER_STATUS_LABELS: Record<"active" | "invited" | "suspended", string> = {
  active: "Aktif",
  invited: "Davetli",
  suspended: "Askida",
};

export function formatUid(uid: string): string {
  if (uid.length <= 18) {
    return uid;
  }
  return `${uid.slice(0, 8)}...${uid.slice(-6)}`;
}

export function getInviteStatusTone(status: CompanyInviteStatus): string {
  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "accepted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "declined") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function getInviteRoleOptions(actorRole: CompanyMemberRole | null): CompanyMemberRole[] {
  if (actorRole === "owner") {
    return ROLE_OPTIONS;
  }
  if (actorRole === "admin") {
    return ["dispatcher", "viewer"];
  }
  return [];
}

export function getEditableRoleOptions(
  actorRole: CompanyMemberRole | null,
  targetRole: CompanyMemberRole,
): CompanyMemberRole[] {
  if (actorRole === "owner") {
    return ROLE_OPTIONS;
  }
  if (actorRole === "admin") {
    if (targetRole === "owner") {
      return [targetRole];
    }
    return ["dispatcher", "viewer"];
  }
  return [];
}

export function getRoleLockReason(
  actorRole: CompanyMemberRole | null,
  targetRole: CompanyMemberRole,
  allowedRoleOptions: CompanyMemberRole[],
): string {
  if (allowedRoleOptions.length === 0) {
    return "Bu uye rolunu guncellemek için sahip veya yönetici yetkisi gerekir.";
  }
  if (allowedRoleOptions.length === 1 && allowedRoleOptions[0] === targetRole) {
    if (actorRole === "admin" && targetRole === "owner") {
      return "Yönetici rolu, sahip kullanicilarin rolunu degistiremez.";
    }
    return "Bu uye için degisebilecek tek rol mevcut rol.";
  }
  return "Rol guncelleme bu uye için acik.";
}

