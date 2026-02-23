import 'package:cloud_functions/cloud_functions.dart';

import '../domain/driver_profile_upsert_repository.dart';

class FirebaseDriverProfileUpsertRepository
    implements DriverProfileUpsertRepository {
  FirebaseDriverProfileUpsertRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<void> upsertDriverProfile(DriverProfileUpsertCommand command) async {
    final callable = _functions.httpsCallable('upsertDriverProfile');
    await callable.call(<String, dynamic>{
      'name': command.name,
      'phone': command.phone,
      'plate': command.plate,
      'showPhoneToPassengers': command.showPhoneToPassengers,
      if (command.photoUrl != null && command.photoUrl!.isNotEmpty)
        'photoUrl': command.photoUrl,
      if (command.photoPath != null && command.photoPath!.isNotEmpty)
        'photoPath': command.photoPath,
      'companyId': command.companyId,
    });
  }
}
