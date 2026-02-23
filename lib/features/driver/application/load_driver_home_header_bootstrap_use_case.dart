import '../../auth/domain/user_role.dart';
import '../domain/driver_home_header_bootstrap_repository.dart';

class DriverHomeHeaderBootstrapSeed {
  const DriverHomeHeaderBootstrapSeed({
    required this.fallbackDisplayName,
    this.userId,
    this.fallbackPhotoUrl,
  });

  final String fallbackDisplayName;
  final String? userId;
  final String? fallbackPhotoUrl;
}

class DriverHomeHeaderBootstrapResult {
  const DriverHomeHeaderBootstrapResult({
    this.isDriver = false,
    this.driverDisplayName = 'Sofor',
    this.driverPhotoUrl,
  });

  final bool isDriver;
  final String driverDisplayName;
  final String? driverPhotoUrl;
}

class LoadDriverHomeHeaderBootstrapUseCase {
  LoadDriverHomeHeaderBootstrapUseCase({
    required DriverHomeHeaderBootstrapRepository repository,
  }) : _repository = repository;

  final DriverHomeHeaderBootstrapRepository _repository;

  Future<DriverHomeHeaderBootstrapResult> execute(
    DriverHomeHeaderBootstrapSeed seed,
  ) async {
    final uid = seed.userId;
    if (uid == null || uid.isEmpty) {
      return DriverHomeHeaderBootstrapResult(
        driverDisplayName: seed.fallbackDisplayName,
        driverPhotoUrl: seed.fallbackPhotoUrl,
      );
    }

    UserRole role;
    try {
      role = await _repository.getUserRole(uid);
    } catch (_) {
      role = UserRole.unknown;
    }
    if (role != UserRole.driver) {
      return DriverHomeHeaderBootstrapResult(
        driverDisplayName: seed.fallbackDisplayName,
        driverPhotoUrl: seed.fallbackPhotoUrl,
      );
    }

    var driverDisplayName = seed.fallbackDisplayName;
    String? driverPhotoUrl = seed.fallbackPhotoUrl;

    try {
      final userData = await _repository.loadUserProfile(uid);
      final userName = _nullableString(userData.displayName);
      final userPhoto = _nullableString(userData.photoUrl);
      if (userName != null) {
        driverDisplayName = userName;
      }
      if (userPhoto != null) {
        driverPhotoUrl = userPhoto;
      }
    } catch (_) {
      // Non-blocking profile fallback.
    }

    try {
      final driverData = await _repository.loadDriverProfile(uid);
      final driverName = _nullableString(driverData.name);
      final driverPhoto = _nullableString(driverData.photoUrl);
      if (driverName != null) {
        driverDisplayName = driverName;
      }
      if (driverPhoto != null) {
        driverPhotoUrl = driverPhoto;
      }
    } catch (_) {
      // Non-blocking profile fallback.
    }

    return DriverHomeHeaderBootstrapResult(
      isDriver: true,
      driverDisplayName: driverDisplayName,
      driverPhotoUrl: driverPhotoUrl,
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
