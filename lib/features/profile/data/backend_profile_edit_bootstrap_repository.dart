import '../../auth/data/current_auth_profile_snapshot_client.dart';
import '../../auth/domain/user_role.dart';
import '../domain/profile_edit_bootstrap_repository.dart';

class BackendProfileEditBootstrapRepository
    implements ProfileEditBootstrapRepository {
  BackendProfileEditBootstrapRepository({
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
  Future<ProfileEditUserRemoteData> loadUserProfile(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != uid) {
        return const ProfileEditUserRemoteData();
      }

      return ProfileEditUserRemoteData(
        displayName: snapshot.displayName,
        phone: snapshot.phone,
        photoUrl: snapshot.photoUrl,
        photoPath: snapshot.photoPath,
      );
    } catch (_) {
      return const ProfileEditUserRemoteData();
    }
  }

  @override
  Future<ProfileEditDriverRemoteData> loadDriverProfile(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != uid) {
        return const ProfileEditDriverRemoteData();
      }

      final driverProfile = snapshot.driverProfile;
      return ProfileEditDriverRemoteData(
        name: driverProfile?.name,
        phone: driverProfile?.phone,
        photoUrl: driverProfile?.photoUrl,
        photoPath: driverProfile?.photoPath,
      );
    } catch (_) {
      return const ProfileEditDriverRemoteData();
    }
  }
}
