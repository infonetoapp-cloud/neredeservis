import '../../backend/data/mobile_backend_api_client.dart';

class BackendTripChatMessage {
  const BackendTripChatMessage({
    required this.messageId,
    required this.senderUid,
    required this.text,
    this.senderRole,
    this.createdAt,
    this.updatedAt,
  });

  final String messageId;
  final String senderUid;
  final String text;
  final String? senderRole;
  final String? createdAt;
  final String? updatedAt;

  factory BackendTripChatMessage.fromJson(Map<String, dynamic> json) {
    return BackendTripChatMessage(
      messageId: (json['messageId'] as String?)?.trim() ?? '',
      senderUid: (json['senderUid'] as String?)?.trim() ?? '',
      text: (json['text'] as String?)?.trim() ?? '',
      senderRole: (json['senderRole'] as String?)?.trim(),
      createdAt: (json['createdAt'] as String?)?.trim(),
      updatedAt: (json['updatedAt'] as String?)?.trim(),
    );
  }
}

class BackendTripChatClient {
  BackendTripChatClient({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  Future<List<BackendTripChatMessage>> listMessages({
    required String routeId,
    required String conversationId,
    int? limit,
  }) async {
    final payload = await _apiClient.getJson(
      '/api/trip-conversations/$conversationId/messages',
      queryParameters: <String, dynamic>{
        'routeId': routeId,
        if (limit != null) 'limit': limit.toString(),
      },
    );
    final rawMessages = payload['messages'];
    if (rawMessages is! List) {
      return const <BackendTripChatMessage>[];
    }

    return rawMessages
        .whereType<Map<dynamic, dynamic>>()
        .map(
          (item) => BackendTripChatMessage.fromJson(
            Map<String, dynamic>.from(item),
          ),
        )
        .where((item) => item.text.isNotEmpty)
        .toList(growable: false);
  }

  Future<void> sendMessage({
    required String routeId,
    required String conversationId,
    required String text,
    String? clientMessageId,
  }) async {
    await _apiClient.postJson(
      '/api/trip-conversations/$conversationId/messages',
      body: <String, dynamic>{
        'routeId': routeId,
        'text': text,
        if (clientMessageId != null && clientMessageId.isNotEmpty)
          'clientMessageId': clientMessageId,
      },
    );
  }

  Future<void> markConversationRead({
    required String routeId,
    required String conversationId,
  }) async {
    await _apiClient.postJson(
      '/api/trip-conversations/$conversationId/read',
      body: <String, dynamic>{
        'routeId': routeId,
      },
    );
  }
}
