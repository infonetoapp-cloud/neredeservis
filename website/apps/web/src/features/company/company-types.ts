export type CompanyMembershipSummary = {
  companyId: string;
  name: string;
  role: "owner" | "admin" | "dispatcher" | "viewer";
  memberStatus: "active" | "invited" | "suspended";
};

export type ListMyCompaniesResponse = {
  items: CompanyMembershipSummary[];
};

export type CreateCompanyResponse = {
  companyId: string;
  ownerMember: {
    uid: string;
    role: "owner";
    status: "active";
  };
  createdAt: string;
};

export type CompanyMemberRole = "owner" | "admin" | "dispatcher" | "viewer";
export type CompanyMemberStatus = "active" | "invited" | "suspended";
export type InviteCompanyMemberRole = "admin" | "dispatcher" | "viewer";

export type CompanyMemberSummary = {
  uid: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: CompanyMemberRole;
  memberStatus: CompanyMemberStatus;
  companyId: string;
};

export type ListCompanyMembersResponse = {
  items: CompanyMemberSummary[];
};

export type InviteCompanyMemberResponse = {
  companyId: string;
  inviteId: string;
  memberUid: string;
  invitedEmail: string;
  role: InviteCompanyMemberRole;
  status: "pending";
  expiresAt: string;
  createdAt: string;
};

export type AcceptCompanyInviteResponse = {
  companyId: string;
  memberUid: string;
  role: CompanyMemberRole;
  memberStatus: "active";
  acceptedAt: string;
};

export type DeclineCompanyInviteResponse = {
  companyId: string;
  memberUid: string;
  role: CompanyMemberRole;
  memberStatus: "suspended";
  declinedAt: string;
};

export type UpdateCompanyMemberResponse = {
  companyId: string;
  memberUid: string;
  role: CompanyMemberRole;
  memberStatus: CompanyMemberStatus;
  updatedAt: string;
};

export type RemoveCompanyMemberResponse = {
  companyId: string;
  memberUid: string;
  removedRole: CompanyMemberRole;
  removedMemberStatus: CompanyMemberStatus;
  removed: true;
  removedAt: string;
};

export type CompanyRouteSummary = {
  routeId: string;
  companyId: string;
  name: string;
  srvCode: string | null;
  driverId: string | null;
  authorizedDriverIds: string[];
  scheduledTime: string | null;
  timeSlot: "morning" | "evening" | "midday" | "custom" | null;
  isArchived: boolean;
  allowGuestTracking: boolean;
  passengerCount: number;
  updatedAt: string | null;
};

export type ListCompanyRoutesResponse = {
  items: CompanyRouteSummary[];
};

export type CreateCompanyRouteResponse = {
  routeId: string;
  srvCode: string;
};

export type UpdateCompanyRouteResponse = {
  routeId: string;
  updatedAt: string;
};

export type CompanyRouteStopSummary = {
  stopId: string;
  routeId: string;
  companyId: string;
  name: string;
  order: number;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: string | null;
  updatedAt: string | null;
};

export type ListCompanyRouteStopsResponse = {
  companyId: string;
  routeId: string;
  items: CompanyRouteStopSummary[];
};

export type CompanyActiveTripSummary = {
  tripId: string;
  routeId: string;
  routeName: string;
  driverUid: string;
  driverName: string;
  driverPlate: string | null;
  status: "active";
  startedAt: string | null;
  lastLocationAt: string | null;
  updatedAt: string | null;
  liveState: "online" | "stale";
  live: {
    lat: number | null;
    lng: number | null;
    source: "rtdb" | "trip_doc";
    stale: boolean;
  };
};

export type ListActiveTripsByCompanyResponse = {
  items: CompanyActiveTripSummary[];
};

export type UpsertCompanyRouteStopResponse = {
  companyId: string;
  routeId: string;
  stopId: string;
  updatedAt: string;
};

export type DeleteCompanyRouteStopResponse = {
  routeId: string;
  stopId: string;
  deleted: boolean;
};

export type ReorderCompanyRouteStopsResponse = {
  routeId: string;
  updatedAt: string;
  changed: boolean;
};

export type GenerateRouteShareLinkResponse = {
  routeId: string;
  srvCode: string;
  landingUrl: string;
  signedLandingUrl: string;
  previewToken: string;
  previewTokenExpiresAt: string;
  whatsappUrl: string;
  systemShareText: string;
};

export type DynamicRoutePreviewResponse = {
  routeId: string;
  srvCode: string;
  routeName: string;
  driverDisplayName: string;
  scheduledTime: string | null;
  timeSlot: "morning" | "evening" | "midday" | "custom" | null;
  allowGuestTracking: boolean;
  deepLinkUrl: string;
};

export type RouteDriverPermissionFlags = {
  canStartFinishTrip: boolean;
  canSendAnnouncements: boolean;
  canViewPassengerList: boolean;
  canEditAssignedRouteMeta: boolean;
  canEditStops: boolean;
  canManageRouteSchedule: boolean;
};

export type GrantDriverRoutePermissionsResponse = {
  routeId: string;
  driverUid: string;
  permissions: RouteDriverPermissionFlags;
  updatedAt: string;
};

export type RevokeDriverRoutePermissionsResponse = {
  routeId: string;
  driverUid: string;
  updatedAt: string;
};

export type RouteDriverPermissionSummary = {
  routeId: string;
  driverUid: string;
  permissions: RouteDriverPermissionFlags;
  updatedAt: string | null;
};

export type ListRouteDriverPermissionsResponse = {
  items: RouteDriverPermissionSummary[];
};

export type CompanyVehicleSummary = {
  vehicleId: string;
  companyId: string;
  plate: string;
  status: VehicleStatus;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  updatedAt: string | null;
};

export type ListCompanyVehiclesResponse = {
  items: CompanyVehicleSummary[];
};

export type VehicleStatus = "active" | "maintenance" | "inactive";

export type CreateVehicleResponse = {
  vehicleId: string;
  createdAt: string;
};

export type UpdateVehicleResponse = {
  vehicleId: string;
  updatedAt: string;
};
