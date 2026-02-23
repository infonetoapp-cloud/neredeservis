import 'package:cloud_functions/cloud_functions.dart';

import '../domain/passenger_settings_update_repository.dart';

class FirebasePassengerSettingsUpdateRepository
    implements PassengerSettingsUpdateRepository {
  FirebasePassengerSettingsUpdateRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<void> updateSettings(PassengerSettingsUpdateCommand command) async {
    final callable = _functions.httpsCallable('updatePassengerSettings');
    await callable.call(<String, dynamic>{
      'routeId': command.routeId,
      'showPhoneToDriver': command.showPhoneToDriver,
      if (command.phone != null && command.phone!.isNotEmpty)
        'phone': command.phone,
      'boardingArea': command.boardingArea,
      'notificationTime': command.notificationTime,
      if (command.virtualStop != null)
        'virtualStop': <String, dynamic>{
          'lat': command.virtualStop!.lat,
          'lng': command.virtualStop!.lng,
        },
      if (command.virtualStopLabel != null &&
          command.virtualStopLabel!.trim().isNotEmpty)
        'virtualStopLabel': command.virtualStopLabel!.trim(),
    });
  }
}
