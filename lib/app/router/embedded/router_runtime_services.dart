part of '../app_router.dart';

const LocationPermissionGate _locationPermissionGate = LocationPermissionGate();
final IosLocationPermissionOrchestrator _iosLocationPermissionOrchestrator =
    IosLocationPermissionOrchestrator();
final NotificationPermissionOrchestrator _notificationPermissionOrchestrator =
    NotificationPermissionOrchestrator();
final NotificationPermissionFallbackService
    _notificationPermissionFallbackService =
    NotificationPermissionFallbackService();
final AndroidLocationBackgroundService _androidLocationBackgroundService =
    AndroidLocationBackgroundService();
final AndroidBatteryOptimizationOrchestrator
    _androidBatteryOptimizationOrchestrator =
    AndroidBatteryOptimizationOrchestrator();
final BatteryOptimizationFallbackService _batteryOptimizationFallbackService =
    BatteryOptimizationFallbackService();
final IosSilentKillMitigationService _iosSilentKillMitigationService =
    IosSilentKillMitigationService();
final ProfilePhotoUploadService _profilePhotoUploadService =
    ProfilePhotoUploadService();
final MobileTelemetry _mobileTelemetry = MobileTelemetry.instance;
final LocalDriftDatabase _offlineQueueDatabase = LocalDriftDatabase();
final LocalQueueRepository _localQueueRepository = LocalQueueRepository(
  database: _offlineQueueDatabase,
);
final LocationPublishService _locationPublishService = LocationPublishService(
  liveLocationRepository: RtdbLiveLocationRepository(),
  localQueueRepository: _localQueueRepository,
  metricListener: _recordLocationPublishMetric,
);
final TripActionSyncService _tripActionSyncService = TripActionSyncService(
  localQueueRepository: _localQueueRepository,
);
final SupportReportService _supportReportService = SupportReportService(
  tripActionSyncService: _tripActionSyncService,
  localQueueRepository: _localQueueRepository,
);
final QueueFlushOrchestrator _queueFlushOrchestrator = QueueFlushOrchestrator(
  localQueueRepository: _localQueueRepository,
  tripActionSyncService: _tripActionSyncService,
  locationPublishService: _locationPublishService,
);
final BackgroundQueueFlushScheduler _backgroundQueueFlushScheduler =
    BackgroundQueueFlushScheduler();
final PassengerNotificationUiService _passengerNotificationUiService =
    PassengerNotificationUiService();
final RouteTopicSubscriptionService _routeTopicSubscriptionService =
    RouteTopicSubscriptionService();
final FirebaseDriverDeviceRegistrationInvoker _driverDeviceRegistrationInvoker =
    FirebaseDriverDeviceRegistrationInvoker();
const RouterFirebaseRuntimeGateway _routerFirebaseRuntimeGateway =
    routerFirebaseRuntimeGateway;
final DriverPushTokenRegistrationService _driverPushTokenRegistrationService =
    DriverPushTokenRegistrationService(
  registerInvoker: _driverDeviceRegistrationInvoker.invoke,
  tokenFetcher: _routerFirebaseRuntimeGateway.fetchMessagingToken,
  tokenRefreshStreamProvider: () =>
      _routerFirebaseRuntimeGateway.messagingTokenRefreshStream,
  devicePlatformKey: _devicePlatformKey(),
);
final FirebaseFirestore _firestore = _routerFirebaseRuntimeGateway.firestore;
final FirebaseFunctions _firebaseFunctions =
    _routerFirebaseRuntimeGateway.functions;
final AuthCredentialGateway _authCredentialGateway =
    FirebaseAuthCredentialGateway();
