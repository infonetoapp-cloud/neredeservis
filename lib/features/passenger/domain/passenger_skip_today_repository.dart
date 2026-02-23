class PassengerSkipTodayCommand {
  const PassengerSkipTodayCommand({
    required this.routeId,
    required this.dateKey,
    required this.idempotencyKey,
  });

  final String routeId;
  final String dateKey;
  final String idempotencyKey;
}

abstract class PassengerSkipTodayRepository {
  Future<void> submitSkipToday(PassengerSkipTodayCommand command);
}
