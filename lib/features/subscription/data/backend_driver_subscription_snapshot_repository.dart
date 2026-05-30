import '../../auth/data/current_auth_profile_snapshot_client.dart';
import '../domain/driver_subscription_snapshot.dart';
import '../domain/driver_subscription_snapshot_repository.dart';

class BackendDriverSubscriptionSnapshotRepository
    implements DriverSubscriptionSnapshotRepository {
  BackendDriverSubscriptionSnapshotRepository({
    CurrentAuthProfileSnapshotClient? snapshotClient,
  }) : _snapshotClient = snapshotClient ?? CurrentAuthProfileSnapshotClient();

  final CurrentAuthProfileSnapshotClient _snapshotClient;

  @override
  Future<DriverSubscriptionSnapshot> loadByDriverId(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != uid) {
        return const DriverSubscriptionSnapshot();
      }
      return parseDriverSubscriptionSnapshotFromDriverData(
        <String, dynamic>{
          'subscriptionStatus': snapshot.driverProfile?.subscriptionStatus,
          'trialEndsAt': snapshot.driverProfile?.trialEndsAt,
        },
      );
    } catch (_) {
      return const DriverSubscriptionSnapshot();
    }
  }
}
