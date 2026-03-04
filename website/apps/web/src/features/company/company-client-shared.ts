"use client";

export type CompanyMemberRole = "owner" | "admin" | "dispatcher" | "viewer";
export type CompanyMembershipStatus = "active" | "invited" | "suspended";
export type CompanyStatus = "active" | "suspended" | "archived";
export type CompanyBillingStatus = "active" | "past_due" | "suspended_locked";

export type CompanyMembershipItem = {
  companyId: string;
  companyName: string;
  memberRole: CompanyMemberRole;
  membershipStatus: CompanyMembershipStatus;
  companyStatus: CompanyStatus;
  billingStatus: CompanyBillingStatus;
};

export type CompanyMemberItem = {
  uid: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  role: CompanyMemberRole;
  status: CompanyMembershipStatus;
  companyId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CompanyDriverItem = {
  driverId: string;
  name: string;
  plateMasked: string;
  status: "active" | "passive";
  assignmentStatus: "assigned" | "unassigned";
  lastSeenAt: string | null;
  phoneMasked: string | null;
  assignedRoutes: Array<{
    routeId: string;
    routeName: string;
    scheduledTime: string | null;
  }>;
};

export type CompanyDriverCredentialBundle = {
  driverId: string;
  name: string;
  loginEmail: string;
  temporaryPassword: string;
  mobileOnly: boolean;
  createdAt: string | null;
};

export type CompanyInviteStatus = "pending" | "accepted" | "declined" | "revoked";

export type CompanyInviteItem = {
  inviteId: string;
  companyId: string;
  companyName: string;
  email: string;
  role: CompanyMemberRole;
  status: CompanyInviteStatus;
  targetUid: string | null;
  invitedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type VehicleStatus = "active" | "maintenance" | "inactive";

export type CompanyVehicleItem = {
  vehicleId: string;
  companyId: string | null;
  plate: string;
  status: VehicleStatus;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  /** Computed: brand + model or plate fallback */
  label: string | null;
  /** Computed: status === 'active' */
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CompanyRouteTimeSlot = "morning" | "evening" | "midday" | "custom" | null;

export type CompanyRouteItem = {
  routeId: string;
  companyId: string | null;
  name: string;
  srvCode: string | null;
  scheduledTime: string | null;
  timeSlot: CompanyRouteTimeSlot;
  driverId: string | null;
  authorizedDriverIds: string[];
  vehicleId: string | null;
  vehiclePlate: string | null;
  allowGuestTracking: boolean;
  isArchived: boolean;
  startAddress: string | null;
  endAddress: string | null;
  passengerCount: number;
  updatedAt: string | null;
};

export type CompanyRouteStopItem = {
  stopId: string;
  routeId: string | null;
  companyId: string | null;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CompanyLiveOpsStatus = "live" | "stale" | "no_signal" | "idle";

export type CompanyLiveOpsItem = {
  routeId: string;
  routeName: string;
  routeUpdatedAt: string | null;
  scheduledTime: string | null;
  timeSlot: CompanyRouteTimeSlot;
  passengerCount: number;
  tripId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  locationTimestampMs: number | null;
  status: CompanyLiveOpsStatus;
};

export type CompanyLiveOpsSnapshot = {
  companyId: string;
  generatedAt: string | null;
  items: CompanyLiveOpsItem[];
};

export type ApiOk<T> = {
  data?: T;
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readMemberRole(value: unknown): CompanyMemberRole | null {
  if (value === "owner" || value === "admin" || value === "dispatcher" || value === "viewer") {
    return value;
  }
  return null;
}

function readMembershipStatus(value: unknown): CompanyMembershipStatus | null {
  if (value === "active" || value === "invited" || value === "suspended") {
    return value;
  }
  return null;
}

function readCompanyStatus(value: unknown): CompanyStatus | null {
  if (value === "active" || value === "suspended" || value === "archived") {
    return value;
  }
  return null;
}

function readCompanyBillingStatus(value: unknown): CompanyBillingStatus | null {
  if (value === "active" || value === "past_due" || value === "suspended_locked") {
    return value;
  }
  return null;
}

function readInviteStatus(value: unknown): CompanyInviteStatus | null {
  if (value === "pending" || value === "accepted" || value === "declined" || value === "revoked") {
    return value;
  }
  return null;
}

export function toFriendlyErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : "";
  const maybeCode =
    (asRecord(error)?.code as string | undefined) ??
    (asRecord(asRecord(error)?.customData)?.code as string | undefined);
  const reasonMap: Array<{ reason: string; message: string }> = [
    { reason: "COMPANY_SUSPENDED", message: "Sirket hesabi askiya alinmis. Destek ile iletisime gec." },
    { reason: "COMPANY_BILLING_LOCKED", message: "Sirket fatura kilidi nedeniyle isleme kapali." },
    { reason: "COMPANY_ARCHIVED", message: "Sirket arsivlendiginden bu islem acik degil." },
    { reason: "ROLE_NOT_ALLOWED", message: "Bu islem icin rol yetkin yok." },
    { reason: "LAST_OWNER_PROTECTION", message: "Sirkette en az bir owner kalmali." },
    { reason: "COMPANY_MEMBER_NOT_FOUND", message: "Uye kaydi bulunamadi." },
    { reason: "COMPANY_MEMBER_NOT_ACTIVE", message: "Uye aktif olmadigi icin islem yapilamiyor." },
    { reason: "COMPANY_INVITE_NOT_FOUND", message: "Davet kaydi bulunamadi." },
    { reason: "COMPANY_INVITE_REVOKED", message: "Davet daha once iptal edilmis." },
    { reason: "COMPANY_INVITE_NOT_TARGETED", message: "Bu davet bu hesap icin degil." },
    { reason: "COMPANY_INVITE_INVALID_STATE", message: "Davet durumu bu islem icin uygun degil." },
    { reason: "SELF_INVITE_NOT_ALLOWED", message: "Kendine davet gonderemezsin." },
    { reason: "TENANT_MISMATCH", message: "Bu kayit aktif sirket baglamina ait degil." },
    { reason: "COMPANY_DRIVER_TENANT_MISMATCH", message: "Secilen soforlerin tamami bu sirkete ait olmali." },
    { reason: "COMPANY_ROUTE_NOT_FOUND", message: "Rota bulunamadi." },
    { reason: "COMPANY_ROUTE_OWNER_UNASSIGN_FORBIDDEN", message: "Rota sahibi bu listeden cikarilamaz." },
    { reason: "DRIVER_LOGIN_EMAIL_IN_USE", message: "Bu giris e-postasi zaten baska bir hesapta kullaniliyor." },
    { reason: "COMPANY_DRIVER_ALREADY_EXISTS", message: "Bu sofor hesabi zaten olusturulmus." },
    { reason: "COMPANY_VEHICLE_NOT_FOUND", message: "Arac bulunamadi." },
    { reason: "COMPANY_VEHICLE_INVALID_STATE", message: "Arac kaydi gecerli durumda degil." },
    { reason: "ACTIVE_TRIP_STOP_MUTATION_LOCK", message: "Aktif sefer varken durak sirasi/silme degisikligi kilitli." },
    { reason: "INDIVIDUAL_MODE_DISABLED_FOR_COMPANY_MEMBERS", message: "Company kullanicilarinda bireysel mod kapali." },
  ];
  if (maybeCode === "functions/unauthenticated") {
    return "Oturum bulunamadi. Tekrar giris yap.";
  }
  for (const item of reasonMap) {
    if (rawMessage.includes(item.reason)) {
      return item.message;
    }
  }
  if (maybeCode === "functions/permission-denied") {
    return "Bu islem icin yetkin yok.";
  }
  if (maybeCode === "functions/invalid-argument") {
    if (rawMessage.includes("authorizedDriverIds")) {
      return "Secilen sofor listesi gecerli degil. Sofor atamasini sofor ekranindan yapabilirsin.";
    }
    if (rawMessage.includes("scheduledTime")) {
      return "Saat bilgisi gecerli formatta degil. Lutfen HH:mm formatinda gir.";
    }
    if (rawMessage.includes("startPoint") || rawMessage.includes("endPoint")) {
      return "Baslangic ve bitis konumunu listeden secerek tekrar dene.";
    }
    if (rawMessage.trim().length > 0) {
      return "Gonderilen bilgilerde eksik veya gecersiz alan var. Formu kontrol edip tekrar dene.";
    }
    return "Gonderilen veri formati gecersiz.";
  }
  if (maybeCode === "functions/not-found") {
    return "Kayit bulunamadi.";
  }
  if (maybeCode === "functions/failed-precondition") {
    return "Islem kosullari saglanmadigi icin tamamlanamadi.";
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Beklenmeyen bir islem hatasi olustu.";
}

export function parseMembershipItems(value: unknown): CompanyMembershipItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyMembershipItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }

    const companyId = readString(record.companyId);
    const companyName = readString(record.companyName);
    const memberRole = readMemberRole(record.memberRole);
    const membershipStatus = readMembershipStatus(record.membershipStatus);
    const companyStatus = readCompanyStatus(record.companyStatus) ?? "active";
    const billingStatus = readCompanyBillingStatus(record.billingStatus) ?? "active";

    if (!companyId || !companyName || !memberRole || !membershipStatus) {
      continue;
    }

    items.push({
      companyId,
      companyName,
      memberRole,
      membershipStatus,
      companyStatus,
      billingStatus,
    });
  }
  return items;
}

export function parseCompanyMemberItems(value: unknown): CompanyMemberItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyMemberItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }
    const uid = readString(record.uid);
    const role = readMemberRole(record.role);
    const status = readMembershipStatus(record.memberStatus ?? record.status);
    if (!uid || !role || !status) {
      continue;
    }
    items.push({
      uid,
      displayName: readString(record.displayName),
      email: readString(record.email),
      phone: readString(record.phone),
      role,
      status,
      companyId: readString(record.companyId),
      createdAt: readString(record.createdAt),
      updatedAt: readString(record.updatedAt),
    });
  }
  return items;
}

