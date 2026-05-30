import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/user_role.dart';
import 'profile_callable_exception.dart';

typedef CallableInvoker = Future<dynamic> Function(
  String callableName,
  Map<String, dynamic> input,
);

class BootstrapUserProfileInput {
  const BootstrapUserProfileInput({
    required this.displayName,
    this.phone,
    this.preferredRole,
  });

  final String displayName;
  final String? phone;
  final String? preferredRole;

  Map<String, dynamic> toJson() => {
        'displayName': displayName,
        if (phone != null && phone!.isNotEmpty) 'phone': phone,
        if (preferredRole != null && preferredRole!.isNotEmpty)
          'preferredRole': preferredRole,
      };
}

class BootstrapUserProfileResult {
  const BootstrapUserProfileResult({
    required this.uid,
    required this.role,
    required this.createdOrUpdated,
  });

  final String uid;
  final UserRole role;
  final bool createdOrUpdated;
}

class BootstrapUserProfileClient {
  BootstrapUserProfileClient({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  Future<BootstrapUserProfileResult> bootstrap(
    BootstrapUserProfileInput input,
  ) async {
    const callableName = 'PATCH /api/auth/profile';
    try {
      final payload = await _apiClient.patchJson(
        '/api/auth/profile',
        body: input.toJson(),
      );
      final userPayload = _extractUser(payload);
      return BootstrapUserProfileResult(
        uid: userPayload['uid'] as String? ?? '',
        role: userRoleFromRaw(userPayload['role'] as String?),
        createdOrUpdated: payload['createdOrUpdated'] as bool? ?? false,
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
