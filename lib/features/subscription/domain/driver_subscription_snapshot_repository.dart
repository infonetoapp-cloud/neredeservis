import 'driver_subscription_snapshot.dart';

abstract class DriverSubscriptionSnapshotRepository {
  Future<DriverSubscriptionSnapshot> loadByDriverId(String uid);
}
