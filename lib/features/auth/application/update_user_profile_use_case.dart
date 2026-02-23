import '../data/update_user_profile_client.dart';

class UpdateUserProfileUseCase {
  UpdateUserProfileUseCase({
    required UpdateUserProfileClient client,
  }) : _client = client;

  final UpdateUserProfileClient _client;

  Future<UpdateUserProfileResult> execute(UpdateUserProfileInput input) {
    return _client.update(input);
  }
}
