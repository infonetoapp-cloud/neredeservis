import '../domain/driver_stop_mutation_repository.dart';

class UpsertDriverStopUseCase {
  UpsertDriverStopUseCase({
    required DriverStopMutationRepository repository,
  }) : _repository = repository;

  final DriverStopMutationRepository _repository;

  Future<DriverStopUpsertResult> execute(DriverStopUpsertCommand command) {
    return _repository.upsertStop(command);
  }
}
