import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
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

void main() {
  group('AuthRoleBootstrapService error propagation', () {
    test(
        'bootstrapCurrentUserProfile returns FAILED_PRECONDITION when unsigned',
        () async {
      final service = AuthRoleBootstrapService(
        authGateway: _FakeAuthGateway(initialSession: null),
        bootstrapClient: BootstrapUserProfileClient(
          invoker: (_, __) async => <String, dynamic>{},
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          invoker: (_, __) async => <String, dynamic>{},
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
    });

    test('maps callable permission error into AppException contract', () async {
      final service = AuthRoleBootstrapService(
        authGateway: _FakeAuthGateway(
          initialSession: const AuthSession(
            uid: 'user-1',
            isAnonymous: false,
            emailVerified: true,
          ),
        ),
        bootstrapClient: BootstrapUserProfileClient(
          invoker: (_, __) async => throw FirebaseException(
            plugin: 'firebase_functions',
            code: 'permission-denied',
            message: 'blocked',
          ),
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          invoker: (_, __) async => <String, dynamic>{},
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
          invoker: (_, __) async => <String, dynamic>{},
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          invoker: (_, __) async => <String, dynamic>{},
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
  Stream<UserRole?> watchRole(String uid) => const Stream<UserRole?>.empty();
}
