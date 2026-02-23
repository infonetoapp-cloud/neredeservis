class DriverProfileUpsertCommand {
  const DriverProfileUpsertCommand({
    required this.name,
    required this.phone,
    required this.plate,
    required this.showPhoneToPassengers,
    this.photoUrl,
    this.photoPath,
    required this.companyId,
  });

  final String name;
  final String phone;
  final String plate;
  final bool showPhoneToPassengers;
  final String? photoUrl;
  final String? photoPath;
  final String? companyId;
}

abstract class DriverProfileUpsertRepository {
  Future<void> upsertDriverProfile(DriverProfileUpsertCommand command);
}
