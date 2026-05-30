import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/exceptions/app_exception.dart';
import 'package:neredeservis/features/auth/data/bootstrap_user_profile_client.dart';
import 'package:neredeservis/features/auth/data/profile_callable_exception.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/backend/data/mobile_backend_api_client.dart';

void main() {
  group('BootstrapUserProfileClient', () {
    test('parses user payload', () async {
      final client = BootstrapUserProfileClient(
        apiClient: _FakeMobileBackendApiClient(
          response: <String, dynamic>{
            'user': <String, dynamic>{
              'uid': 'u-1',
              'role': 'driver',
            },
            'createdOrUpdated': true,
          },
        ),
      );

      final result = await client.bootstrap(
        const BootstrapUserProfileInput(displayName: 'Sinan'),
      );

      expect(result.uid, 'u-1');
      expect(result.role, UserRole.driver);
      expect(result.createdOrUpdated, isTrue);
    });

    test('forwards input fields to backend patch body', () async {
      final apiClient = _FakeMobileBackendApiClient(
        response: <String, dynamic>{
          'user': <String, dynamic>{
            'uid': 'u-3',
            'role': 'guest',
          },
          'createdOrUpdated': true,
        },
      );
      final client = BootstrapUserProfileClient(apiClient: apiClient);

      await client.bootstrap(
        const BootstrapUserProfileInput(
          displayName: 'Name',
          phone: '+905551112233',
          preferredRole: 'driver',
        ),
      );

      expect(apiClient.lastPath, '/api/auth/profile');
      expect(apiClient.lastBody, <String, dynamic>{
        'displayName': 'Name',
        'phone': '+905551112233',
        'preferredRole': 'driver',
      });
    });

    test('maps backend errors to ProfileCallableException', () async {
      final client = BootstrapUserProfileClient(
        apiClient: _FakeMobileBackendApiClient(
          error: const AppException(
            code: 'failed-precondition',
            message: 'role missing',
          ),
        ),
      );

      expect(
        () => client.bootstrap(
          const BootstrapUserProfileInput(displayName: 'Name'),
        ),
        throwsA(
          isA<ProfileCallableException>().having(
            (e) => e.code,
            'code',
            ProfileCallableErrorCode.failedPrecondition,
          ),
        ),
      );
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
