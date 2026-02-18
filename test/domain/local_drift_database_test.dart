import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';

void main() {
  late LocalDriftDatabase database;

  setUp(() {
    database = LocalDriftDatabase(executor: NativeDatabase.memory());
  });

  tearDown(() async {
    await database.close();
  });

  test('schema version is fixed to v1', () {
    expect(database.schemaVersion, 1);
  });

  test('required queue tables are created', () async {
    final rows = await database
        .customSelect(
          "SELECT name FROM sqlite_master WHERE type='table'",
        )
        .get();
    final names = rows.map((QueryRow row) => row.read<String>('name')).toSet();

    expect(
      names,
      containsAll(<String>[
        'location_queue',
        'trip_action_queue',
        'local_meta',
      ]),
    );
  });

  test('trip_action_queue contains required reliability columns', () async {
    final rows = await database
        .customSelect(
          'PRAGMA table_info(trip_action_queue)',
        )
        .get();
    final names = rows.map((QueryRow row) => row.read<String>('name')).toSet();

    expect(
      names,
      containsAll(<String>[
        'status',
        'failed_retry_count',
        'next_retry_at',
        'max_retry_reached_at',
        'local_meta',
      ]),
    );
  });
}