export function parseCompanyDriverItems(value: unknown): CompanyDriverItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyDriverItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }
    const driverId = readString(record.driverId);
    const name = readString(record.name);
    const plateMasked = readString(record.plateMasked);
    const status = record.status === "active" || record.status === "passive" ? record.status : "passive";
    const assignmentStatus =
      record.assignmentStatus === "assigned" || record.assignmentStatus === "unassigned"
        ? record.assignmentStatus
        : "unassigned";
    const assignedRoutesRaw = Array.isArray(record.assignedRoutes) ? record.assignedRoutes : [];
    const assignedRoutes: Array<{ routeId: string; routeName: string; scheduledTime: string | null }> = [];
    for (const rawRoute of assignedRoutesRaw) {
      const routeRecord = asRecord(rawRoute);
      if (!routeRecord) {
        continue;
      }
      const routeId = readString(routeRecord.routeId);
      const routeName = readString(routeRecord.routeName);
      if (!routeId || !routeName) {
        continue;
      }
      assignedRoutes.push({
        routeId,
        routeName,
        scheduledTime: readString(routeRecord.scheduledTime),
      });
    }
    if (!driverId || !name || !plateMasked) {
      continue;
    }
    items.push({
      driverId,
      name,
      plateMasked,
      status,
      assignmentStatus,
      lastSeenAt: readString(record.lastSeenAt),
      phoneMasked: readString(record.phoneMasked),
      assignedRoutes,
    });
  }
  return items;
}

