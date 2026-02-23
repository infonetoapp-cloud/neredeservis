import '../domain/driver_subscription_snapshot.dart';
import '../domain/driver_subscription_snapshot_repository.dart';

class LoadDriverSubscriptionSnapshotUseCase {
  LoadDriverSubscriptionSnapshotUseCase({
    required DriverSubscriptionSnapshotRepository repository,
  }) : _repository = repository;

  final DriverSubscriptionSnapshotRepository _repository;

  Future<DriverSubscriptionSnapshot> execute(String uid) async {
    if (uid.trim().isEmpty) {
      return const DriverSubscriptionSnapshot();
    }
    return _repository.loadByDriverId(uid);
  }
}
