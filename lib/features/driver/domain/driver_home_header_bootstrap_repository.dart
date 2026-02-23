import '../../auth/domain/user_role.dart';

class DriverHomeUserProfileRemoteData {
  const DriverHomeUserProfileRemoteData({
    this.displayName,
    this.photoUrl,
  });

  final String? displayName;
  final String? photoUrl;
}

class DriverHomeDriverProfileRemoteData {
  const DriverHomeDriverProfileRemoteData({
    this.name,
    this.photoUrl,
  });

  final String? name;
  final String? photoUrl;
}

abstract class DriverHomeHeaderBootstrapRepository {
  Future<UserRole> getUserRole(String uid);
  Future<DriverHomeUserProfileRemoteData> loadUserProfile(String uid);
  Future<DriverHomeDriverProfileRemoteData> loadDriverProfile(String uid);
}
