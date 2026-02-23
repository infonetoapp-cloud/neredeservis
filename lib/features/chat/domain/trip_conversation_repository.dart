class OpenTripConversationCommand {
  const OpenTripConversationCommand({
    required this.routeId,
    this.driverUid,
    this.passengerUid,
  });

  final String routeId;
  final String? driverUid;
  final String? passengerUid;
}

class OpenTripConversationResult {
  const OpenTripConversationResult({
    this.conversationId,
    this.routeId,
    this.driverUid,
    this.passengerUid,
    this.driverName,
    this.passengerName,
    this.driverPlate,
  });

  final String? conversationId;
  final String? routeId;
  final String? driverUid;
  final String? passengerUid;
  final String? driverName;
  final String? passengerName;
  final String? driverPlate;
}

abstract class TripConversationRepository {
  Future<OpenTripConversationResult> openConversation(
    OpenTripConversationCommand command,
  );
}
