import '../domain/delete_user_data_repository.dart';

class DeleteUserDataUseCase {
  DeleteUserDataUseCase({
    required DeleteUserDataRepository repository,
  }) : _repository = repository;

  final DeleteUserDataRepository _repository;

  Future<DeleteUserDataResult> execute(DeleteUserDataCommand command) {
    return _repository.deleteUserData(command);
  }
}
