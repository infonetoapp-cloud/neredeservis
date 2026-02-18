import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/application/transfer_local_ownership_after_account_link_use_case.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';

void main() {
  late LocalDriftDatabase database;
  late LocalQueueRepository repository;
  late TransferLocalOwnershipAfterAccountLinkUseCase useCase;

  setUp(() {
    database = LocalDriftDatabase(executor: NativeDatabase.memory());
    repository = LocalQueueRepository(database: database);
    useCase = TransferLocalOwnershipAfterAccountLinkUseCase(
      localQueueRepository: repository,
    );
  });

  tearDown(() async {
    await database.close();
  });

  test('execute migrates anonymous owner data to registered owner', () async {
    const previousOwnerUid = 'anon-uid-1';
    const newOwnerUid = 'user-uid-1';
    const migratedAtMs = 1739999900000;

    await repository.enqueueLocationSample(
      ownerUid: previousOwnerUid,
      routeId: 'route-1',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );
    await repository.enqueueTripAction(
      ownerUid: previousOwnerUid,
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"route-1"}',
      idempotencyKey: 'idem-usecase-1',
      createdAtMs: 1000,
    );

    await useCase.execute(
      previousOwnerUid: previousOwnerUid,
      newOwnerUid: newOwnerUid,
      migratedAt: DateTime.fromMillisecondsSinceEpoch(
        migratedAtMs,
        isUtc: true,
      ),
    );

    final locationRows =
        await database.select(database.locationQueueTable).get();
    final tripRows = await database.select(database.tripActionQueueTable).get();
    final metaRows = await database.select(database.localMetaTable).get();
    final metaMap = <String, String?>{
      for (final row in metaRows) row.key: row.value,
    };

    expect(locationRows, hasLength(1));
    expect(locationRows.first.ownerUid, newOwnerUid);

    expect(tripRows, hasLength(1));
    expect(tripRows.first.ownerUid, newOwnerUid);

    expect(metaMap['ownership.current_owner_uid'], newOwnerUid);
    expect(metaMap['ownership.previous_owner_uid'], previousOwnerUid);
    expect(metaMap['ownership.migrated_at_ms'], '$migratedAtMs');
  });

  test('execute uses utc now when migratedAt is not provided', () async {
    const previousOwnerUid = 'anon-uid-2';
    const newOwnerUid = 'user-uid-2';

    await repository.enqueueTripAction(
      ownerUid: previousOwnerUid,
      actionType: TripQueuedActionType.finishTrip,
      payloadJson: '{"tripId":"trip-2"}',
      idempotencyKey: 'idem-usecase-2',
      createdAtMs: 2000,
    );

    await useCase.execute(
      previousOwnerUid: previousOwnerUid,
      newOwnerUid: newOwnerUid,
    );

    final migratedAtRow = await (database.select(database.localMetaTable)
          ..where((LocalMetaTable tbl) =>
              tbl.key.equals('ownership.migrated_at_ms')))
        .getSingleOrNull();

    expect(migratedAtRow, isNotNull);
    expect(int.tryParse(migratedAtRow!.value ?? ''), isNotNull);
  });
}
