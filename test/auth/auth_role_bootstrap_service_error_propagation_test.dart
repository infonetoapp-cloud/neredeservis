import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/errors/error_codes.dart';
import 'package:neredeservis/core/exceptions/app_exception.dart';
import 'package:neredeservis/features/auth/application/auth_role_bootstrap_service.dart';
import 'package:neredeservis/features/auth/data/auth_gateway.dart';
import 'package:neredeservis/features/auth/data/bootstrap_user_profile_client.dart';
import 'package:neredeservis/features/auth/data/update_user_profile_client.dart';
import 'package:neredeservis/features/auth/data/user_role_repository.dart';
import 'package:neredeservis/features/auth/domain/auth_session.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/backend/data/mobile_backend_api_client.dart';

void main() {
  group('AuthRoleBootstrapService error propagation', () {
    test(
      'bootstrapCurrentUserProfile returns FAILED_PRECONDITION when unsigned',
      () async {
        final service = AuthRoleBootstrapService(
          authGateway: _FakeAuthGateway(initialSession: null),
          bootstrapClient: BootstrapUserProfileClient(
            apiClient: _FakeMobileBackendApiClient(
              response: <String, dynamic>{
                'user': <String, dynamic>{
                  'uid': 'user-1',
                  'role': 'guest',
                },
                'createdOrUpdated': true,
              },
            ),
          ),
          updateUserProfileClient: UpdateUserProfileClient(
            apiClient: _FakeMobileBackendApiClient(
              response: <String, dynamic>{
                'user': <String, dynamic>{'uid': 'user-1'},
                'updatedAt': 'ts',
              },
            ),
          ),
          userRoleRepository: _FakeUserRoleRepository(),
        );

        await expectLater(
          () => service.bootstrapCurrentUserProfile(displayName: 'Test'),
          throwsA(
            isA<AppException>().having(
              (e) => e.code,
              'code',
              ErrorCodes.failedPrecondition,
            ),
          ),
        );
      },
    );

    test('maps backend permission error into AppException contract', () async {
      final service = AuthRoleBootstrapService(
        authGateway: _FakeAuthGateway(
          initialSession: const AuthSession(
            uid: 'user-1',
            isAnonymous: false,
            emailVerified: true,
          ),
        ),
        bootstrapClient: BootstrapUserProfileClient(
          apiClient: _FakeMobileBackendApiClient(
            error: const AppException(
              code: ErrorCodes.permissionDenied,
              message: 'blocked',
            ),
          ),
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          apiClient: _FakeMobileBackendApiClient(
            response: <String, dynamic>{
              'user': <String, dynamic>{'uid': 'user-1'},
              'updatedAt': 'ts',
            },
          ),
        ),
        userRoleRepository: _FakeUserRoleRepository(),
      );

      await expectLater(
        () => service.bootstrapCurrentUserProfile(displayName: 'Test'),
        throwsA(
          isA<AppException>().having(
            (e) => e.code,
            'code',
            ErrorCodes.permissionDenied,
          ),
        ),
      );
    });

    test('ensureAnonymousSession maps timeout as UNAVAILABLE', () async {
      final service = AuthRoleBootstrapService(
        authGateway: _FakeAuthGateway(
          initialSession: null,
          signInError: TimeoutException('network timeout'),
        ),
        bootstrapClient: BootstrapUserProfileClient(
          apiClient: _FakeMobileBackendApiClient(
            response: <String, dynamic>{
              'user': <String, dynamic>{
                'uid': 'user-1',
                'role': 'guest',
              },
              'createdOrUpdated': true,
            },
          ),
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          apiClient: _FakeMobileBackendApiClient(
            response: <String, dynamic>{
              'user': <String, dynamic>{'uid': 'user-1'},
              'updatedAt': 'ts',
            },
          ),
        ),
        userRoleRepository: _FakeUserRoleRepository(),
      );

      await expectLater(
        () => service.ensureAnonymousSession(),
        throwsA(
          isA<AppException>().having(
            (e) => e.code,
            'code',
            ErrorCodes.unavailable,
          ),
        ),
      );
    });
  });
}

class _FakeAuthGateway implements AuthGateway {
  _FakeAuthGateway({
    required AuthSession? initialSession,
    this.signInError,
  }) : _session = initialSession;

  final Object? signInError;
  AuthSession? _session;

  @override
  AuthSession? get currentSession => _session;

  @override
  Stream<AuthSession?> authStateChanges() =>
      Stream<AuthSession?>.value(_session);

  @override
  Future<AuthSession> signInAnonymously() async {
    if (signInError != null) {
      throw signInError!;
    }
    const session = AuthSession(
      uid: 'anon-user',
      isAnonymous: true,
      emailVerified: false,
    );
    _session = session;
    return session;
  }

  @override
  Future<void> signOut() async {
    _session = null;
  }
}

class _FakeUserRoleRepository implements UserRoleRepository {
  @override
  Future<UserRole> readRole(String uid) async => UserRole.unknown;

  @override
  Stream<UserRole?> watchRole(String uid) => const Stream<UserRole?>.empty();
}

class _FakeMobileBackendApiClient extends MobileBackendApiClient {
  _FakeMobileBackendApiClient({
    this.response = const <String, dynamic>{},
    this.error,
  });

  final Map<String, dynamic> response;
  final Object? error;

  @override
  Future<Map<String, dynamic>> patchJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  }) async {
    if (error != null) {
      throw error!;
    }
    return response;
  }
}
