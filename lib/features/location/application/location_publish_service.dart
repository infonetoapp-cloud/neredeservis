import 'package:firebase_database/firebase_database.dart';

import '../../../services/repository_interfaces.dart';
import '../../domain/data/local_drift_database.dart';
import '../../domain/data/local_queue_repository.dart';
import '../../domain/entities/live_location_entity.dart';

enum LocationPublishOutcome {
  publishedLive,
  publishedHistoryOnly,
  queuedForRetry,
}

class LocationPublishResult {
  const LocationPublishResult({
    required this.outcome,
    this.queueId,
  });

  final LocationPublishOutcome outcome;
  final int? queueId;
}

class LocationFlushSummary {
  const LocationFlushSummary({
    required this.publishedLiveCount,
    required this.publishedHistoryOnlyCount,
    required this.queuedForRetryCount,
  });

  final int publishedLiveCount;
  final int publishedHistoryOnlyCount;
  final int queuedForRetryCount;
}

class LocationPublishInput {
  const LocationPublishInput({
    required this.ownerUid,
    required this.routeId,
    required this.lat,
    required this.lng,
    required this.accuracy,
    required this.sampledAtMs,
    required this.createdAtMs,
    this.tripId,
    this.speed,
    this.heading,
  });

  final String ownerUid;
  final String routeId;
  final double lat;
  final double lng;
  final double accuracy;
  final int sampledAtMs;
  final int createdAtMs;
  final String? tripId;
  final double? speed;
  final double? heading;
}

class LocationHistorySampleRecord {
  const LocationHistorySampleRecord({
    required this.routeId,
    required this.driverId,
    required this.lat,
    required this.lng,
    required this.accuracy,
    required this.sampledAtMs,
    required this.recordedAtMs,
    required this.source,
    this.tripId,
    this.speed,
    this.heading,
  });

  final String routeId;
  final String driverId;
  final double lat;
  final double lng;
  final double accuracy;
  final int sampledAtMs;
  final int recordedAtMs;
  final String source;
  final String? tripId;
  final double? speed;
  final double? heading;

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'routeId': routeId,
      'driverId': driverId,
      'tripId': tripId,
      'lat': lat,
      'lng': lng,
      'accuracy': accuracy,
      'speed': speed,
      'heading': heading,
      'sampledAtMs': sampledAtMs,
      'recordedAtMs': recordedAtMs,
      'source': source,
    };
  }
}

typedef LocationHistoryWriter = Future<void> Function(
  LocationHistorySampleRecord sample,
);

