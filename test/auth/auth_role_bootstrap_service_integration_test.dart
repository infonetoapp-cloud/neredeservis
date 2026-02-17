import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/auth_role_bootstrap_service.dart';
import 'package:neredeservis/features/auth/data/auth_gateway.dart';
import 'package:neredeservis/features/auth/data/bootstrap_user_profile_client.dart';
import 'package:neredeservis/features/auth/data/update_user_profile_client.dart';
import 'package:neredeservis/features/auth/data/user_role_repository.dart';
import 'package:neredeservis/features/auth/domain/auth_session.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  group('AuthRoleBootstrapService integration', () {
    test('ensureAnonymousSession returns existing session without extra sign-in',
        () async {
      final authGateway = FakeAuthGateway(
        initialSession: const AuthSession(
          uid: 'existing-user',
          isAnonymous: false,
          emailVerified: true,
        ),
      );
      final roleRepository = FakeUserRoleRepository();
      final service = AuthRoleBootstrapService(
        authGateway: authGateway,
        bootstrapClient: BootstrapUserProfileClient(
          invoker: (_, __) async => {
            'uid': 'existing-user',
            'role': 'passenger',
            'createdOrUpdated': true,
          },
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          invoker: (_, __) async => {
            'uid': 'existing-user',
            'updatedAt': '2026-02-17T14:00:00Z',
          },
        ),
        userRoleRepository: roleRepository,
      );

      final session = await service.ensureAnonymousSession();

      expect(session.uid, 'existing-user');
      expect(authGateway.anonymousSignInCount, 0);
    });

    test('ensureAnonymousSession signs in when no session', () async {
      final authGateway = FakeAuthGateway(
        initialSession: null,
      );
      final service = AuthRoleBootstrapService(
        authGateway: authGateway,
        bootstrapClient: BootstrapUserProfileClient(
          invoker: (_, __) async => {
            'uid': 'anon-user',
            'role': 'guest',
            'createdOrUpdated': true,
          },
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          invoker: (_, __) async => {
            'uid': 'anon-user',
            'updatedAt': '2026-02-17T14:00:00Z',
          },
        ),
        userRoleRepository: FakeUserRoleRepository(),
      );

      final session = await service.ensureAnonymousSession();

      expect(session.uid, 'anon-user');
      expect(session.isAnonymous, isTrue);
      expect(authGateway.anonymousSignInCount, 1);
    });

    test('watchCurrentRole follows auth+role stream contract', () async {
      final authGateway = FakeAuthGateway(initialSession: null);
      final roleRepository = FakeUserRoleRepository();
      final service = AuthRoleBootstrapService(
        authGateway: authGateway,
        bootstrapClient: BootstrapUserProfileClient(
          invoker: (_, __) async => {
            'uid': 'u-1',
            'role': 'driver',
            'createdOrUpdated': true,
          },
        ),
        updateUserProfileClient: UpdateUserProfileClient(
          invoker: (_, __) async => {
            'uid': 'u-1',
            'updatedAt': '2026-02-17T14:00:00Z',
          },
        ),
        userRoleRepository: roleRepository,
      );

      final emitted = <UserRole>[];
      final sub = service.watchCurrentRole().listen(emitted.add);

      authGateway.emitSession(
        const AuthSession(
          uid: 'u-1',
          isAnonymous: true,
          emailVerified: false,
        ),
      );
      await Future<void>.delayed(Duration.zero);
      roleRepository.emitRole('u-1', UserRole.guest);
      await Future<void>.delayed(Duration.zero);
      roleRepository.emitRole('u-1', UserRole.driver);
      authGateway.emitSession(null);

      await Future<void>.delayed(const Duration(milliseconds: 20));
      await sub.cancel();

      expect(
        emitted,
        containsAllInOrder([
          UserRole.unknown,
          UserRole.guest,
          UserRole.driver,
          UserRole.unknown,
        ]),
      );
    });
  });
}

class FakeAuthGateway implements AuthGateway {
  FakeAuthGateway({required AuthSession? initialSession}) : _session = initialSession {
    _controller = StreamController<AuthSession?>.broadcast(
      onListen: () {
        _controller.add(_session);
      },
    );
  }

  late final StreamController<AuthSession?> _controller;
  AuthSession? _session;
  int anonymousSignInCount = 0;

  @override
  AuthSession? get currentSession => _session;

  @override
  Stream<AuthSession?> authStateChanges() => _controller.stream;

  void emitSession(AuthSession? session) {
    _session = session;
    _controller.add(session);
  }

  @override
  Future<AuthSession> signInAnonymously() async {
    anonymousSignInCount += 1;
    const session = AuthSession(
      uid: 'anon-user',
      isAnonymous: true,
      emailVerified: false,
    );
    _session = session;
    _controller.add(session);
    return session;
  }

  @override
  Future<void> signOut() async {
    _session = null;
    _controller.add(null);
  }
}

class FakeUserRoleRepository implements UserRoleRepository {
  final Map<String, StreamController<UserRole?>> _controllers = {};
  final Map<String, UserRole?> _latestRoles = {};

  @override
  Stream<UserRole?> watchRole(String uid) {
    return _controllerFor(uid).stream;
  }

  void emitRole(String uid, UserRole? role) {
    _latestRoles[uid] = role;
    _controllerFor(uid).add(role);
  }

  StreamController<UserRole?> _controllerFor(String uid) {
    return _controllers.putIfAbsent(
      uid,
      () => StreamController<UserRole?>.broadcast(
        onListen: () {
          if (_latestRoles.containsKey(uid)) {
            _controllers[uid]?.add(_latestRoles[uid]);
          }
        },
      ),
    );
  }
}
