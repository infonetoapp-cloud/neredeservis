import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';

part 'local_drift_database.g.dart';

class LocationQueueTable extends Table {
  @override
  String get tableName => 'location_queue';

  IntColumn get id => integer().autoIncrement()();

  TextColumn get ownerUid => text().named('owner_uid')();

  TextColumn get routeId => text().named('route_id')();

  TextColumn get tripId => text().named('trip_id').nullable()();

  RealColumn get lat => real()();

  RealColumn get lng => real()();

  RealColumn get speed => real().nullable()();

  RealColumn get heading => real().nullable()();

  RealColumn get accuracy => real()();

  IntColumn get sampledAt => integer().named('sampled_at')();

  IntColumn get createdAt =>
      integer().named('created_at').withDefault(const Constant(0))();

  IntColumn get retryCount =>
      integer().named('retry_count').withDefault(const Constant(0))();

  IntColumn get nextRetryAt => integer().named('next_retry_at').nullable()();
}

class TripActionQueueTable extends Table {
  @override
  String get tableName => 'trip_action_queue';

  IntColumn get id => integer().autoIncrement()();

  TextColumn get ownerUid => text().named('owner_uid')();

  TextColumn get actionType => text().named('action_type')();

  TextColumn get status =>
      text().withDefault(const Constant('pending')).named('status')();

  TextColumn get payloadJson => text().named('payload_json')();

  TextColumn get idempotencyKey => text().named('idempotency_key')();

  IntColumn get createdAt =>
      integer().named('created_at').withDefault(const Constant(0))();

  IntColumn get failedRetryCount =>
      integer().named('failed_retry_count').withDefault(const Constant(0))();

  IntColumn get retryCount =>
      integer().named('retry_count').withDefault(const Constant(0))();

  IntColumn get nextRetryAt => integer().named('next_retry_at').nullable()();

  TextColumn get lastErrorCode => text().named('last_error_code').nullable()();

  IntColumn get lastErrorAt => integer().named('last_error_at').nullable()();

  IntColumn get maxRetryReachedAt =>
      integer().named('max_retry_reached_at').nullable()();

  TextColumn get localMeta => text().named('local_meta').nullable()();
}

class LocalMetaTable extends Table {
  @override
  String get tableName => 'local_meta';

  TextColumn get key => text()();

  TextColumn get value => text().nullable()();

  @override
  Set<Column<Object>>? get primaryKey => <Column<Object>>{key};
}

@DriftDatabase(
  tables: <Type>[
    LocationQueueTable,
    TripActionQueueTable,
    LocalMetaTable,
  ],
)
class LocalDriftDatabase extends _$LocalDriftDatabase {
  LocalDriftDatabase({
    QueryExecutor? executor,
  }) : super(executor ?? _openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          // Explicit migration steps will be added per schema increment.
        },
        beforeOpen: (OpeningDetails details) async {
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final directory = await getApplicationDocumentsDirectory();
    final filePath =
        '${directory.path}${Platform.pathSeparator}nerede_servis_local.db';
    return NativeDatabase.createInBackground(File(filePath));
  });
}
