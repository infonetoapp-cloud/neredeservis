import 'package:cloud_functions/cloud_functions.dart';

import '../domain/guest_session_create_repository.dart';

class FirebaseGuestSessionCreateRepository
    implements GuestSessionCreateRepository {
  FirebaseGuestSessionCreateRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<CreateGuestSessionResult> createGuestSession(
    CreateGuestSessionCommand command,
  ) async {
    final callable = _functions.httpsCallable('createGuestSession');
    final response = await callable.call(<String, dynamic>{
      'srvCode': command.srvCode,
      if (command.name != null && command.name!.isNotEmpty)
        'name': command.name,
    });
    final payload = _extractCallableData(response.data);
    return CreateGuestSessionResult(
      routeId: payload['routeId'] as String? ?? '',
      routeName: payload['routeName'] as String?,
      sessionId: payload['sessionId'] as String? ?? '',
      expiresAt: payload['expiresAt'] as String? ?? '',
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
