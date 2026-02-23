import '../domain/trip_conversation_repository.dart';

class OpenTripConversationUseCase {
  OpenTripConversationUseCase({
    required TripConversationRepository repository,
  }) : _repository = repository;

  final TripConversationRepository _repository;

  Future<OpenTripConversationResult> execute(
      OpenTripConversationCommand command) {
    return _repository.openConversation(command);
  }
}
