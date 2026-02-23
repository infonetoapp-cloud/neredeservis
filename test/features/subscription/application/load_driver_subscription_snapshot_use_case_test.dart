import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/subscription/application/load_driver_subscription_snapshot_use_case.dart';
import 'package:neredeservis/features/subscription/domain/driver_subscription_snapshot.dart';
import 'package:neredeservis/features/subscription/domain/driver_subscription_snapshot_repository.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';

void main() {
  group('LoadDriverSubscriptionSnapshotUseCase', () {
    test('returns default snapshot for empty uid and skips repository',
        () async {
      final repository = _FakeDriverSubscriptionSnapshotRepository();
      final useCase = LoadDriverSubscriptionSnapshotUseCase(
        repository: repository,
      );

      final result = await useCase.execute('   ');

      expect(result.status, SubscriptionUiStatus.mock);
      expect(result.trialDaysLeft, 0);
      expect(repository.calls, 0);
    });

    test('delegates to repository for non-empty uid', () async {
      final repository = _FakeDriverSubscriptionSnapshotRepository(
        snapshot: const DriverSubscriptionSnapshot(
          status: SubscriptionUiStatus.active,
          trialDaysLeft: 9,
        ),
      );
      final useCase = LoadDriverSubscriptionSnapshotUseCase(
        repository: repository,
      );

      final result = await useCase.execute('driver-1');

      expect(result.status, SubscriptionUiStatus.active);
      expect(result.trialDaysLeft, 9);
      expect(repository.calls, 1);
      expect(repository.lastUid, 'driver-1');
    });
  });
}

class _FakeDriverSubscriptionSnapshotRepository
    implements DriverSubscriptionSnapshotRepository {
  _FakeDriverSubscriptionSnapshotRepository({
    this.snapshot = const DriverSubscriptionSnapshot(),
  });

  final DriverSubscriptionSnapshot snapshot;
  int calls = 0;
  String? lastUid;

  @override
  Future<DriverSubscriptionSnapshot> loadByDriverId(String uid) async {
    calls++;
    lastUid = uid;
    return snapshot;
  }
}
