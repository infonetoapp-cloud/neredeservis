"use client";

import { FirebaseError } from "firebase/app";

import { getCallableErrorCode } from "@/lib/firebase/callable";

function getRawCallableMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return error.message;
  }
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
}

function isUpgradeRequiredSignal(rawMessage: string): boolean {
  return (
    rawMessage.includes("UPGRADE_REQUIRED") ||
    rawMessage.includes("FORCE_UPDATE_REQUIRED") ||
    rawMessage.includes("426")
  );
}

export function isCompanyCallableConflictError(error: unknown): boolean {
  const code = getCallableErrorCode(error);
  if (code !== "functions/failed-precondition") return false;
  const rawMessage = getRawCallableMessage(error);
  return (
    rawMessage.includes("UPDATE_TOKEN_MISMATCH") ||
    rawMessage.includes("ROUTE_STOP_INVALID_STATE") ||
    rawMessage.includes("ROUTE_STOP_REORDER_STATE_INVALID")
  );
}

export function mapCompanyCallableErrorToMessage(error: unknown): string {
  const code = getCallableErrorCode(error);
  const rawMessage = getRawCallableMessage(error);
  if (rawMessage.includes("CONTRACT_MISMATCH")) {
    return "Sunucu yaniti beklenen formatta degil. Sayfayi yenileyip tekrar deneyin.";
  }
  if (!code) {
    return "Beklenmeyen bir hata olustu. Tekrar deneyin.";
  }

  if (isUpgradeRequiredSignal(rawMessage)) {
    return "Uygulama surumu guncellenmeli. Lutfen cikis yapip en guncel surum ile tekrar giris yapin.";
  }

  switch (code) {
    case "functions/unauthenticated":
      return "Oturum bulunamadi. Lutfen tekrar giris yapin.";
    case "functions/permission-denied":
      return "Bu islem icin yetkin yok.";
    case "functions/failed-precondition":
      if (rawMessage.includes("INVITE_EMAIL_NOT_FOUND")) {
        return "Bu e-posta ile kayitli kullanici bulunamadi.";
      }
      if (rawMessage.includes("INVITE_NOT_ACCEPTABLE")) {
        return "Bu davet su an kabul edilemez durumda.";
      }
      if (rawMessage.includes("INVITE_NOT_DECLINABLE")) {
        return "Bu davet su an reddedilemez durumda.";
      }
      if (rawMessage.includes("OWNER_MEMBER_IMMUTABLE")) {
        return "Owner kaydi bu panelden degistirilemez.";
      }
      if (rawMessage.includes("SELF_MEMBER_REMOVE_FORBIDDEN")) {
        return "Kendi uyeliginizi bu panelden kaldiramazsiniz.";
      }
      if (rawMessage.includes("ROUTE_PRIMARY_DRIVER_IMMUTABLE")) {
        return "Rota ana surucusunun yetkisi bu akisla kaldirilamaz.";
      }
      if (rawMessage.includes("UPDATE_TOKEN_MISMATCH")) {
        return "Kayit baska bir oturumda guncellendi. Liste yenilendi; lutfen tekrar deneyin.";
      }
      if (rawMessage.includes("ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED")) {
        return "Aktif sefer varken rota yapisi degistirilemez. Sefer bitince tekrar deneyin.";
      }
      if (rawMessage.includes("ROUTE_STOP_INVALID_STATE")) {
        return "Durak listesi guncel degil. Liste yenilendi; lutfen tekrar deneyin.";
      }
      if (rawMessage.includes("ROUTE_STOP_REORDER_STATE_INVALID")) {
        return "Durak sirasi guncel degil. Liste yenilendi; lutfen tekrar deneyin.";
      }
      return "Bu islem su an tamamlanamiyor. Lutfen tekrar deneyin.";
    case "functions/invalid-argument":
      if (rawMessage.includes("TENANT_STATE_NO_CHANGES")) {
        return "Degistirilecek alan secilmedi. En az bir tenant alanini guncelleyin.";
      }
      return "Girilen bilgiler gecerli degil.";
    case "functions/already-exists":
      return "Ayni kayit zaten mevcut.";
    default:
      if (error instanceof FirebaseError && error.message) {
        return error.message;
      }
      return "Islem tamamlanamadi. Lutfen tekrar deneyin.";
  }
}
