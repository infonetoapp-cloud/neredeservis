import 'package:cloud_functions/cloud_functions.dart';

import '../domain/passenger_skip_today_repository.dart';

class FirebasePassengerSkipTodayRepository
    implements PassengerSkipTodayRepository {
  FirebasePassengerSkipTodayRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<void> submitSkipToday(PassengerSkipTodayCommand command) async {
    final callable = _functions.httpsCallable('submitSkipToday');
    await callable.call(<String, dynamic>{
      'routeId': command.routeId,
      'dateKey': command.dateKey,
      'idempotencyKey': command.idempotencyKey,
    });
  }
}
