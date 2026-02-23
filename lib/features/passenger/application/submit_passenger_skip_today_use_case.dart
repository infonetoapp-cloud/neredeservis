import '../domain/passenger_skip_today_repository.dart';

class SubmitPassengerSkipTodayUseCase {
  SubmitPassengerSkipTodayUseCase({
    required PassengerSkipTodayRepository repository,
  }) : _repository = repository;

  final PassengerSkipTodayRepository _repository;

  Future<void> execute(PassengerSkipTodayCommand command) {
    return _repository.submitSkipToday(command);
  }
}
