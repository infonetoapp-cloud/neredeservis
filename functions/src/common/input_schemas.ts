import { z } from 'zod';

export function createInputSchemas({
  driverSearchMaxLimit,
  mapboxDirectionsDefaultMaxWaypoints,
  supportReportMaxNoteLength,
}: {
  driverSearchMaxLimit: number;
  mapboxDirectionsDefaultMaxWaypoints: number;
  supportReportMaxNoteLength: number;
}) {
  const profileInputSchema = z.object({
    displayName: z.string().trim().min(2, 'minimum 2 karakter olmalidir.').max(80),
    phone: z.string().trim().min(7).max(24).optional(),
    photoUrl: z.string().trim().url().max(2048).optional(),
    photoPath: z.string().trim().min(8).max(256).optional(),
    preferredRole: z.enum(['driver', 'passenger']).optional(),
  });

  const upsertConsentInputSchema = z.object({
    privacyVersion: z.string().trim().min(1).max(32),
    kvkkTextVersion: z.string().trim().min(1).max(32),
    locationConsent: z.boolean(),
    platform: z.enum(['android', 'ios']),
  });

  const upsertDriverProfileInputSchema = z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(24),
    plate: z.string().trim().min(2).max(20),
    showPhoneToPassengers: z.boolean().default(false),
    photoUrl: z.string().trim().url().max(2048).optional(),
    photoPath: z.string().trim().min(8).max(256).optional(),
    companyId: z.string().trim().min(1).max(64).nullable().optional(),
  });

  const createCompanyInputSchema = z.object({
    name: z.string().trim().min(2).max(120),
    contactEmail: z.string().trim().email().max(254).nullable().optional(),
    contactPhone: z.string().trim().min(3).max(32).nullable().optional(),
  });

  const listCompanyMembersInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    limit: z.number().int().min(1).max(500).optional().default(50),
  });

  const updateCompanyAdminTenantStateInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    patch: z
      .object({
        companyStatus: z.enum(['active', 'suspended', 'archived']).optional(),
        billingStatus: z.enum(['active', 'past_due', 'suspended_locked']).optional(),
        billingValidUntil: z.string().datetime().nullable().optional(),
        reason: z.string().trim().min(2).max(240).optional(),
      })
      .refine((patch) => Object.keys(patch).length > 0, {
        message: 'En az bir patch alani gonderilmelidir.',
      }),
  });

  const inviteCompanyMemberRoleSchema = z.enum(['admin', 'dispatcher', 'viewer']);

  const inviteCompanyMemberInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    email: z.string().trim().email().max(254),
    role: inviteCompanyMemberRoleSchema,
  });

  const acceptCompanyInviteInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
  });

  const declineCompanyInviteInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
  });

  const companyMemberRoleSchema = z.enum(['owner', 'admin', 'dispatcher', 'viewer']);
  const companyMemberStatusSchema = z.enum(['active', 'invited', 'suspended']);

  const updateCompanyMemberInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    memberUid: z.string().trim().min(1).max(128),
    patch: z
      .object({
        role: companyMemberRoleSchema.optional(),
        memberStatus: companyMemberStatusSchema.optional(),
      })
      .refine((patch) => Object.keys(patch).length > 0, {
        message: 'En az bir patch alani gonderilmelidir.',
      }),
  });

  const removeCompanyMemberInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    memberUid: z.string().trim().min(1).max(128),
  });

  const listCompanyInvitesInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    limit: z.number().int().min(1).max(500).optional().default(100),
  });

  const revokeCompanyInviteInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    inviteId: z.string().trim().min(1).max(128),
  });

  const listCompanyRoutesInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    includeArchived: z.boolean().optional().default(false),
    limit: z.number().int().min(1).max(500).optional().default(50),
  });

  const listCompanyRouteStopsInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
  });

  const listActiveTripsByCompanyInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128).nullable().optional(),
    driverUid: z.string().trim().min(1).max(128).nullable().optional(),
    limit: z.number().int().min(1).max(200).optional().default(50),
  });

  const listCompanyVehiclesInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    limit: z.number().int().min(1).max(500).optional().default(50),
  });

  const listCompanyDriversInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    limit: z.number().int().min(1).max(500).optional().default(100),
  });

  const createCompanyDriverAccountInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(24).optional(),
    plate: z.string().trim().min(2).max(20).optional(),
    loginEmail: z.string().trim().email().max(254).optional(),
    temporaryPassword: z.string().trim().min(8).max(64).optional(),
  });

  const assignCompanyDriverToRouteInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
  });

  const unassignCompanyDriverFromRouteInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
  });

  const updateCompanyDriverStatusInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128),
    status: z.enum(['active', 'passive']),
  });

  /* ─── Driver Document schemas ─── */
  const driverDocTypeSchema = z.enum(['ehliyet', 'src', 'psikoteknik', 'saglik']);

  const upsertDriverDocumentInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128),
    docType: driverDocTypeSchema,
    issueDate: z.string().trim().min(8).max(32).optional(),
    expiryDate: z.string().trim().min(8).max(32).optional(),
    licenseClass: z.string().trim().min(1).max(16).optional(),
    note: z.string().trim().max(500).optional(),
  });

  const listDriverDocumentsInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128).optional(),
  });

  const deleteDriverDocumentInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128),
    docType: driverDocTypeSchema,
  });

  const createCompanyRouteInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    name: z.string().trim().min(2).max(80),
    startPoint: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    startAddress: z.string().trim().min(3).max(256),
    endPoint: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    endAddress: z.string().trim().min(3).max(256),
    scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
    timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']),
    allowGuestTracking: z.boolean(),
    authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional().default([]),
    idempotencyKey: z.string().trim().min(4).max(128).optional(),
  });

  const updateCompanyRouteInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
    lastKnownUpdateToken: z.string().datetime().optional(),
    patch: z
      .object({
        name: z.string().trim().min(2).max(80).optional(),
        scheduledTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.')
          .optional(),
        timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']).optional(),
        allowGuestTracking: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional(),
      })
      .refine((patch) => Object.keys(patch).length > 0, {
        message: 'En az bir patch alani gonderilmelidir.',
      }),
  });

  const upsertCompanyRouteStopInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
    lastKnownUpdateToken: z.string().datetime().optional(),
    stopId: z.string().trim().min(1).max(128).optional(),
    name: z.string().trim().min(2).max(80),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    order: z.number().int().min(0).max(500),
  });

  const deleteCompanyRouteStopInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
    stopId: z.string().trim().min(1).max(128),
    lastKnownUpdateToken: z.string().datetime().optional(),
  });

  const reorderCompanyRouteStopsInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
    stopId: z.string().trim().min(1).max(128),
    direction: z.enum(['up', 'down']),
    lastKnownUpdateToken: z.string().datetime().optional(),
  });

  const routeDriverPermissionFlagsSchema = z.object({
    canStartFinishTrip: z.boolean(),
    canSendAnnouncements: z.boolean(),
    canViewPassengerList: z.boolean(),
    canEditAssignedRouteMeta: z.boolean(),
    canEditStops: z.boolean(),
    canManageRouteSchedule: z.boolean(),
  });

  const grantDriverRoutePermissionsInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
    driverUid: z.string().trim().min(1).max(128),
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
    permissions: routeDriverPermissionFlagsSchema,
  });

  const routeDriverPermissionKeySchema = z.enum([
    'canStartFinishTrip',
    'canSendAnnouncements',
    'canViewPassengerList',
    'canEditAssignedRouteMeta',
    'canEditStops',
    'canManageRouteSchedule',
  ]);

  const revokeDriverRoutePermissionsInputSchema = z
    .object({
      companyId: z.string().trim().min(1).max(128),
      routeId: z.string().trim().min(1).max(128),
      driverUid: z.string().trim().min(1).max(128),
      idempotencyKey: z.string().trim().min(8).max(128).optional(),
      permissionKeys: z.array(routeDriverPermissionKeySchema).max(6).optional().default([]),
      resetToDefault: z.boolean().optional().default(false),
    })
    .refine((value) => value.resetToDefault || value.permissionKeys.length > 0, {
      message: 'permissionKeys veya resetToDefault=true gonderilmelidir.',
    });

  const listRouteDriverPermissionsInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    routeId: z.string().trim().min(1).max(128),
  });

  const vehicleStatusSchema = z.enum(['active', 'maintenance', 'inactive']);

  const createVehicleInputSchema = z.object({
    ownerType: z.enum(['company', 'individual_driver']).optional().default('company'),
    companyId: z.string().trim().min(1).max(128),
    plate: z.string().trim().min(2).max(20),
    brand: z.string().trim().min(1).max(80).nullable().optional(),
    model: z.string().trim().min(1).max(80).nullable().optional(),
    year: z.number().int().min(1900).max(2100).nullable().optional(),
    capacity: z.number().int().min(1).max(200).nullable().optional(),
    status: vehicleStatusSchema.optional().default('active'),
  });

  const updateVehicleInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    vehicleId: z.string().trim().min(1).max(128),
    patch: z
      .object({
        plate: z.string().trim().min(2).max(20).optional(),
        brand: z.string().trim().min(1).max(80).nullable().optional(),
        model: z.string().trim().min(1).max(80).nullable().optional(),
        year: z.number().int().min(1900).max(2100).nullable().optional(),
        capacity: z.number().int().min(1).max(200).nullable().optional(),
        status: vehicleStatusSchema.optional(),
      })
      .refine((patch) => Object.keys(patch).length > 0, {
        message: 'En az bir patch alani gonderilmelidir.',
      }),
  });

  const createRouteInputSchema = z.object({
    name: z.string().trim().min(2).max(80),
    startPoint: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    startAddress: z.string().trim().min(3).max(256),
    endPoint: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    endAddress: z.string().trim().min(3).max(256),
    scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
    timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']),
    allowGuestTracking: z.boolean(),
    authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional().default([]),
  });

  const updateRouteInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    name: z.string().trim().min(2).max(80).optional(),
    startPoint: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
    startAddress: z.string().trim().min(3).max(256).optional(),
    endPoint: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
    endAddress: z.string().trim().min(3).max(256).optional(),
    scheduledTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.')
      .optional(),
    timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']).optional(),
    allowGuestTracking: z.boolean().optional(),
    authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional(),
    isArchived: z.boolean().optional(),
    vacationUntil: z.string().datetime().nullable().optional(),
  });

  const createRouteFromGhostDriveInputSchema = z.object({
    name: z.string().trim().min(2).max(80),
    tracePoints: z
      .array(
        z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
          accuracy: z.number().min(0).max(500),
          sampledAtMs: z.number().int().min(0),
        }),
      )
      .min(2),
    scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
    timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']),
    allowGuestTracking: z.boolean(),
    authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional().default([]),
  });

  const mapboxDirectionsProxyInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    origin: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    destination: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    waypoints: z
      .array(
        z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        }),
      )
      .max(mapboxDirectionsDefaultMaxWaypoints)
      .optional()
      .default([]),
    profile: z.enum(['driving', 'driving-traffic']).optional().default('driving'),
  });

  const mapboxMapMatchingProxyInputSchema = z.object({
    tracePoints: z
      .array(
        z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
          accuracy: z.number().min(0).max(500),
          sampledAtMs: z.number().int().min(0),
        }),
      )
      .min(2),
  });

  const generateRouteShareLinkInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    customText: z.string().trim().max(240).optional(),
  });

  const deleteUserDataInputSchema = z.object({
    dryRun: z.boolean().optional().default(false),
  });

  const dynamicRoutePreviewInputSchema = z.object({
    srvCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/),
    token: z.string().trim().min(16).max(512),
  });

  const upsertStopInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    stopId: z.string().trim().min(1).max(128).optional(),
    name: z.string().trim().min(2).max(80),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    order: z.number().int().min(0).max(500),
  });

  const deleteStopInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    stopId: z.string().trim().min(1).max(128),
  });

  const joinRouteBySrvCodeInputSchema = z.object({
    srvCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/),
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(24).optional(),
    showPhoneToDriver: z.boolean(),
    boardingArea: z.string().trim().min(1).max(120),
    notificationTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
  });

  const leaveRouteInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
  });

  const registerDeviceInputSchema = z.object({
    deviceId: z.string().trim().min(3).max(128),
    activeDeviceToken: z.string().trim().min(8).max(1024),
    lastSeenAt: z.string().datetime().optional(),
  });

  const updatePassengerSettingsInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    showPhoneToDriver: z.boolean(),
    phone: z.string().trim().min(7).max(24).optional(),
    boardingArea: z.string().trim().min(1).max(120),
    virtualStop: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
    virtualStopLabel: z.string().trim().min(1).max(120).optional(),
    notificationTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
  });

  const submitSkipTodayInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    idempotencyKey: z.string().trim().min(8).max(128),
  });

  const createGuestSessionInputSchema = z.object({
    srvCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/),
    ttlMinutes: z.number().int().min(5).max(60).optional(),
    name: z.string().trim().min(2).max(80).optional(),
  });

  const startTripInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    deviceId: z.string().trim().min(3).max(128),
    idempotencyKey: z.string().trim().min(8).max(128),
    expectedTransitionVersion: z.number().int().min(0),
  });

  const finishTripInputSchema = z.object({
    tripId: z.string().trim().min(1).max(128),
    deviceId: z.string().trim().min(3).max(128),
    idempotencyKey: z.string().trim().min(8).max(128),
    expectedTransitionVersion: z.number().int().min(0),
  });

  const sendDriverAnnouncementInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    templateKey: z.string().trim().min(1).max(64),
    customText: z.string().trim().min(1).max(240).optional(),
    idempotencyKey: z.string().trim().min(8).max(128),
  });

  const submitSupportReportInputSchema = z.object({
    source: z.enum(['settings', 'active_trip_sync', 'shake_shortcut']),
    userNote: z.string().trim().max(supportReportMaxNoteLength).optional(),
    routeId: z.string().trim().min(1).max(128).optional(),
    tripId: z.string().trim().min(1).max(128).optional(),
    diagnostics: z.record(z.string(), z.unknown()).optional().default({}),
    idempotencyKey: z.string().trim().min(8).max(128),
  });

  const openTripConversationInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    driverUid: z.string().trim().min(1).max(128).optional(),
    passengerUid: z.string().trim().min(1).max(128).optional(),
  });

  const sendTripMessageInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    conversationId: z.string().trim().min(1).max(128),
    text: z.string().trim().min(1).max(600),
    clientMessageId: z.string().trim().min(8).max(128).optional(),
  });

  const markTripConversationReadInputSchema = z.object({
    routeId: z.string().trim().min(1).max(128),
    conversationId: z.string().trim().min(1).max(128),
  });

  const searchDriverDirectoryInputSchema = z.object({
    queryHash: z
      .string()
      .trim()
      .min(8, 'minimum 8 karakter olmalidir.')
      .max(128, 'maksimum 128 karakter olmalidir.')
      .transform((value) => value.toLowerCase()),
    limit: z.number().int().min(1).max(driverSearchMaxLimit).optional().default(5),
  });

  const getCompanyProfileInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
  });

  const updateCompanyProfileInputSchema = z.object({
    companyId: z.string().trim().min(1).max(128),
    name: z.string().trim().min(2).max(120).optional(),
    logoUrl: z.string().trim().max(1024).optional(),
  });

  return {
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
    listCompanyInvitesInputSchema,
    revokeCompanyInviteInputSchema,
    listCompanyRoutesInputSchema,
    listCompanyRouteStopsInputSchema,
    listActiveTripsByCompanyInputSchema,
    listCompanyVehiclesInputSchema,
    listCompanyDriversInputSchema,
    createCompanyDriverAccountInputSchema,
    assignCompanyDriverToRouteInputSchema,
    unassignCompanyDriverFromRouteInputSchema,
    updateCompanyDriverStatusInputSchema,
    upsertDriverDocumentInputSchema,
    listDriverDocumentsInputSchema,
    deleteDriverDocumentInputSchema,
    createCompanyRouteInputSchema,
    updateCompanyRouteInputSchema,
    upsertCompanyRouteStopInputSchema,
    deleteCompanyRouteStopInputSchema,
    reorderCompanyRouteStopsInputSchema,
    grantDriverRoutePermissionsInputSchema,
    revokeDriverRoutePermissionsInputSchema,
    listRouteDriverPermissionsInputSchema,
    vehicleStatusSchema,
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
    getCompanyProfileInputSchema,
    updateCompanyProfileInputSchema,
  };
}
