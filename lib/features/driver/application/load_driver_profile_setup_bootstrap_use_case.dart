import '../domain/driver_profile_setup_bootstrap_repository.dart';

class DriverProfileSetupBootstrapSeed {
  const DriverProfileSetupBootstrapSeed({
    required this.fallbackName,
    this.userId,
    this.isAnonymous = false,
    this.fallbackPhone,
    this.fallbackPhotoUrl,
  });

  final String fallbackName;
  final String? userId;
  final bool isAnonymous;
  final String? fallbackPhone;
  final String? fallbackPhotoUrl;
}

class DriverProfileSetupBootstrapResult {
  const DriverProfileSetupBootstrapResult({
    required this.name,
    this.phone,
    this.plate,
    this.showPhoneToPassengers = true,
    this.photoUrl,
    this.photoPath,
  });

  final String name;
  final String? phone;
  final String? plate;
  final bool showPhoneToPassengers;
  final String? photoUrl;
  final String? photoPath;
}

class LoadDriverProfileSetupBootstrapUseCase {
  LoadDriverProfileSetupBootstrapUseCase({
    required DriverProfileSetupBootstrapRepository repository,
  }) : _repository = repository;

  final DriverProfileSetupBootstrapRepository _repository;

  Future<DriverProfileSetupBootstrapResult> execute(
    DriverProfileSetupBootstrapSeed seed,
  ) async {
    var name = seed.fallbackName;
    var phone = seed.fallbackPhone;
    String? plate;
    var showPhoneToPassengers = true;
    String? photoUrl = seed.fallbackPhotoUrl;
    String? photoPath;

    final uid = seed.userId;
    if (uid == null || uid.isEmpty || seed.isAnonymous) {
      return DriverProfileSetupBootstrapResult(
        name: name,
        phone: phone,
        plate: plate,
        showPhoneToPassengers: showPhoneToPassengers,
        photoUrl: photoUrl,
        photoPath: photoPath,
      );
    }

    try {
      final remote = await _repository.loadRemoteData(uid);

      final userName = _nullableString(remote.userDisplayName);
      final userPhone = _nullableString(remote.userPhone);
      final userPhotoUrl = _nullableString(remote.userPhotoUrl);
      final userPhotoPath = _nullableString(remote.userPhotoPath);

      if (userName != null) {
        name = userName;
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

      final driverName = _nullableString(remote.driverName);
      final driverPhone = _nullableString(remote.driverPhone);
      final driverPlate = _nullableString(remote.driverPlate)?.toUpperCase();
      final driverPhotoUrl = _nullableString(remote.driverPhotoUrl);
      final driverPhotoPath = _nullableString(remote.driverPhotoPath);

      if (driverName != null) {
        name = driverName;
      }
      if (driverPhone != null) {
        phone = driverPhone;
      }
      if (driverPlate != null) {
        plate = driverPlate;
      }
      if (driverPhotoUrl != null) {
        photoUrl = driverPhotoUrl;
      }
      if (driverPhotoPath != null) {
        photoPath = driverPhotoPath;
      }
      if (remote.driverShowPhoneToPassengers != null) {
        showPhoneToPassengers = remote.driverShowPhoneToPassengers!;
      }
    } catch (_) {
      // Non-blocking profile bootstrap fallback.
    }

    return DriverProfileSetupBootstrapResult(
      name: name,
      phone: phone,
      plate: plate,
      showPhoneToPassengers: showPhoneToPassengers,
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
