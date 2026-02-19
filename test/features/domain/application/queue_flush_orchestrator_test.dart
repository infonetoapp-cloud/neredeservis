import 'dart:convert';

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/application/queue_flush_orchestrator.dart';
import 'package:neredeservis/features/domain/application/trip_action_sync_service.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';
import 'package:neredeservis/features/domain/entities/live_location_entity.dart';
import 'package:neredeservis/features/location/application/location_publish_service.dart';
import 'package:neredeservis/services/repository_interfaces.dart';

void main() {
  test('flushAll replays trip actions before location queue (327)', () async {
    final database = LocalDriftDatabase(executor: NativeDatabase.memory());
    final repository = LocalQueueRepository(database: database);
    final callOrder = <String>[];

    await repository.enqueueTripAction(
      ownerUid: 'driver-1',
      actionType: TripQueuedActionType.finishTrip,
      payloadJson: jsonEncode(
        const <String, dynamic>{
          'callableName': 'finishTrip',
          'payload': <String, dynamic>{
            'tripId': 'trip-1',
            'deviceId': 'android_driver',
          },
        },
      ),
      idempotencyKey: 'idem-order-1',
      createdAtMs: 1000,
    );
    await repository.enqueueLocationSample(
      ownerUid: 'driver-1',
      routeId: 'route-1',
      tripId: 'trip-1',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5,
      sampledAtMs: 2000,
      createdAtMs: 2000,
    );

    final tripActionService = TripActionSyncService(
      localQueueRepository: repository,
      remoteExecutor: (_, __) async {
        callOrder.add('trip');
        return const <String, dynamic>{'ok': true};
      },
      nowUtc: () => DateTime.fromMillisecondsSinceEpoch(5000, isUtc: true),
    );
    final locationService = LocationPublishService(
      liveLocationRepository: _FakeLiveLocationRepository(callOrder: callOrder),
      localQueueRepository: repository,
      historyWriter: (_) async {},
      nowUtc: () => DateTime.fromMillisecondsSinceEpoch(5000, isUtc: true),
    );
    final orchestrator = QueueFlushOrchestrator(
      localQueueRepository: repository,
      tripActionSyncService: tripActionService,
      locationPublishService: locationService,
    );

    final summary = await orchestrator.flushAll(ownerUid: 'driver-1');
    expect(summary.tripActionReplay.syncedCount, 1);
    expect(summary.locationReplay.publishedLiveCount, 1);
    expect(callOrder, isNotEmpty);
    expect(callOrder.first, 'trip');
    expect(callOrder.last, 'location');

    await database.close();
  });
}

class _FakeLiveLocationRepository implements LiveLocationRepository {
  _FakeLiveLocationRepository({
    required this.callOrder,
  });

  final List<String> callOrder;

  @override
  Future<void> clearLiveLocation(String routeId) async {}

  @override
  Future<LiveLocationEntity?> getLiveLocation(String routeId) async => null;

  @override
  Future<void> upsertLiveLocation(LiveLocationEntity location) async {
    callOrder.add('location');
  }

  @override
  Stream<LiveLocationEntity?> watchLiveLocation(String routeId) {
    return const Stream<LiveLocationEntity?>.empty();
  }
}
