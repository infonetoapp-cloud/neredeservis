import type { InferredStopOutput, WritableRole } from './index_domain_helpers.js';

export interface HealthCheckOutput {
  ok: boolean;
  timestamp: number;
  region: string;
}

export interface DriverDirectoryResult {
  driverId: string;
  displayName: string;
  plateMasked: string;
}

export interface SearchDriverDirectoryOutput {
  results: DriverDirectoryResult[];
}

export type MapboxDirectionsProfile = 'driving' | 'driving-traffic';

export interface BootstrapUserProfileOutput {
  uid: string;
  role: WritableRole;
  createdOrUpdated: boolean;
}

export interface UpdateUserProfileOutput {
  uid: string;
  updatedAt: string;
}

export interface UpsertConsentOutput {
  uid: string;
  acceptedAt: string;
}

export interface UpsertDriverProfileOutput {
  driverId: string;
  updatedAt: string;
}

export interface RequestDriverAccessOutput {
  status: 'pending' | 'already_driver';
  requestedAt: string | null;
}

export interface CreateRouteOutput {
  routeId: string;
  srvCode: string;
}

export interface CreateCompanyRouteOutput {
  routeId: string;
  srvCode: string;
}

export interface CreateCompanyOutput {
  companyId: string;
  ownerMember: {
    uid: string;
    role: 'owner';
    status: 'active';
  };
  createdAt: string;
}

export interface ListMyCompaniesItem {
  companyId: string;
  name: string;
  role: 'owner' | 'admin' | 'dispatcher' | 'viewer';
  memberStatus: 'active' | 'invited' | 'suspended';
}

export interface ListMyCompaniesOutput {
  items: ListMyCompaniesItem[];
}

export interface ListCompanyMembersItem {
  uid: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: 'owner' | 'admin' | 'dispatcher' | 'viewer';
  memberStatus: 'active' | 'invited' | 'suspended';
  companyId: string;
}

export interface ListCompanyMembersOutput {
  items: ListCompanyMembersItem[];
}

export interface InviteCompanyMemberOutput {
  companyId: string;
  inviteId: string;
  memberUid: string;
  invitedEmail: string;
  role: 'admin' | 'dispatcher' | 'viewer';
  status: 'pending';
  expiresAt: string;
  createdAt: string;
}

export interface AcceptCompanyInviteOutput {
  companyId: string;
  memberUid: string;
  role: 'owner' | 'admin' | 'dispatcher' | 'viewer';
  memberStatus: 'active';
  acceptedAt: string;
}

export interface DeclineCompanyInviteOutput {
  companyId: string;
  memberUid: string;
  role: 'owner' | 'admin' | 'dispatcher' | 'viewer';
  memberStatus: 'suspended';
  declinedAt: string;
}

export interface ListCompanyRoutesItem {
  routeId: string;
  companyId: string;
  name: string;
  srvCode: string | null;
  driverId: string | null;
  authorizedDriverIds: string[];
  scheduledTime: string | null;
  timeSlot: 'morning' | 'evening' | 'midday' | 'custom' | null;
  isArchived: boolean;
  allowGuestTracking: boolean;
  passengerCount: number;
  updatedAt: string | null;
}

export interface ListCompanyRoutesOutput {
  items: ListCompanyRoutesItem[];
}

