import { getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

import { apiOk } from './common/api_response.js';
import { createCleanupScheduledTriggers } from './common/cleanup_scheduled_triggers.js';
import { createCompanyAccessHelpers } from './common/company_access_helpers.js';
import { createInputSchemas } from './common/input_schemas.js';
import { createCompanyMutationCallables } from './callables/company_mutation_callables.js';
import { createCompanyMemberMutationCallables } from './callables/company_member_mutation_callables.js';
import { createCompanyAuditQueryCallables } from './callables/company_audit_query_callables.js';
import { createCompanyQueryCallables } from './callables/company_query_callables.js';
import { createRouteDriverPermissionCallables } from './callables/route_driver_permission_callables.js';
import { createPlatformOwnerCallables } from './callables/platform_owner_callables.js';
import {
  requireOwnedRoute,
} from './common/route_membership_helpers.js';
import {
  writeRouteAuditEvent as writeRouteAuditEventWithDb,
  writeRouteAuditEventSafe as writeRouteAuditEventSafeWithDb,
  type WriteRouteAuditEventInput,
} from './common/route_audit_helpers.js';
import { createRouteWithSrvCode } from './common/route_creation_helpers.js';
import { createAccountSupportCallables } from './callables/account_support_callables.js';
import { createDriverRouteCallables } from './callables/driver_route_callables.js';
import { createDriverRouteCreationCallables } from './callables/driver_route_creation_callables.js';
import { createMapboxPreviewCallables } from './callables/mapbox_preview_callables.js';
import { createPassengerMembershipCallables } from './callables/passenger_membership_callables.js';
import { createPassengerOpsCallables } from './callables/passenger_ops_callables.js';
import { createProfileDriverCallables } from './callables/profile_driver_callables.js';
import { createSearchDriverDirectoryCallable } from './callables/search_driver_callable.js';
import { createTripChatCallables } from './callables/trip_chat_callables.js';
import { createTripLifecycleCallables } from './callables/trip_lifecycle_callables.js';
import { createOperationalTriggers } from './common/operational_triggers.js';
import {
  readJoinRouteRateMaxCalls,
  readJoinRouteRateWindowMs,
} from './common/mapbox_route_preview_helpers.js';
import type { HealthCheckOutput } from './common/output_contract_types.js';

setGlobalOptions({
  region: 'europe-west3',
  timeoutSeconds: 30,
  memory: '256MiB',
});

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const rtdb = getDatabase();
const {
  requireActiveCompanyMemberRole,
  requireCompanyVehicleWriteRole,
  requireCompanyRouteWriteRole,
  normalizeVehiclePlate,
  normalizeVehicleTextNullable,
  assertCompanyMembersExistAndActive,
} = createCompanyAccessHelpers(db);
const writeRouteAuditEvent = (input: WriteRouteAuditEventInput) =>
  writeRouteAuditEventWithDb(db, ROUTE_AUDIT_COLLECTION, input);
const writeRouteAuditEventSafe = (input: WriteRouteAuditEventInput) =>
  writeRouteAuditEventSafeWithDb({
    db,
    collectionName: ROUTE_AUDIT_COLLECTION,
    input,
  });

const DRIVER_SEARCH_MAX_LIMIT = 10;
const DRIVER_SEARCH_RATE_WINDOW_MS = 60_000;
const DRIVER_SEARCH_RATE_MAX_CALLS = 30;
const GUEST_SESSION_TTL_MINUTES_DEFAULT = 30;
const TRIP_REQUEST_TTL_DAYS = 7;
const TRIP_STARTED_NOTIFICATION_COOLDOWN_MS = 15 * 60 * 1000;
const LIVE_LOCATION_MAX_AGE_MS = 30_000;
const LIVE_LOCATION_FUTURE_TOLERANCE_MS = 5_000;
const LIVE_OPS_ONLINE_THRESHOLD_MS = 60_000;
const ABANDONED_TRIP_STALE_WINDOW_MS = 10 * 60 * 1000;
const MORNING_REMINDER_LEAD_MINUTES = 5;
const CLEANUP_STALE_DATA_BATCH_LIMIT = 200;
const CLEANUP_ROUTE_WRITERS_SCAN_LIMIT = 200;
const CLEANUP_ROUTE_WRITER_TASK_BATCH_LIMIT = 200;
const SUPPORT_REPORT_RETENTION_DAYS = 30;
const WRITER_REVOKE_TASK_RETENTION_DAYS = 7;
const DEVICE_SWITCH_NOTICE_DEDUPE_TTL_DAYS = 3;
const ANNOUNCEMENT_DISPATCH_DEDUPE_TTL_DAYS = 7;
const JOIN_ROUTE_RATE_WINDOW_MS = 5 * 60_000;
const JOIN_ROUTE_RATE_MAX_CALLS = 8;
const MAPBOX_DIRECTIONS_RATE_WINDOW_MS = 60_000;
const MAPBOX_DIRECTIONS_RATE_MAX_CALLS = 20;
const MAPBOX_DIRECTIONS_DEFAULT_MONTHLY_MAX = 20_000;
const MAPBOX_DIRECTIONS_DEFAULT_TIMEOUT_MS = 3_000;
const MAPBOX_DIRECTIONS_DEFAULT_MAX_WAYPOINTS = 10;
const ROUTE_PREVIEW_RATE_WINDOW_MS = 60_000;
const ROUTE_PREVIEW_RATE_MAX_CALLS = 60;
const ROUTE_PREVIEW_TOKEN_DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;
const ROUTE_AUDIT_COLLECTION = '_audit_route_events';
const ACCOUNT_DELETE_GRACE_DAYS = 7;
const DELETE_INTERCEPTOR_MESSAGE =
  'Hesabi silmek odemeyi durdurmaz, once store aboneligini iptal et.';
const MANAGE_SUBSCRIPTION_LABEL = 'Manage Subscription';
const IOS_MANAGE_SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';
const ANDROID_MANAGE_SUBSCRIPTION_URL = 'https://play.google.com/store/account/subscriptions';
const SUPPORT_EMAIL_DEFAULT = 'infonetoapp@gmail.com';
const SUPPORT_SLACK_WEBHOOK_URL_ENV = 'SUPPORT_SLACK_WEBHOOK_URL';
const SUPPORT_REPORT_MAX_NOTE_LENGTH = 600;
const SUPPORT_REPORT_MAX_LOG_SUMMARY_LENGTH = 2500;
const DEFAULT_COMPANY_TIMEZONE = 'Europe/Istanbul';
const DEFAULT_COMPANY_COUNTRY_CODE = 'TR';
const ROUTE_SHARE_BASE_URL = (
  process.env.ROUTE_SHARE_BASE_URL ?? 'https://app.neredeservis.app/r'
)
  .trim()
  .replace(/\/+$/, '');

const {
  profileInputSchema,
  upsertConsentInputSchema,
  upsertDriverProfileInputSchema,
  createCompanyInputSchema,
  listCompanyMembersInputSchema,
  updateCompanyAdminTenantStateInputSchema,
  inviteCompanyMemberInputSchema,
  acceptCompanyInviteInputSchema,
  declineCompanyInviteInputSchema,
  updateCompanyMemberInputSchema,
  removeCompanyMemberInputSchema,
  listCompanyRoutesInputSchema,
  listCompanyRouteStopsInputSchema,
  listActiveTripsByCompanyInputSchema,
  listCompanyVehiclesInputSchema,
  createCompanyRouteInputSchema,
  updateCompanyRouteInputSchema,
  upsertCompanyRouteStopInputSchema,
  deleteCompanyRouteStopInputSchema,
  reorderCompanyRouteStopsInputSchema,
  grantDriverRoutePermissionsInputSchema,
  revokeDriverRoutePermissionsInputSchema,
  listRouteDriverPermissionsInputSchema,
  createVehicleInputSchema,
  updateVehicleInputSchema,
  createRouteInputSchema,
  updateRouteInputSchema,
  createRouteFromGhostDriveInputSchema,
  mapboxDirectionsProxyInputSchema,
  mapboxMapMatchingProxyInputSchema,
  generateRouteShareLinkInputSchema,
  deleteUserDataInputSchema,
  dynamicRoutePreviewInputSchema,
  upsertStopInputSchema,
  deleteStopInputSchema,
  joinRouteBySrvCodeInputSchema,
  leaveRouteInputSchema,
  registerDeviceInputSchema,
  updatePassengerSettingsInputSchema,
  submitSkipTodayInputSchema,
  createGuestSessionInputSchema,
  startTripInputSchema,
  finishTripInputSchema,
  sendDriverAnnouncementInputSchema,
  submitSupportReportInputSchema,
  openTripConversationInputSchema,
  sendTripMessageInputSchema,
  markTripConversationReadInputSchema,
  searchDriverDirectoryInputSchema,
} = createInputSchemas({
  driverSearchMaxLimit: DRIVER_SEARCH_MAX_LIMIT,
  mapboxDirectionsDefaultMaxWaypoints: MAPBOX_DIRECTIONS_DEFAULT_MAX_WAYPOINTS,
  supportReportMaxNoteLength: SUPPORT_REPORT_MAX_NOTE_LENGTH,
});
const cleanupScheduledTriggers = createCleanupScheduledTriggers({
  db,
  rtdb,
  cleanupStaleDataBatchLimit: CLEANUP_STALE_DATA_BATCH_LIMIT,
  supportReportRetentionDays: SUPPORT_REPORT_RETENTION_DAYS,
  cleanupRouteWritersScanLimit: CLEANUP_ROUTE_WRITERS_SCAN_LIMIT,
  cleanupRouteWriterTaskBatchLimit: CLEANUP_ROUTE_WRITER_TASK_BATCH_LIMIT,
});
export const guestSessionTtlEnforcer = cleanupScheduledTriggers.guestSessionTtlEnforcer;
export const cleanupStaleData = cleanupScheduledTriggers.cleanupStaleData;
export const cleanupRouteWriters = cleanupScheduledTriggers.cleanupRouteWriters;
const operationalTriggers = createOperationalTriggers({
  db,
  rtdb,
  liveLocationMaxAgeMs: LIVE_LOCATION_MAX_AGE_MS,
  liveLocationFutureToleranceMs: LIVE_LOCATION_FUTURE_TOLERANCE_MS,
  abandonedTripStaleWindowMs: ABANDONED_TRIP_STALE_WINDOW_MS,
  morningReminderLeadMinutes: MORNING_REMINDER_LEAD_MINUTES,
});
export const syncPassengerCount = operationalTriggers.syncPassengerCount;
export const syncRouteMembership = operationalTriggers.syncRouteMembership;
export const syncTripHeartbeatFromLocation = operationalTriggers.syncTripHeartbeatFromLocation;
export const abandonedTripGuard = operationalTriggers.abandonedTripGuard;
export const morningReminderDispatcher = operationalTriggers.morningReminderDispatcher;
const profileDriverCallables = createProfileDriverCallables({
  db,
  profileInputSchema,
  upsertConsentInputSchema,
  upsertDriverProfileInputSchema,
  registerDeviceInputSchema,
  deviceSwitchNoticeDedupeTtlDays: DEVICE_SWITCH_NOTICE_DEDUPE_TTL_DAYS,
});
export const bootstrapUserProfile = profileDriverCallables.bootstrapUserProfile;
export const updateUserProfile = profileDriverCallables.updateUserProfile;
export const upsertConsent = profileDriverCallables.upsertConsent;
export const requestDriverAccess = profileDriverCallables.requestDriverAccess;
export const upsertDriverProfile = profileDriverCallables.upsertDriverProfile;
export const registerDevice = profileDriverCallables.registerDevice;
const accountSupportCallables = createAccountSupportCallables({
  db,
  deleteUserDataInputSchema,
  sendDriverAnnouncementInputSchema,
  submitSupportReportInputSchema,
  accountDeleteGraceDays: ACCOUNT_DELETE_GRACE_DAYS,
  deleteInterceptorMessage: DELETE_INTERCEPTOR_MESSAGE,
  manageSubscriptionLabel: MANAGE_SUBSCRIPTION_LABEL,
  iosManageSubscriptionUrl: IOS_MANAGE_SUBSCRIPTION_URL,
  androidManageSubscriptionUrl: ANDROID_MANAGE_SUBSCRIPTION_URL,
  supportEmailDefault: SUPPORT_EMAIL_DEFAULT,
  supportSlackWebhookUrlEnv: SUPPORT_SLACK_WEBHOOK_URL_ENV,
  supportReportMaxNoteLength: SUPPORT_REPORT_MAX_NOTE_LENGTH,
  supportReportMaxLogSummaryLength: SUPPORT_REPORT_MAX_LOG_SUMMARY_LENGTH,
  announcementDispatchDedupeTtlDays: ANNOUNCEMENT_DISPATCH_DEDUPE_TTL_DAYS,
  routeShareBaseUrl: ROUTE_SHARE_BASE_URL,
});
export const getSubscriptionState = accountSupportCallables.getSubscriptionState;
export const deleteUserData = accountSupportCallables.deleteUserData;
export const sendDriverAnnouncement = accountSupportCallables.sendDriverAnnouncement;
export const submitSupportReport = accountSupportCallables.submitSupportReport;
export const searchDriverDirectory = createSearchDriverDirectoryCallable({
  db,
  searchDriverDirectoryInputSchema,
  driverSearchRateWindowMs: DRIVER_SEARCH_RATE_WINDOW_MS,
  driverSearchRateMaxCalls: DRIVER_SEARCH_RATE_MAX_CALLS,
});
const tripChatCallables = createTripChatCallables({
  db,
  openTripConversationInputSchema,
  sendTripMessageInputSchema,
  markTripConversationReadInputSchema,
});
export const openTripConversation = tripChatCallables.openTripConversation;
export const sendTripMessage = tripChatCallables.sendTripMessage;
export const markTripConversationRead = tripChatCallables.markTripConversationRead;
const passengerOpsCallables = createPassengerOpsCallables({
  db,
  rtdb,
  updatePassengerSettingsInputSchema,
  submitSkipTodayInputSchema,
  createGuestSessionInputSchema,
  guestSessionTtlMinutesDefault: GUEST_SESSION_TTL_MINUTES_DEFAULT,
});
export const updatePassengerSettings = passengerOpsCallables.updatePassengerSettings;
export const submitSkipToday = passengerOpsCallables.submitSkipToday;
export const createGuestSession = passengerOpsCallables.createGuestSession;
const tripLifecycleCallables = createTripLifecycleCallables({
  db,
  rtdb,
  startTripInputSchema,
  finishTripInputSchema,
  tripRequestTtlDays: TRIP_REQUEST_TTL_DAYS,
  tripStartedNotificationCooldownMs: TRIP_STARTED_NOTIFICATION_COOLDOWN_MS,
  writerRevokeTaskRetentionDays: WRITER_REVOKE_TASK_RETENTION_DAYS,
});
export const startTrip = tripLifecycleCallables.startTrip;
export const finishTrip = tripLifecycleCallables.finishTrip;
const passengerMembershipCallables = createPassengerMembershipCallables({
  db,
  joinRouteBySrvCodeInputSchema,
  leaveRouteInputSchema,
  joinRouteRateWindowMs: readJoinRouteRateWindowMs(JOIN_ROUTE_RATE_WINDOW_MS),
  joinRouteRateMaxCalls: readJoinRouteRateMaxCalls(JOIN_ROUTE_RATE_MAX_CALLS),
  writeRouteAuditEvent,
});
export const joinRouteBySrvCode = passengerMembershipCallables.joinRouteBySrvCode;
export const leaveRoute = passengerMembershipCallables.leaveRoute;
const driverRouteCallables = createDriverRouteCallables({
  db,
  updateRouteInputSchema,
  upsertStopInputSchema,
  deleteStopInputSchema,
  requireOwnedRoute,
});
export const updateRoute = driverRouteCallables.updateRoute;
export const upsertStop = driverRouteCallables.upsertStop;
export const deleteStop = driverRouteCallables.deleteStop;
const driverRouteCreationCallables = createDriverRouteCreationCallables({
  db,
  createRouteInputSchema,
  createRouteFromGhostDriveInputSchema,
});
export const createRoute = driverRouteCreationCallables.createRoute;
export const createRouteFromGhostDrive = driverRouteCreationCallables.createRouteFromGhostDrive;
const mapboxPreviewCallables = createMapboxPreviewCallables({
  db,
  mapboxDirectionsProxyInputSchema,
  mapboxMapMatchingProxyInputSchema,
  generateRouteShareLinkInputSchema,
  dynamicRoutePreviewInputSchema,
  mapboxDirectionsDefaultMonthlyMax: MAPBOX_DIRECTIONS_DEFAULT_MONTHLY_MAX,
  mapboxDirectionsDefaultTimeoutMs: MAPBOX_DIRECTIONS_DEFAULT_TIMEOUT_MS,
  mapboxDirectionsRateWindowMs: MAPBOX_DIRECTIONS_RATE_WINDOW_MS,
  mapboxDirectionsRateMaxCalls: MAPBOX_DIRECTIONS_RATE_MAX_CALLS,
  routePreviewRateWindowMs: ROUTE_PREVIEW_RATE_WINDOW_MS,
  routePreviewRateMaxCalls: ROUTE_PREVIEW_RATE_MAX_CALLS,
  routePreviewTokenDefaultTtlSeconds: ROUTE_PREVIEW_TOKEN_DEFAULT_TTL_SECONDS,
  routeShareBaseUrl: ROUTE_SHARE_BASE_URL,
  writeRouteAuditEvent,
  writeRouteAuditEventSafe,
});
export const mapboxDirectionsProxy = mapboxPreviewCallables.mapboxDirectionsProxy;
export const mapboxMapMatchingProxy = mapboxPreviewCallables.mapboxMapMatchingProxy;
export const generateRouteShareLink = mapboxPreviewCallables.generateRouteShareLink;
export const getDynamicRoutePreview = mapboxPreviewCallables.getDynamicRoutePreview;
const companyQueryCallables = createCompanyQueryCallables({
  db,
  rtdb,
  createCompanyInputSchema,
  listCompanyMembersInputSchema,
  listCompanyRoutesInputSchema,
  listCompanyRouteStopsInputSchema,
  listActiveTripsByCompanyInputSchema,
  listCompanyVehiclesInputSchema,
  defaultCompanyTimezone: DEFAULT_COMPANY_TIMEZONE,
  defaultCompanyCountryCode: DEFAULT_COMPANY_COUNTRY_CODE,
  liveOpsOnlineThresholdMs: LIVE_OPS_ONLINE_THRESHOLD_MS,
  requireActiveCompanyMemberRole,
});
export const createCompany = companyQueryCallables.createCompany;
export const listMyCompanies = companyQueryCallables.listMyCompanies;
export const listCompanyMembers = companyQueryCallables.listCompanyMembers;
export const listCompanyRoutes = companyQueryCallables.listCompanyRoutes;
export const listCompanyRouteStops = companyQueryCallables.listCompanyRouteStops;
export const listActiveTripsByCompany = companyQueryCallables.listActiveTripsByCompany;
export const listCompanyVehicles = companyQueryCallables.listCompanyVehicles;
const companyAuditQueryCallables = createCompanyAuditQueryCallables({
  db,
  listCompanyAuditLogsInputSchema: listCompanyMembersInputSchema,
  updateCompanyAdminTenantStateInputSchema,
  requireActiveCompanyMemberRole,
});
export const listCompanyAuditLogs = companyAuditQueryCallables.listCompanyAuditLogs;
export const getCompanyAdminTenantState = companyAuditQueryCallables.getCompanyAdminTenantState;
export const updateCompanyAdminTenantState =
  companyAuditQueryCallables.updateCompanyAdminTenantState;
const companyMemberMutationCallables = createCompanyMemberMutationCallables({
  db,
  inviteCompanyMemberInputSchema,
  acceptCompanyInviteInputSchema,
  declineCompanyInviteInputSchema,
  updateCompanyMemberInputSchema,
  removeCompanyMemberInputSchema,
  requireActiveCompanyMemberRole,
});
export const inviteCompanyMember = companyMemberMutationCallables.inviteCompanyMember;
export const acceptCompanyInvite = companyMemberMutationCallables.acceptCompanyInvite;
export const declineCompanyInvite = companyMemberMutationCallables.declineCompanyInvite;
export const updateCompanyMember = companyMemberMutationCallables.updateCompanyMember;
export const removeCompanyMember = companyMemberMutationCallables.removeCompanyMember;

export const healthCheck = onCall(() => {
  return apiOk<HealthCheckOutput>({
    ok: true,
    timestamp: Date.now(),
    region: 'europe-west3',
  });
});
const companyMutationCallables = createCompanyMutationCallables({
  db,
  createVehicleInputSchema,
  createCompanyRouteInputSchema,
  updateCompanyRouteInputSchema,
  upsertCompanyRouteStopInputSchema,
  deleteCompanyRouteStopInputSchema,
  reorderCompanyRouteStopsInputSchema,
  updateVehicleInputSchema,
  requireActiveCompanyMemberRole,
  requireCompanyVehicleWriteRole,
  requireCompanyRouteWriteRole,
  normalizeVehiclePlate,
  normalizeVehicleTextNullable,
  assertCompanyMembersExistAndActive,
  createRouteWithSrvCode,
  writeRouteAuditEventSafe,
});
export const createVehicle = companyMutationCallables.createVehicle;
export const createCompanyRoute = companyMutationCallables.createCompanyRoute;
export const updateCompanyRoute = companyMutationCallables.updateCompanyRoute;
export const upsertCompanyRouteStop = companyMutationCallables.upsertCompanyRouteStop;
export const deleteCompanyRouteStop = companyMutationCallables.deleteCompanyRouteStop;
export const reorderCompanyRouteStops = companyMutationCallables.reorderCompanyRouteStops;
export const updateVehicle = companyMutationCallables.updateVehicle;
const routeDriverPermissionCallables = createRouteDriverPermissionCallables({
  db,
  grantDriverRoutePermissionsInputSchema,
  revokeDriverRoutePermissionsInputSchema,
  listRouteDriverPermissionsInputSchema,
  requireActiveCompanyMemberRole,
  requireCompanyRouteWriteRole,
  assertCompanyMembersExistAndActive,
});
export const listRouteDriverPermissions = routeDriverPermissionCallables.listRouteDriverPermissions;
export const grantDriverRoutePermissions = routeDriverPermissionCallables.grantDriverRoutePermissions;
export const revokeDriverRoutePermissions =
  routeDriverPermissionCallables.revokeDriverRoutePermissions;

const platformOwnerCallables = createPlatformOwnerCallables({ db });
export const platformListCompanies = platformOwnerCallables.platformListCompanies;
export const platformGetCompanyDetail = platformOwnerCallables.platformGetCompanyDetail;
export const platformCreateCompany = platformOwnerCallables.platformCreateCompany;
export const platformSetVehicleLimit = platformOwnerCallables.platformSetVehicleLimit;
export const platformSetCompanyStatus = platformOwnerCallables.platformSetCompanyStatus;
export const platformResetOwnerPassword = platformOwnerCallables.platformResetOwnerPassword;
export const platformDeleteCompany = platformOwnerCallables.platformDeleteCompany;
