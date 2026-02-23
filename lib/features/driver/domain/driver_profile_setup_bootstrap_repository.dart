class DriverProfileSetupRemoteData {
  const DriverProfileSetupRemoteData({
    this.userDisplayName,
    this.userPhone,
    this.userPhotoUrl,
    this.userPhotoPath,
    this.driverName,
    this.driverPhone,
    this.driverPlate,
    this.driverPhotoUrl,
    this.driverPhotoPath,
    this.driverShowPhoneToPassengers,
  });

  final String? userDisplayName;
  final String? userPhone;
  final String? userPhotoUrl;
  final String? userPhotoPath;

  final String? driverName;
  final String? driverPhone;
  final String? driverPlate;
  final String? driverPhotoUrl;
  final String? driverPhotoPath;
  final bool? driverShowPhoneToPassengers;
}

abstract class DriverProfileSetupBootstrapRepository {
  Future<DriverProfileSetupRemoteData> loadRemoteData(String uid);
}
