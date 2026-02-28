import '../../../services/repository_interfaces.dart';

class DriverProfileRecordSnapshot {
  const DriverProfileRecordSnapshot({
    required this.name,
    required this.phone,
    required this.plate,
    required this.showPhoneToPassengers,
    required this.companyId,
  });

  final String name;
  final String phone;
  final String plate;
  final bool showPhoneToPassengers;
  final String? companyId;
}

class ReadDriverProfileRecordUseCase {
  ReadDriverProfileRecordUseCase({
    required DriverRepository repository,
  }) : _repository = repository;

  final DriverRepository _repository;

  Future<DriverProfileRecordSnapshot?> execute(String? uid) async {
    final normalizedUid = uid?.trim();
    if (normalizedUid == null || normalizedUid.isEmpty) {
      return null;
    }

    final entity = await _repository.getDriver(normalizedUid);
    if (entity == null) {
      return null;
    }

    return DriverProfileRecordSnapshot(
      name: entity.name,
      phone: entity.phone,
      plate: entity.plate,
      showPhoneToPassengers: entity.showPhoneToPassengers,
      companyId: entity.companyId,
    );
  }
}