export function parseCompanyDriverCredentialBundle(
  value: unknown,
): CompanyDriverCredentialBundle | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const driverId = readString(record.driverId);
  const name = readString(record.name);
  const loginEmail = readString(record.loginEmail);
  const temporaryPassword = readString(record.temporaryPassword);
  if (!driverId || !name || !loginEmail || !temporaryPassword) {
    return null;
  }
  return {
    driverId,
    name,
    loginEmail,
    temporaryPassword,
    mobileOnly: record.mobileOnly === true,
    createdAt: readString(record.createdAt),
  };
}

export function parseCompanyInviteItems(value: unknown): CompanyInviteItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyInviteItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }
    const inviteId = readString(record.inviteId);
    const companyId = readString(record.companyId);
    const companyName = readString(record.companyName);
    const email = readString(record.email);
    const role = readMemberRole(record.role);
    const status = readInviteStatus(record.status);
    if (!inviteId || !companyId || !companyName || !email || !role || !status) {
      continue;
    }
    items.push({
      inviteId,
      companyId,
      companyName,
      email,
      role,
      status,
      targetUid: readString(record.targetUid),
      invitedBy: readString(record.invitedBy),
      createdAt: readString(record.createdAt),
      updatedAt: readString(record.updatedAt),
    });
  }
  return items;
}

export function parseCompanyVehicleItems(value: unknown): CompanyVehicleItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyVehicleItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }
    const vehicleId = readString(record.vehicleId);
    const plate = readString(record.plate);
    const brand = readString(record.brand);
    const model = readString(record.model);
    const yearRaw = record.year;
    const year = typeof yearRaw === "number" && Number.isFinite(yearRaw) ? Math.trunc(yearRaw) : null;
    const capacityRaw = record.capacity;
    const capacity =
      typeof capacityRaw === "number" && Number.isFinite(capacityRaw) ? Math.trunc(capacityRaw) : null;
    const rawStatus = readString(record.status);
    const status: VehicleStatus =
      rawStatus === "active" || rawStatus === "maintenance" || rawStatus === "inactive"
        ? rawStatus
        : "active";
    const label = [brand, model].filter(Boolean).join(" ") || null;
    if (!vehicleId || !plate) {
      continue;
    }
    items.push({
      vehicleId,
      companyId: readString(record.companyId),
      plate,
      status,
      brand,
      model,
      year,
      capacity,
      label,
      isActive: status === "active",      createdAt: readString(record.createdAt),      updatedAt: readString(record.updatedAt),
    });
  }
  return items;
}

function readRouteTimeSlot(value: unknown): CompanyRouteTimeSlot {
  if (value === "morning" || value === "evening" || value === "midday" || value === "custom") {
    return value;
  }
  return null;
}

