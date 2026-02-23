import '../../auth/domain/user_role.dart';

class ProfileEditUserRemoteData {
  const ProfileEditUserRemoteData({
    this.displayName,
    this.phone,
    this.photoUrl,
    this.photoPath,
  });

  final String? displayName;
  final String? phone;
  final String? photoUrl;
  final String? photoPath;
}

class ProfileEditDriverRemoteData {
  const ProfileEditDriverRemoteData({
    this.name,
    this.phone,
    this.photoUrl,
    this.photoPath,
  });

  final String? name;
  final String? phone;
  final String? photoUrl;
  final String? photoPath;
}

abstract class ProfileEditBootstrapRepository {
  Future<UserRole> getUserRole(String uid);
  Future<ProfileEditUserRemoteData> loadUserProfile(String uid);
  Future<ProfileEditDriverRemoteData> loadDriverProfile(String uid);
}
