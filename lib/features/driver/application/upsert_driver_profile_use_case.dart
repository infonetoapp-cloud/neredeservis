import '../domain/driver_profile_upsert_repository.dart';

class UpsertDriverProfileUseCase {
  UpsertDriverProfileUseCase({
    required DriverProfileUpsertRepository repository,
  }) : _repository = repository;

  final DriverProfileUpsertRepository _repository;

  Future<void> execute(DriverProfileUpsertCommand command) {
    return _repository.upsertDriverProfile(command);
  }
}