export interface ListCompanyRouteStopsItem {
  stopId: string;
  routeId: string;
  companyId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ListCompanyRouteStopsOutput {
  companyId: string;
  routeId: string;
  items: ListCompanyRouteStopsItem[];
}

export interface ListActiveTripsByCompanyItem {
  tripId: string;
  routeId: string;
  routeName: string;
  driverUid: string;
  driverName: string;
  driverPlate: string | null;
  status: 'active';
  startedAt: string | null;
  lastLocationAt: string | null;
  updatedAt: string | null;
  liveState: 'online' | 'stale';
  live: {
    lat: number | null;
    lng: number | null;
    source: 'rtdb' | 'trip_doc';
    stale: boolean;
  };
}

export interface ListActiveTripsByCompanyOutput {
  items: ListActiveTripsByCompanyItem[];
}

export interface ListCompanyVehiclesItem {
  vehicleId: string;
  companyId: string;
  plate: string;
  status: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  updatedAt: string | null;
}

export interface ListCompanyVehiclesOutput {
  items: ListCompanyVehiclesItem[];
}

export interface CreateVehicleOutput {
  vehicleId: string;
  createdAt: string;
}

export interface UpdateVehicleOutput {
  vehicleId: string;
  updatedAt: string;
}

export interface UpdateCompanyMemberOutput {
  companyId: string;
  memberUid: string;
  role: 'owner' | 'admin' | 'dispatcher' | 'viewer';
  memberStatus: 'active' | 'invited' | 'suspended';
  updatedAt: string;
}

export interface RemoveCompanyMemberOutput {
  companyId: string;
  memberUid: string;
  removedRole: 'owner' | 'admin' | 'dispatcher' | 'viewer';
  removedMemberStatus: 'active' | 'invited' | 'suspended';
  removed: true;
  removedAt: string;
}

export interface UpdateCompanyAdminTenantStateOutput {
  companyId: string;
  companyStatus: 'active' | 'suspended' | 'archived' | 'unknown';
  billingStatus: 'active' | 'past_due' | 'suspended_locked' | 'unknown';
  billingValidUntil: string | null;
  updatedAt: string | null;
  changedFields: string[];
}

export interface UpdateRouteOutput {
  routeId: string;
  updatedAt: string;
}

export interface RouteDriverPermissionFlags {
  canStartFinishTrip: boolean;
  canSendAnnouncements: boolean;
  canViewPassengerList: boolean;
  canEditAssignedRouteMeta: boolean;
  canEditStops: boolean;
  canManageRouteSchedule: boolean;
}

export interface GrantDriverRoutePermissionsOutput {
  routeId: string;
  driverUid: string;
  permissions: RouteDriverPermissionFlags;
  updatedAt: string;
}

export interface RevokeDriverRoutePermissionsOutput {
  routeId: string;
  driverUid: string;
  updatedAt: string;
}

export interface ListRouteDriverPermissionsItem {
  routeId: string;
  driverUid: string;
  permissions: RouteDriverPermissionFlags;
  updatedAt: string | null;
}

export interface ListRouteDriverPermissionsOutput {
  items: ListRouteDriverPermissionsItem[];
}

export interface CreateRouteFromGhostDriveOutput {
  routeId: string;
  srvCode: string;
  inferredStops: InferredStopOutput[];
}

export interface MapboxDirectionsProxyOutput {
  routeId: string;
  profile: MapboxDirectionsProfile;
  geometry: string;
  distanceMeters: number;
  durationSeconds: number;
  source: 'mapbox';
  requestSignature: string | null;
}

export interface MapboxMapMatchingProxyOutput {
  tracePoints: {
    lat: number;
    lng: number;
    accuracy: number;
    sampledAtMs: number;
  }[];
  fallbackUsed: boolean;
  source: 'map_matching' | 'fallback';
  confidence: number;
}

export interface UpsertStopOutput {
  routeId: string;
  stopId: string;
  updatedAt: string;
}

export interface UpsertCompanyRouteStopOutput {
  companyId: string;
  routeId: string;
  stopId: string;
  updatedAt: string;
}

export interface DeleteCompanyRouteStopOutput {
  routeId: string;
  stopId: string;
  deleted: boolean;
}

export interface ReorderCompanyRouteStopsOutput {
  routeId: string;
  updatedAt: string;
  changed: boolean;
}

export interface DeleteStopOutput {
  routeId: string;
  stopId: string;
  deleted: boolean;
}

export interface JoinRouteBySrvCodeOutput {
  routeId: string;
  routeName: string;
  role: 'passenger';
}

export interface LeaveRouteOutput {
  routeId: string;
  left: boolean;
}

export interface RegisterDeviceOutput {
  activeDeviceId: string;
  previousDeviceRevoked: boolean;
  updatedAt: string;
}

export interface UpdatePassengerSettingsOutput {
  routeId: string;
  updatedAt: string;
}

export interface SubmitSkipTodayOutput {
  routeId: string;
  dateKey: string;
  status: 'skip_today';
}

export interface CreateGuestSessionOutput {
  sessionId: string;
  routeId: string;
  routeName: string;
  guestDisplayName: string;
  expiresAt: string;
  rtdbReadPath: string;
}

export interface StartTripOutput {
  tripId: string;
  status: 'active';
  transitionVersion: number;
}

export interface FinishTripOutput {
  tripId: string;
  status: 'completed' | 'abandoned';
  endedAt: string;
  transitionVersion: number;
}

export interface SendDriverAnnouncementOutput {
  announcementId: string;
  fcmCount: number;
  shareUrl: string;
}

export interface SubmitSupportReportOutput {
  reportId: string;
  queued: boolean;
  supportEmail: string;
  slackDispatch: 'sent' | 'skipped' | 'failed';
}

export interface OpenTripConversationOutput {
  conversationId: string;
  routeId: string;
  driverUid: string;
  passengerUid: string;
  driverName: string;
  passengerName: string;
  driverPlate: string | null;
  created: boolean;
  updatedAt: string;
}

export interface SendTripMessageOutput {
  conversationId: string;
  messageId: string;
  senderUid: string;
  createdAt: string;
}

export interface MarkTripConversationReadOutput {
  conversationId: string;
  readAt: string;
}

export interface GenerateRouteShareLinkOutput {
  routeId: string;
  srvCode: string;
  landingUrl: string;
  signedLandingUrl: string;
  previewToken: string;
  previewTokenExpiresAt: string;
  whatsappUrl: string;
  systemShareText: string;
}

export interface DynamicRoutePreviewOutput {
  routeId: string;
  srvCode: string;
  routeName: string;
  driverDisplayName: string;
  scheduledTime: string | null;
  timeSlot: 'morning' | 'evening' | 'midday' | 'custom' | null;
  allowGuestTracking: boolean;
  deepLinkUrl: string;
}

export interface SubscriptionProductOutput {
  id: string;
  price: string;
}

export interface DeleteUserDataOutput {
  uid: string;
  status: 'blocked_subscription' | 'scheduled';
  blockedBySubscription: boolean;
  dryRun: boolean;
  interceptorMessage: string | null;
  manageSubscriptionLabel: string | null;
  manageSubscriptionUrls: {
    ios: string;
    android: string;
  } | null;
  requestedAt: string | null;
  hardDeleteAfter: string | null;
}

// ─── Platform Owner Callable Types ───────────────────────────────────────────

export interface PlatformCompanyListItem {
  companyId: string;
  name: string;
  status: 'active' | 'suspended';
  ownerEmail: string | null;
  ownerUid: string | null;
  vehicleLimit: number;
  vehicleCount: number;
  memberCount: number;
  routeCount: number;
  createdAt: string;
}

export interface PlatformListCompaniesOutput {
  items: PlatformCompanyListItem[];
}

export interface PlatformCompanyMemberItem {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  status: string;
  joinedAt: string;
}

export interface PlatformCompanyVehicleItem {
  vehicleId: string;
  plate: string;
  brand: string | null;
  model: string | null;
  capacity: number | null;
  status: string;
}

export interface PlatformCompanyRouteItem {
  routeId: string;
  name: string;
  stopCount: number;
  isArchived: boolean;
}

export interface PlatformGetCompanyDetailOutput {
  companyId: string;
  name: string;
  status: 'active' | 'suspended';
  ownerEmail: string | null;
  ownerUid: string | null;
  vehicleLimit: number;
  createdAt: string;
  members: PlatformCompanyMemberItem[];
  vehicles: PlatformCompanyVehicleItem[];
  routes: PlatformCompanyRouteItem[];
}

export interface PlatformCreateCompanyOutput {
  companyId: string;
  ownerUid: string;
  ownerEmail: string;
  passwordResetLink: string;
  createdAt: string;
}

export interface PlatformSetVehicleLimitOutput {
  companyId: string;
  vehicleLimit: number;
  updatedAt: string;
}

export interface PlatformSetCompanyStatusOutput {
  companyId: string;
  status: 'active' | 'suspended';
  updatedAt: string;
}