export function parseCompanyRouteItems(value: unknown): CompanyRouteItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyRouteItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }
    const routeId = readString(record.routeId);
    const name = readString(record.name);
    if (!routeId || !name) {
      continue;
    }
    const allowGuestTrackingRaw = record.allowGuestTracking;
    const isArchivedRaw = record.isArchived;
    const passengerCountRaw = record.passengerCount;
    const authorizedDriverIdsRaw = record.authorizedDriverIds;
    const authorizedDriverIds: string[] = Array.isArray(authorizedDriverIdsRaw)
      ? authorizedDriverIdsRaw.filter((v): v is string => typeof v === "string" && v.length > 0)
      : [];
    items.push({
      routeId,
      companyId: readString(record.companyId),
      name,
      srvCode: readString(record.srvCode),
      scheduledTime: readString(record.scheduledTime),
      timeSlot: readRouteTimeSlot(record.timeSlot),
      driverId: readString(record.driverId),
      authorizedDriverIds,
      vehicleId: readString(record.vehicleId),
      vehiclePlate: readString(record.vehiclePlate),
      allowGuestTracking:
        typeof allowGuestTrackingRaw === "boolean" ? allowGuestTrackingRaw : false,
      isArchived: typeof isArchivedRaw === "boolean" ? isArchivedRaw : false,
      startAddress: readString(record.startAddress),
      endAddress: readString(record.endAddress),
      passengerCount:
        typeof passengerCountRaw === "number" && Number.isFinite(passengerCountRaw)
          ? Math.trunc(passengerCountRaw)
          : 0,
      updatedAt: readString(record.updatedAt),
    });
  }
  return items;
}

export function parseCompanyRouteStopItems(value: unknown): CompanyRouteStopItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyRouteStopItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }
    const stopId = readString(record.stopId);
    const name = readString(record.name);
    const locationRecord = asRecord(record.location);
    const latRaw = locationRecord?.lat;
    const lngRaw = locationRecord?.lng;
    const orderRaw = record.order;
    if (
      !stopId ||
      !name ||
      typeof latRaw !== "number" ||
      !Number.isFinite(latRaw) ||
      typeof lngRaw !== "number" ||
      !Number.isFinite(lngRaw) ||
      typeof orderRaw !== "number" ||
      !Number.isFinite(orderRaw)
    ) {
      continue;
    }
    items.push({
      stopId,
      routeId: readString(record.routeId),
      companyId: readString(record.companyId),
      name,
      location: {
        lat: latRaw,
        lng: lngRaw,
      },
      order: Math.trunc(orderRaw),
      createdAt: readString(record.createdAt),
      updatedAt: readString(record.updatedAt),
    });
  }
  return items;
}

function readLiveOpsStatus(value: unknown): CompanyLiveOpsStatus | null {
  if (value === "live" || value === "stale" || value === "no_signal" || value === "idle") {
    return value;
  }
  return null;
}

export function parseCompanyLiveOpsItems(value: unknown): CompanyLiveOpsItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CompanyLiveOpsItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }

    const routeId = readString(record.routeId);
    const routeName = readString(record.routeName);
    const status = readLiveOpsStatus(record.status);
    if (!routeId || !routeName || !status) {
      continue;
    }

    const passengerCountRaw = record.passengerCount;
    const passengerCount =
      typeof passengerCountRaw === "number" && Number.isFinite(passengerCountRaw)
        ? Math.max(0, Math.trunc(passengerCountRaw))
        : 0;

    const latRaw = record.lat;
    const lngRaw = record.lng;
    const speedRaw = record.speed;
    const headingRaw = record.heading;
    const accuracyRaw = record.accuracy;
    const locationTimestampMsRaw = record.locationTimestampMs;

    items.push({
      routeId,
      routeName,
      routeUpdatedAt: readString(record.routeUpdatedAt),
      scheduledTime: readString(record.scheduledTime),
      timeSlot: readRouteTimeSlot(record.timeSlot),
      passengerCount,
      tripId: readString(record.tripId),
      driverId: readString(record.driverId),
      vehicleId: readString(record.vehicleId),
      lat: typeof latRaw === "number" && Number.isFinite(latRaw) ? latRaw : null,
      lng: typeof lngRaw === "number" && Number.isFinite(lngRaw) ? lngRaw : null,
      speed: typeof speedRaw === "number" && Number.isFinite(speedRaw) ? speedRaw : null,
      heading: typeof headingRaw === "number" && Number.isFinite(headingRaw) ? headingRaw : null,
      accuracy: typeof accuracyRaw === "number" && Number.isFinite(accuracyRaw) ? accuracyRaw : null,
      locationTimestampMs:
        typeof locationTimestampMsRaw === "number" && Number.isFinite(locationTimestampMsRaw)
          ? Math.trunc(locationTimestampMsRaw)
          : null,
      status,
    });
  }

  return items;
}
