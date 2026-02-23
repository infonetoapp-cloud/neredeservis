import '../../auth/domain/user_role.dart';
import '../domain/profile_edit_bootstrap_repository.dart';

class ProfileEditBootstrapSeed {
  const ProfileEditBootstrapSeed({
    required this.fallbackDisplayName,
    this.userId,
    this.isAnonymous = false,
    this.fallbackPhone,
    this.fallbackPhotoUrl,
  });

  final String fallbackDisplayName;
  final String? userId;
  final bool isAnonymous;
  final String? fallbackPhone;
  final String? fallbackPhotoUrl;
}

class ProfileEditBootstrapResult {
  const ProfileEditBootstrapResult({
    this.role = UserRole.passenger,
    required this.displayName,
    this.phone,
    this.photoUrl,
    this.photoPath,
  });

  final UserRole role;
  final String displayName;
  final String? phone;
  final String? photoUrl;
  final String? photoPath;
}

class LoadProfileEditBootstrapUseCase {
  LoadProfileEditBootstrapUseCase({
    required ProfileEditBootstrapRepository repository,
  }) : _repository = repository;

  final ProfileEditBootstrapRepository _repository;

  Future<ProfileEditBootstrapResult> execute(
      ProfileEditBootstrapSeed seed) async {
    var displayName = seed.fallbackDisplayName;
    var phone = seed.fallbackPhone;
    String? photoUrl = seed.fallbackPhotoUrl;
    String? photoPath;
    var role = UserRole.passenger;

    final uid = seed.userId;
    if (uid == null || uid.isEmpty || seed.isAnonymous) {
      return ProfileEditBootstrapResult(
        role: role,
        displayName: displayName,
        phone: phone,
        photoUrl: photoUrl,
        photoPath: photoPath,
      );
    }

    try {
      role = await _repository.getUserRole(uid);
    } catch (_) {
      role = UserRole.passenger;
    }

    try {
      final userData = await _repository.loadUserProfile(uid);
      final userName = _nullableString(userData.displayName);
      final userPhone = _nullableString(userData.phone);
      final userPhotoUrl = _nullableString(userData.photoUrl);
      final userPhotoPath = _nullableString(userData.photoPath);
      if (userName != null) {
        displayName = userName;
      }
      if (userPhone != null) {
        phone = userPhone;
      }
      if (userPhotoUrl != null) {
        photoUrl = userPhotoUrl;
      }
      if (userPhotoPath != null) {
        photoPath = userPhotoPath;
      }

      if (role == UserRole.driver) {
        final driverData = await _repository.loadDriverProfile(uid);
        final driverName = _nullableString(driverData.name);
        final driverPhone = _nullableString(driverData.phone);
        final driverPhotoUrl = _nullableString(driverData.photoUrl);
        final driverPhotoPath = _nullableString(driverData.photoPath);
        if (driverName != null) {
          displayName = driverName;
        }
        if (driverPhone != null) {
          phone = driverPhone;
        }
        if (driverPhotoUrl != null) {
          photoUrl = driverPhotoUrl;
        }
        if (driverPhotoPath != null) {
          photoPath = driverPhotoPath;
        }
      }
    } catch (_) {
      // Non-blocking profile bootstrap fallback.
    }

    return ProfileEditBootstrapResult(
      role: role,
      displayName: displayName,
      phone: phone,
      photoUrl: photoUrl,
      photoPath: photoPath,
    );
  }
}

String? _nullableString(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}
