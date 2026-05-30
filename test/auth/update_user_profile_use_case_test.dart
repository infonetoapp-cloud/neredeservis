import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/update_user_profile_use_case.dart';
import 'package:neredeservis/features/auth/data/update_user_profile_client.dart';
import 'package:neredeservis/features/backend/data/mobile_backend_api_client.dart';

void main() {
  test('UpdateUserProfileUseCase delegates to client', () async {
    final apiClient = _FakeMobileBackendApiClient();
    final useCase = UpdateUserProfileUseCase(
      client: UpdateUserProfileClient(
        apiClient: apiClient,
      ),
    );

    final result = await useCase.execute(
      const UpdateUserProfileInput(displayName: 'u-1'),
    );

    expect(result.uid, 'u-1');
    expect(result.updatedAt, '2026-02-23T12:00:00Z');
    expect(apiClient.lastPath, '/api/auth/profile');
    expect(apiClient.lastBody, <String, dynamic>{
      'displayName': 'u-1',
    });
  });
}

class _FakeMobileBackendApiClient extends MobileBackendApiClient {
  String? lastPath;
  Map<String, dynamic>? lastBody;

  @override
  Future<Map<String, dynamic>> patchJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  }) async {
    lastPath = path;
    lastBody = body == null ? null : Map<String, dynamic>.from(body);
    return <String, dynamic>{
      'user': <String, dynamic>{
        'uid': (body?['displayName'] as String?) ?? '',
      },
      'updatedAt': '2026-02-23T12:00:00Z',
    };
  }
}
