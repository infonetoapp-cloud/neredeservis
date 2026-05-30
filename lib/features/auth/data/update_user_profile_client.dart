import '../../backend/data/mobile_backend_api_client.dart';
import 'profile_callable_exception.dart';

class UpdateUserProfileInput {
  const UpdateUserProfileInput({
    required this.displayName,
    this.phone,
    this.photoUrl,
    this.photoPath,
  });

  final String displayName;
  final String? phone;
  final String? photoUrl;
  final String? photoPath;

  Map<String, dynamic> toJson() => {
        'displayName': displayName,
        if (phone != null && phone!.isNotEmpty) 'phone': phone,
        if (photoUrl != null && photoUrl!.isNotEmpty) 'photoUrl': photoUrl,
        if (photoPath != null && photoPath!.isNotEmpty) 'photoPath': photoPath,
      };
}

class UpdateUserProfileResult {
  const UpdateUserProfileResult({
    required this.uid,
    required this.updatedAt,
  });

  final String uid;
  final String updatedAt;
}

class UpdateUserProfileClient {
  UpdateUserProfileClient({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  Future<UpdateUserProfileResult> update(
    UpdateUserProfileInput input,
  ) async {
    const callableName = 'PATCH /api/auth/profile';
    try {
      final payload = await _apiClient.patchJson(
        '/api/auth/profile',
        body: input.toJson(),
      );
      final userPayload = _extractUser(payload);
      return UpdateUserProfileResult(
        uid: userPayload['uid'] as String? ?? '',
        updatedAt: payload['updatedAt'] as String? ?? '',
      );
    } catch (error) {
      throw mapProfileCallableException(
        callableName: callableName,
        error: error,
      );
    }
  }

  static Map<String, dynamic> _extractUser(Map<String, dynamic> payload) {
    final user = payload['user'];
    if (user is Map<String, dynamic>) {
      return user;
    }
    if (user is Map<Object?, Object?>) {
      return Map<String, dynamic>.from(user);
    }
    throw StateError('/api/auth/profile returned invalid user payload.');
  }
}
