import '../domain/passenger_settings_update_repository.dart';

class UpdatePassengerSettingsUseCase {
  UpdatePassengerSettingsUseCase({
    required PassengerSettingsUpdateRepository repository,
  }) : _repository = repository;

  final PassengerSettingsUpdateRepository _repository;

  Future<void> execute(PassengerSettingsUpdateCommand command) {
    return _repository.updateSettings(command);
  }
}
