import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';
import 'package:neredeservis/features/domain/entities/live_location_entity.dart';
import 'package:neredeservis/features/location/application/location_publish_service.dart';
import 'package:neredeservis/services/repository_interfaces.dart';

void main() {
  late LocalDriftDatabase database;
  late LocalQueueRepository localQueueRepository;
  late _FakeLiveLocationRepository liveLocationRepository;
  late List<LocationHistorySampleRecord> historySamples;
  late DateTime fixedNowUtc;
  late LocationPublishService Function() buildService;

  setUp(() {
    database = LocalDriftDatabase(executor: NativeDatabase.memory());
    localQueueRepository = LocalQueueRepository(database: database);
    liveLocationRepository = _FakeLiveLocationRepository();
    historySamples = <LocationHistorySampleRecord>[];
    fixedNowUtc = DateTime.utc(2026, 2, 19, 12, 0, 0);
    buildService = () {
      return LocationPublishService(
        liveLocationRepository: liveLocationRepository,
        localQueueRepository: localQueueRepository,
        historyWriter: (sample) async {
          historySamples.add(sample);
        },
        nowUtc: () => fixedNowUtc,
      );
    };
  });

  tearDown(() async {
    await database.close();
  });

  test('publish sends fresh sample to live RTDB path', () async {
    final service = buildService();
    final nowMs = fixedNowUtc.millisecondsSinceEpoch;

    final result = await service.publish(
      LocationPublishInput(
        ownerUid: 'driver-1',
        routeId: 'route-1',
        tripId: 'trip-1',
        lat: 40.9,
        lng: 29.3,
        accuracy: 5,
        speed: 12,
        heading: 88,
        sampledAtMs: nowMs - 10000,
        createdAtMs: nowMs - 10000,
      ),
    );

    expect(result.outcome, LocationPublishOutcome.publishedLive);
    expect(liveLocationRepository.upserted, hasLength(1));
    expect(historySamples, isEmpty);
  });

  test('publish queues sample when live write fails', () async {
    liveLocationRepository.shouldFailUpsert = true;
    final service = buildService();
    final nowMs = fixedNowUtc.millisecondsSinceEpoch;

    final result = await service.publish(
      LocationPublishInput(
        ownerUid: 'driver-2',
        routeId: 'route-2',
        lat: 40.91,
        lng: 29.31,
        accuracy: 4,
        sampledAtMs: nowMs - 10000,
        createdAtMs: nowMs - 10000,
      ),
    );

    expect(result.outcome, LocationPublishOutcome.queuedForRetry);
    expect(result.queueId, isNotNull);
    expect(liveLocationRepository.upserted, isEmpty);
    expect(historySamples, isEmpty);

    final queued = await localQueueRepository.loadReplayableLocationSamples(
      nowMs: nowMs,
      limit: 10,
    );
    expect(queued, hasLength(1));
  });

  test('publish writes stale sample only to history path', () async {
    final service = buildService();
    final nowMs = fixedNowUtc.millisecondsSinceEpoch;

    final result = await service.publish(
      LocationPublishInput(
        ownerUid: 'driver-3',
        routeId: 'route-3',
        tripId: 'trip-3',
        lat: 40.92,
        lng: 29.32,
        accuracy: 6,
        sampledAtMs: nowMs - 70000,
        createdAtMs: nowMs - 70000,
      ),
    );

    expect(result.outcome, LocationPublishOutcome.publishedHistoryOnly);
    expect(liveLocationRepository.upserted, isEmpty);
    expect(historySamples, hasLength(1));
    expect(historySamples.first.source, 'offline_replay');
  });

  test('flushQueued replays stale row as history-only and drops queue row',
      () async {
    final service = buildService();
    final nowMs = fixedNowUtc.millisecondsSinceEpoch;

    await localQueueRepository.enqueueLocationSample(
      ownerUid: 'driver-4',
      routeId: 'route-4',
      tripId: 'trip-4',
      lat: 40.93,
      lng: 29.33,
      accuracy: 5,
      sampledAtMs: nowMs - 70000,
      createdAtMs: nowMs - 70000,
    );

    final summary = await service.flushQueued(
      ownerUid: 'driver-4',
      limit: 10,
    );

    expect(summary.publishedHistoryOnlyCount, 1);
    expect(summary.publishedLiveCount, 0);
    expect(summary.queuedForRetryCount, 0);
    expect(historySamples, hasLength(1));
    expect(liveLocationRepository.upserted, isEmpty);

    final remainingRows =
        await database.select(database.locationQueueTable).get();
    expect(remainingRows, isEmpty);
  });

  test('flushQueued marks retry when live replay fails', () async {
    liveLocationRepository.shouldFailUpsert = true;
    final service = buildService();
    final nowMs = fixedNowUtc.millisecondsSinceEpoch;

    final rowId = await localQueueRepository.enqueueLocationSample(
      ownerUid: 'driver-5',
      routeId: 'route-5',
      tripId: 'trip-5',
      lat: 40.94,
      lng: 29.34,
      accuracy: 5,
      sampledAtMs: nowMs - 10000,
      createdAtMs: nowMs - 10000,
    );

    final summary = await service.flushQueued(
      ownerUid: 'driver-5',
      limit: 10,
    );

    expect(summary.publishedHistoryOnlyCount, 0);
    expect(summary.publishedLiveCount, 0);
    expect(summary.queuedForRetryCount, 1);

    final row = await (database.select(database.locationQueueTable)
          ..where((tbl) => tbl.id.equals(rowId)))
        .getSingle();
    expect(row.retryCount, 1);
  });
}

class _FakeLiveLocationRepository implements LiveLocationRepository {
  bool shouldFailUpsert = false;
  final List<LiveLocationEntity> upserted = <LiveLocationEntity>[];

  @override
  Future<void> clearLiveLocation(String routeId) async {}

  @override
  Future<LiveLocationEntity?> getLiveLocation(String routeId) async => null;

  @override
  Future<void> upsertLiveLocation(LiveLocationEntity location) async {
    if (shouldFailUpsert) {
      throw Exception('simulated-write-failure');
    }
    upserted.add(location);
  }

  @override
  Stream<LiveLocationEntity?> watchLiveLocation(String routeId) {
    return const Stream<LiveLocationEntity?>.empty();
  }
}
