import '../domain/guest_session_create_repository.dart';

class CreateGuestSessionUseCase {
  CreateGuestSessionUseCase({
    required GuestSessionCreateRepository repository,
  }) : _repository = repository;

  final GuestSessionCreateRepository _repository;

  Future<CreateGuestSessionResult> execute(CreateGuestSessionCommand command) {
    return _repository.createGuestSession(command);
  }
}