class LocationPublishService {
  LocationPublishService({
    required LiveLocationRepository liveLocationRepository,
    required LocalQueueRepository localQueueRepository,
    LocationHistoryWriter? historyWriter,
    FirebaseDatabase? database,
    DateTime Function()? nowUtc,
    this.staleReplayThresholdMs = LocalQueueRepository.staleReplayThresholdMs,
  })  : _liveLocationRepository = liveLocationRepository,
        _localQueueRepository = localQueueRepository,
        _historyWriter = historyWriter ??
            _buildDefaultHistoryWriter(database ?? FirebaseDatabase.instance),
        _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());

  final LiveLocationRepository _liveLocationRepository;
  final LocalQueueRepository _localQueueRepository;
  final LocationHistoryWriter _historyWriter;
  final DateTime Function() _nowUtc;
  final int staleReplayThresholdMs;

  Future<LocationPublishResult> publish(LocationPublishInput input) async {
    final nowMs = _nowUtc().millisecondsSinceEpoch;
    final skipLive = LocalQueueRepository.shouldSkipLiveReplay(
      sampledAtMs: input.sampledAtMs,
      nowMs: nowMs,
      thresholdMs: staleReplayThresholdMs,
    );

    if (skipLive) {
      return _writeHistoryOnlyOrQueue(
        ownerUid: input.ownerUid,
        routeId: input.routeId,
        tripId: input.tripId,
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
        speed: input.speed,
        heading: input.heading,
        sampledAtMs: input.sampledAtMs,
        createdAtMs: input.createdAtMs,
        source: 'offline_replay',
      );
    }

    try {
      await _liveLocationRepository.upsertLiveLocation(
        LiveLocationEntity(
          routeId: input.routeId,
          lat: input.lat,
          lng: input.lng,
          speed: input.speed ?? 0,
          heading: input.heading ?? 0,
          accuracy: input.accuracy,
          timestampMs: input.sampledAtMs,
          tripId: input.tripId ?? '',
          driverId: input.ownerUid,
        ),
      );
      return const LocationPublishResult(
        outcome: LocationPublishOutcome.publishedLive,
      );
    } catch (_) {
      final queueId = await _localQueueRepository.enqueueLocationSample(
        ownerUid: input.ownerUid,
        routeId: input.routeId,
        tripId: input.tripId,
        lat: input.lat,
        lng: input.lng,
        speed: input.speed,
        heading: input.heading,
        accuracy: input.accuracy,
        sampledAtMs: input.sampledAtMs,
        createdAtMs: input.createdAtMs,
      );
      return LocationPublishResult(
        outcome: LocationPublishOutcome.queuedForRetry,
        queueId: queueId,
      );
    }
  }

  Future<LocationFlushSummary> flushQueued({
    required String ownerUid,
    int limit = 20,
  }) async {
    final nowMs = _nowUtc().millisecondsSinceEpoch;
    final replayable =
        await _localQueueRepository.loadReplayableLocationSamples(
      nowMs: nowMs,
      limit: limit,
    );

    var publishedLiveCount = 0;
    var publishedHistoryOnlyCount = 0;
    var queuedForRetryCount = 0;

    for (final row in replayable) {
      final result = await _replaySingleQueuedRow(
        row: row,
        ownerUid: ownerUid,
      );
      switch (result.outcome) {
        case LocationPublishOutcome.publishedLive:
          publishedLiveCount++;
        case LocationPublishOutcome.publishedHistoryOnly:
          publishedHistoryOnlyCount++;
        case LocationPublishOutcome.queuedForRetry:
          queuedForRetryCount++;
      }
    }

    return LocationFlushSummary(
      publishedLiveCount: publishedLiveCount,
      publishedHistoryOnlyCount: publishedHistoryOnlyCount,
      queuedForRetryCount: queuedForRetryCount,
    );
  }

  Future<LocationPublishResult> _replaySingleQueuedRow({
    required LocationQueueTableData row,
    required String ownerUid,
  }) async {
    final nowMs = _nowUtc().millisecondsSinceEpoch;
    final skipLive = LocalQueueRepository.shouldSkipLiveReplay(
      sampledAtMs: row.sampledAt,
      nowMs: nowMs,
      thresholdMs: staleReplayThresholdMs,
    );

    if (skipLive) {
      try {
        await _historyWriter(
          LocationHistorySampleRecord(
            routeId: row.routeId,
            driverId: ownerUid,
            tripId: row.tripId,
            lat: row.lat,
            lng: row.lng,
            accuracy: row.accuracy,
            speed: row.speed,
            heading: row.heading,
            sampledAtMs: row.sampledAt,
            recordedAtMs: nowMs,
            source: 'offline_replay',
          ),
        );
        await _localQueueRepository.markLocationSampleSent(row.id);
        return const LocationPublishResult(
          outcome: LocationPublishOutcome.publishedHistoryOnly,
        );
      } catch (_) {
        await _localQueueRepository.markLocationSampleFailure(
          id: row.id,
          nowMs: nowMs,
        );
        return const LocationPublishResult(
          outcome: LocationPublishOutcome.queuedForRetry,
        );
      }
    }

    try {
      await _liveLocationRepository.upsertLiveLocation(
        LiveLocationEntity(
          routeId: row.routeId,
          lat: row.lat,
          lng: row.lng,
          speed: row.speed ?? 0,
          heading: row.heading ?? 0,
          accuracy: row.accuracy,
          timestampMs: row.sampledAt,
          tripId: row.tripId ?? '',
          driverId: ownerUid,
        ),
      );
      await _localQueueRepository.markLocationSampleSent(row.id);
      return const LocationPublishResult(
        outcome: LocationPublishOutcome.publishedLive,
      );
    } catch (_) {
      await _localQueueRepository.markLocationSampleFailure(
        id: row.id,
        nowMs: nowMs,
      );
      return const LocationPublishResult(
        outcome: LocationPublishOutcome.queuedForRetry,
      );
    }
  }

  Future<LocationPublishResult> _writeHistoryOnlyOrQueue({
    required String ownerUid,
    required String routeId,
    required String? tripId,
    required double lat,
    required double lng,
    required double accuracy,
    required double? speed,
    required double? heading,
    required int sampledAtMs,
    required int createdAtMs,
    required String source,
  }) async {
    final nowMs = _nowUtc().millisecondsSinceEpoch;
    try {
      await _historyWriter(
        LocationHistorySampleRecord(
          routeId: routeId,
          driverId: ownerUid,
          tripId: tripId,
          lat: lat,
          lng: lng,
          accuracy: accuracy,
          speed: speed,
          heading: heading,
          sampledAtMs: sampledAtMs,
          recordedAtMs: nowMs,
          source: source,
        ),
      );
      return const LocationPublishResult(
        outcome: LocationPublishOutcome.publishedHistoryOnly,
      );
    } catch (_) {
      final queueId = await _localQueueRepository.enqueueLocationSample(
        ownerUid: ownerUid,
        routeId: routeId,
        tripId: tripId,
        lat: lat,
        lng: lng,
        speed: speed,
        heading: heading,
        accuracy: accuracy,
        sampledAtMs: sampledAtMs,
        createdAtMs: createdAtMs,
      );
      return LocationPublishResult(
        outcome: LocationPublishOutcome.queuedForRetry,
        queueId: queueId,
      );
    }
  }

  static LocationHistoryWriter _buildDefaultHistoryWriter(
    FirebaseDatabase database,
  ) {
    return (sample) async {
      await database
          .ref('location_history/${sample.routeId}')
          .push()
          .set(sample.toMap());
    };
  }
}
