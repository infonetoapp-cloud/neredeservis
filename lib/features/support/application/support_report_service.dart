import 'package:firebase_database/firebase_database.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/logging/runtime_log_buffer.dart';
import '../../domain/application/trip_action_sync_service.dart';
import '../../domain/data/local_queue_repository.dart';
import '../../domain/data/pii_filter_helper.dart';

enum SupportReportSource {
  settings,
  activeTripSync,
  shakeShortcut,
}

String supportReportSourceToRaw(SupportReportSource source) {
  switch (source) {
    case SupportReportSource.settings:
      return 'settings';
    case SupportReportSource.activeTripSync:
      return 'active_trip_sync';
    case SupportReportSource.shakeShortcut:
      return 'shake_shortcut';
  }
}

class SupportReportSubmissionResult {
  const SupportReportSubmissionResult({
    required this.state,
    this.reportId,
    this.queueId,
    this.errorCode,
    this.errorMessage,
  });

  final TripActionSyncState state;
  final String? reportId;
  final int? queueId;
  final String? errorCode;
  final String? errorMessage;
}

typedef SupportPermissionsProvider = Future<Map<String, String>> Function();
typedef SupportConnectionProvider = Future<Map<String, Object?>> Function();
typedef SupportBatteryProvider = Future<Map<String, Object?>> Function();
typedef SupportLogSummaryProvider = String Function({required Duration window});
typedef SupportNowProvider = DateTime Function();

class SupportReportService {
  SupportReportService({
    required TripActionSyncService tripActionSyncService,
    required LocalQueueRepository localQueueRepository,
    SupportPermissionsProvider? permissionsProvider,
    SupportConnectionProvider? connectionProvider,
    SupportBatteryProvider? batteryProvider,
    SupportLogSummaryProvider? logSummaryProvider,
    SupportNowProvider? nowUtc,
  })  : _tripActionSyncService = tripActionSyncService,
        _localQueueRepository = localQueueRepository,
        _permissionsProvider =
            permissionsProvider ?? _defaultPermissionsProvider,
        _connectionProvider = connectionProvider ?? _defaultConnectionProvider,
        _batteryProvider = batteryProvider ?? _defaultBatteryProvider,
        _logSummaryProvider = logSummaryProvider ?? _defaultLogSummaryProvider,
        _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());

  final TripActionSyncService _tripActionSyncService;
  final LocalQueueRepository _localQueueRepository;
  final SupportPermissionsProvider _permissionsProvider;
  final SupportConnectionProvider _connectionProvider;
  final SupportBatteryProvider _batteryProvider;
  final SupportLogSummaryProvider _logSummaryProvider;
  final SupportNowProvider _nowUtc;

  Future<SupportReportSubmissionResult> submit({
    required String ownerUid,
    required SupportReportSource source,
    required String idempotencyKey,
    String? userNote,
    String? routeId,
    String? tripId,
    bool? batteryDegradeModeEnabled,
  }) async {
    final queueMetrics =
        await _localQueueRepository.getQueueMetricsSnapshot(ownerUid: ownerUid);
    final permissions = await _permissionsProvider();
    final connection = await _connectionProvider();
    final battery = await _batteryProvider();
    final capturedAt = _nowUtc().toIso8601String();
    final note = (userNote ?? '').trim();
    final sourceRaw = supportReportSourceToRaw(source);
    final logSummary = _logSummaryProvider(window: const Duration(minutes: 5));

    final diagnostics = PiiFilterHelper.redactMap(
      <String, dynamic>{
        'capturedAt': capturedAt,
        'source': sourceRaw,
        'last5MinLogSummary': logSummary,
        'permissions': permissions,
        'connection': connection,
        'battery': <String, Object?>{
          ...battery,
          'degradeModeEnabled': batteryDegradeModeEnabled ?? false,
        },
        'queueMetrics': queueMetrics.toJson(),
      },
    );

    final payload = PiiFilterHelper.redactMap(
      <String, dynamic>{
        'source': sourceRaw,
        'routeId': routeId,
        'tripId': tripId,
        'userNote': note,
        'diagnostics': diagnostics,
        'idempotencyKey': idempotencyKey,
      },
    );

    final execution = await _tripActionSyncService.executeOrQueue(
      ownerUid: ownerUid,
      actionType: TripQueuedActionType.supportReport,
      callableName: 'submitSupportReport',
      payload: payload,
      idempotencyKey: idempotencyKey,
    );

    return SupportReportSubmissionResult(
      state: execution.state,
      reportId: (execution.responseData?['reportId'] as String?)?.trim(),
      queueId: execution.queueId,
      errorCode: execution.errorCode,
      errorMessage: execution.errorMessage,
    );
  }

  static Future<Map<String, String>> _defaultPermissionsProvider() async {
    final locationWhenInUse = await _safePermissionStatus(
      Permission.locationWhenInUse,
    );
    final locationAlways = await _safePermissionStatus(
      Permission.locationAlways,
    );
    final notification = await _safePermissionStatus(Permission.notification);
    return <String, String>{
      'locationWhenInUse': _permissionToLabel(locationWhenInUse),
      'locationAlways': _permissionToLabel(locationAlways),
      'notification': _permissionToLabel(notification),
    };
  }

  static Future<Map<String, Object?>> _defaultConnectionProvider() async {
    try {
      final snapshot =
          await FirebaseDatabase.instance.ref('.info/connected').get();
      final connected = snapshot.value == true;
      return <String, Object?>{
        'connectionType': connected ? 'online' : 'offline',
        'rtdbConnected': connected,
      };
    } catch (_) {
      return <String, Object?>{
        'connectionType': 'unknown',
        'rtdbConnected': null,
      };
    }
  }

  static Future<Map<String, Object?>> _defaultBatteryProvider() async {
    return const <String, Object?>{
      'levelPercent': null,
      'state': 'unknown',
    };
  }

  static String _defaultLogSummaryProvider({required Duration window}) {
    return RuntimeLogBuffer.instance.buildSummary(window: window);
  }

  static Future<PermissionStatus> _safePermissionStatus(
    Permission permission,
  ) async {
    try {
      return await permission.status;
    } catch (_) {
      return PermissionStatus.denied;
    }
  }

  static String _permissionToLabel(PermissionStatus status) {
    if (status.isGranted) {
      return 'granted';
    }
    if (status.isLimited) {
      return 'limited';
    }
    if (status.isPermanentlyDenied) {
      return 'permanently_denied';
    }
    if (status.isRestricted) {
      return 'restricted';
    }
    if (status.isProvisional) {
      return 'provisional';
    }
    return 'denied';
  }
}
