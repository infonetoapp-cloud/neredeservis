import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/exceptions/app_exception.dart';
import 'package:neredeservis/features/auth/data/profile_callable_exception.dart';
import 'package:neredeservis/features/auth/data/update_user_profile_client.dart';
import 'package:neredeservis/features/backend/data/mobile_backend_api_client.dart';

void main() {
  group('UpdateUserProfileClient', () {
    test('parses update result payload', () async {
      final client = UpdateUserProfileClient(
        apiClient: _FakeMobileBackendApiClient(
          response: <String, dynamic>{
            'user': <String, dynamic>{'uid': 'u-1'},
            'updatedAt': '2026-02-17T14:00:00Z',
          },
        ),
      );

      final result = await client.update(
        const UpdateUserProfileInput(displayName: 'New Name'),
      );

      expect(result.uid, 'u-1');
      expect(result.updatedAt, '2026-02-17T14:00:00Z');
    });

    test('maps backend errors to ProfileCallableException', () async {
      final client = UpdateUserProfileClient(
        apiClient: _FakeMobileBackendApiClient(
          error: const AppException(
            code: 'permission-denied',
            message: 'not owner',
          ),
        ),
      );

      expect(
        () => client.update(
          const UpdateUserProfileInput(displayName: 'Any'),
        ),
        throwsA(
          isA<ProfileCallableException>().having(
            (e) => e.code,
            'code',
            ProfileCallableErrorCode.permissionDenied,
          ),
        ),
      );
    });

    test('forwards optional photo fields when present', () async {
      final apiClient = _FakeMobileBackendApiClient(
        response: <String, dynamic>{
          'user': <String, dynamic>{'uid': 'u-1'},
          'updatedAt': 'ts',
        },
      );
      final client = UpdateUserProfileClient(apiClient: apiClient);

      await client.update(
        const UpdateUserProfileInput(
          displayName: 'Name',
          phone: '555',
          photoUrl: 'https://example.com/p.jpg',
          photoPath: 'users/u-1/p.jpg',
        ),
      );

      expect(apiClient.lastPath, '/api/auth/profile');
      expect(apiClient.lastBody, <String, dynamic>{
        'displayName': 'Name',
        'phone': '555',
        'photoUrl': 'https://example.com/p.jpg',
        'photoPath': 'users/u-1/p.jpg',
      });
    });
  });
}

class _FakeMobileBackendApiClient extends MobileBackendApiClient {
  _FakeMobileBackendApiClient({
    this.response = const <String, dynamic>{},
    this.error,
  });

  final Map<String, dynamic> response;
  final Object? error;
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
    if (error != null) {
      throw error!;
    }
    return response;
  }
}
