import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';

class _LocalDriftDatabaseV2ForTest extends LocalDriftDatabase {
  _LocalDriftDatabaseV2ForTest({
    required QueryExecutor executor,
  }) : super(executor: executor);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          // Dry-run upgrade path: no schema change, data must stay intact.
        },
        beforeOpen: (OpeningDetails details) async {},
      );
}

void main() {
  test('v1->v2 dry-run keeps ownerUid and queue records', () async {
    final tempDir = await Directory.systemTemp.createTemp('ns_drift_migration');
    final dbFile =
        File('${tempDir.path}${Platform.pathSeparator}local_drift_test.db');

    try {
      final v1 = LocalDriftDatabase(executor: NativeDatabase(dbFile));

      await v1.into(v1.locationQueueTable).insert(
            LocationQueueTableCompanion.insert(
              ownerUid: 'guest-owner',
              routeId: 'route-101',
              tripId: const Value('trip-101'),
              lat: 40.91,
              lng: 29.31,
              speed: const Value(11.0),
              heading: const Value(88.0),
              accuracy: 5.0,
              sampledAt: 1739880001000,
              createdAt: const Value(1739880001000),
              retryCount: const Value(1),
              nextRetryAt: const Value(1739880005000),
            ),
          );

      await v1.into(v1.tripActionQueueTable).insert(
            TripActionQueueTableCompanion.insert(
              ownerUid: 'guest-owner',
              actionType: 'start_trip',
              status: const Value('pending'),
              payloadJson: '{"routeId":"route-101"}',
              idempotencyKey: 'idem-101',
              createdAt: const Value(1739880001000),
              failedRetryCount: const Value(0),
              retryCount: const Value(1),
              nextRetryAt: const Value(1739880005000),
              localMeta: const Value('meta-v1'),
            ),
          );

      await v1.close();

      final v2 = _LocalDriftDatabaseV2ForTest(executor: NativeDatabase(dbFile));

      final locationRows = await v2.select(v2.locationQueueTable).get();
      final tripActionRows = await v2.select(v2.tripActionQueueTable).get();

      expect(locationRows, hasLength(1));
      expect(locationRows.first.ownerUid, 'guest-owner');
      expect(locationRows.first.routeId, 'route-101');
      expect(locationRows.first.tripId, 'trip-101');

      expect(tripActionRows, hasLength(1));
      expect(tripActionRows.first.ownerUid, 'guest-owner');
      expect(tripActionRows.first.idempotencyKey, 'idem-101');
      expect(tripActionRows.first.payloadJson, '{"routeId":"route-101"}');
      expect(tripActionRows.first.status, 'pending');
      expect(tripActionRows.first.localMeta, 'meta-v1');

      await v2.close();
    } finally {
      if (await dbFile.exists()) {
        await dbFile.delete();
      }
      await tempDir.delete(recursive: true);
    }
  });
}
