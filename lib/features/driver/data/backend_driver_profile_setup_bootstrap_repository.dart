import '../../auth/data/current_auth_profile_snapshot_client.dart';
import '../domain/driver_profile_setup_bootstrap_repository.dart';

class BackendDriverProfileSetupBootstrapRepository
    implements DriverProfileSetupBootstrapRepository {
  BackendDriverProfileSetupBootstrapRepository({
    CurrentAuthProfileSnapshotClient? snapshotClient,
  }) : _snapshotClient = snapshotClient ?? CurrentAuthProfileSnapshotClient();

  final CurrentAuthProfileSnapshotClient _snapshotClient;

  @override
  Future<DriverProfileSetupRemoteData> loadRemoteData(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != uid) {
        return const DriverProfileSetupRemoteData();
      }

      final driverProfile = snapshot.driverProfile;
      return DriverProfileSetupRemoteData(
        userDisplayName: snapshot.displayName,
        userPhone: snapshot.phone,
        userPhotoUrl: snapshot.photoUrl,
        userPhotoPath: snapshot.photoPath,
        driverName: driverProfile?.name,
        driverPhone: driverProfile?.phone,
        driverPlate: driverProfile?.plate,
        driverPhotoUrl: driverProfile?.photoUrl,
        driverPhotoPath: driverProfile?.photoPath,
        driverShowPhoneToPassengers: driverProfile?.showPhoneToPassengers,
      );
    } catch (_) {
      return const DriverProfileSetupRemoteData();
    }
  }
}
