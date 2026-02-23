import 'package:cloud_functions/cloud_functions.dart';

import '../domain/trip_conversation_repository.dart';

class FirebaseTripConversationRepository implements TripConversationRepository {
  FirebaseTripConversationRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<OpenTripConversationResult> openConversation(
    OpenTripConversationCommand command,
  ) async {
    final callable = _functions.httpsCallable('openTripConversation');
    final response = await callable.call(<String, dynamic>{
      'routeId': command.routeId,
      if (command.driverUid != null && command.driverUid!.isNotEmpty)
        'driverUid': command.driverUid,
      if (command.passengerUid != null && command.passengerUid!.isNotEmpty)
        'passengerUid': command.passengerUid,
    });
    final payload = _extractCallableData(response.data);
    return OpenTripConversationResult(
      conversationId: payload['conversationId'] as String?,
      routeId: payload['routeId'] as String?,
      driverUid: payload['driverUid'] as String?,
      passengerUid: payload['passengerUid'] as String?,
      driverName: payload['driverName'] as String?,
      passengerName: payload['passengerName'] as String?,
      driverPlate: payload['driverPlate'] as String?,
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
