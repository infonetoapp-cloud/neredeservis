import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/application/trip_action_sync_service.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';
import 'package:neredeservis/features/support/application/support_report_service.dart';

void main() {
  group('SupportReportService', () {
    late LocalDriftDatabase database;
    late LocalQueueRepository repository;

    setUp(() {
      database = LocalDriftDatabase(executor: NativeDatabase.memory());
      repository = LocalQueueRepository(database: database);
    });

    tearDown(() async {
      await database.close();
    });

    test('submits redacted diagnostics payload when remote call succeeds',
        () async {
      String? capturedCallableName;
      Map<String, dynamic>? capturedPayload;
      final tripActionSyncService = TripActionSyncService(
        localQueueRepository: repository,
        remoteExecutor: (callableName, payload) async {
          capturedCallableName = callableName;
          capturedPayload = payload;
          return const <String, dynamic>{
            'reportId': 'support_report_1',
          };
        },
      );
      final service = SupportReportService(
        tripActionSyncService: tripActionSyncService,
        localQueueRepository: repository,
        nowUtc: () => DateTime.utc(2026, 2, 19, 12, 0, 0),
        permissionsProvider: () async => const <String, String>{
          'locationWhenInUse': 'granted',
          'locationAlways': 'denied',
          'notification': 'denied',
        },
        connectionProvider: () async => const <String, Object?>{
          'connectionType': 'online',
          'rtdbConnected': true,
        },
        batteryProvider: () async => const <String, Object?>{
          'levelPercent': 77,
          'state': 'charging',
        },
        logSummaryProvider: ({required Duration window}) =>
            'error mail test@example.com phone +90 555 111 22 33',
      );

      final result = await service.submit(
        ownerUid: 'driver-1',
        source: SupportReportSource.settings,
        userNote: 'Bana test@example.com mail at, tel +90 555 111 22 33',
        idempotencyKey: 'idem_support_0001',
      );

      expect(result.state, TripActionSyncState.synced);
      expect(result.reportId, 'support_report_1');
      expect(capturedCallableName, 'submitSupportReport');
      expect(capturedPayload, isNotNull);
      final payload = capturedPayload!;
      final userNote = payload['userNote'] as String;
      expect(userNote, contains('[EMAIL]'));
      expect(userNote, contains('[PHONE]'));
      expect(userNote, isNot(contains('test@example.com')));

      final diagnostics = payload['diagnostics'] as Map<String, dynamic>;
      final logSummary = diagnostics['last5MinLogSummary'] as String;
      expect(logSummary, contains('[EMAIL]'));
      expect(logSummary, contains('[PHONE]'));
      expect(logSummary, isNot(contains('+90 555 111 22 33')));
      expect(diagnostics['queueMetrics'], isA<Map<String, dynamic>>());
    });

    test('queues support report when remote call is unavailable', () async {
      final tripActionSyncService = TripActionSyncService(
        localQueueRepository: repository,
        remoteExecutor: (_, __) => Future<Map<String, dynamic>>.error(
          Exception('offline'),
        ),
      );
      final service = SupportReportService(
        tripActionSyncService: tripActionSyncService,
        localQueueRepository: repository,
        permissionsProvider: () async => const <String, String>{},
        connectionProvider: () async => const <String, Object?>{},
        batteryProvider: () async => const <String, Object?>{},
        logSummaryProvider: ({required Duration window}) => 'empty',
      );

      final result = await service.submit(
        ownerUid: 'driver-2',
        source: SupportReportSource.activeTripSync,
        userNote: 'offline iken report denemesi',
        routeId: 'route-2',
        tripId: 'trip-2',
        idempotencyKey: 'idem_support_0002',
      );

      expect(result.state, TripActionSyncState.pendingSync);
      final queuedRows =
          await repository.loadPendingTripActions(ownerUid: 'driver-2');
      expect(queuedRows, hasLength(1));
      expect(
        queuedRows.first.actionType,
        TripQueuedActionTypeCodec.toRaw(TripQueuedActionType.supportReport),
      );
    });
  });
}
