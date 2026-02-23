import 'package:cloud_functions/cloud_functions.dart';

import '../domain/delete_user_data_repository.dart';

class FirebaseDeleteUserDataRepository implements DeleteUserDataRepository {
  FirebaseDeleteUserDataRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<DeleteUserDataResult> deleteUserData(
      DeleteUserDataCommand command) async {
    final callable = _functions.httpsCallable('deleteUserData');
    final response = await callable.call(<String, dynamic>{
      'dryRun': command.dryRun,
    });
    final payload = _extractCallableData(response.data);
    final urlsRaw = payload['manageSubscriptionUrls'];
    return DeleteUserDataResult(
      status: payload['status'] as String? ?? '',
      interceptorMessage: payload['interceptorMessage'] as String?,
      manageSubscriptionLabel: payload['manageSubscriptionLabel'] as String?,
      manageSubscriptionUrls:
          urlsRaw is Map ? Map<String, dynamic>.from(urlsRaw) : null,
    );
  }
}

Map<String, dynamic> _extractCallableData(dynamic raw) {
  if (raw is Map<String, dynamic>) {
    return raw;
  }
  if (raw is Map<Object?, Object?>) {
    return Map<String, dynamic>.from(raw);
  }
  return <String, dynamic>{};
}
