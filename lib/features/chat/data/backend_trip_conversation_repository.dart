import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/trip_conversation_repository.dart';

class BackendTripConversationRepository implements TripConversationRepository {
  BackendTripConversationRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<OpenTripConversationResult> openConversation(
    OpenTripConversationCommand command,
  ) async {
    final payload = await _apiClient.postJson(
      '/api/trip-conversations/open',
      body: <String, dynamic>{
        'routeId': command.routeId,
        if (command.driverUid != null && command.driverUid!.isNotEmpty)
          'driverUid': command.driverUid,
        if (command.passengerUid != null && command.passengerUid!.isNotEmpty)
          'passengerUid': command.passengerUid,
      },
    );
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
