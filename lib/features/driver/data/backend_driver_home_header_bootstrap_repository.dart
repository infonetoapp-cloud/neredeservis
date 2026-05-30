import '../../auth/data/current_auth_profile_snapshot_client.dart';
import '../../auth/domain/user_role.dart';
import '../domain/driver_home_header_bootstrap_repository.dart';

class BackendDriverHomeHeaderBootstrapRepository
    implements DriverHomeHeaderBootstrapRepository {
  BackendDriverHomeHeaderBootstrapRepository({
    CurrentAuthProfileSnapshotClient? snapshotClient,
  }) : _snapshotClient = snapshotClient ?? CurrentAuthProfileSnapshotClient();

  final CurrentAuthProfileSnapshotClient _snapshotClient;

  @override
  Future<UserRole> getUserRole(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      return snapshot.uid == uid ? snapshot.role : UserRole.unknown;
    } catch (_) {
      return UserRole.unknown;
    }
  }

  @override
  Future<DriverHomeUserProfileRemoteData> loadUserProfile(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != uid) {
        return const DriverHomeUserProfileRemoteData();
      }
      return DriverHomeUserProfileRemoteData(
        displayName: snapshot.displayName,
        photoUrl: snapshot.photoUrl,
      );
    } catch (_) {
      return const DriverHomeUserProfileRemoteData();
    }
  }

  @override
  Future<DriverHomeDriverProfileRemoteData> loadDriverProfile(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != uid) {
        return const DriverHomeDriverProfileRemoteData();
      }
      final driverProfile = snapshot.driverProfile;
      return DriverHomeDriverProfileRemoteData(
        name: driverProfile?.name,
        photoUrl: driverProfile?.photoUrl,
      );
    } catch (_) {
      return const DriverHomeDriverProfileRemoteData();
    }
  }
}
