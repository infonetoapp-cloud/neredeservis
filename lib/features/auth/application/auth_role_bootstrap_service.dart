import 'dart:async';

import '../data/auth_gateway.dart';
import '../data/bootstrap_user_profile_client.dart';
import '../data/update_user_profile_client.dart';
import '../data/user_role_repository.dart';
import '../domain/auth_session.dart';
import '../domain/user_role.dart';

class AuthRoleBootstrapService {
  const AuthRoleBootstrapService({
    required AuthGateway authGateway,
    required BootstrapUserProfileClient bootstrapClient,
    required UpdateUserProfileClient updateUserProfileClient,
    required UserRoleRepository userRoleRepository,
  })  : _authGateway = authGateway,
        _bootstrapClient = bootstrapClient,
        _updateUserProfileClient = updateUserProfileClient,
        _userRoleRepository = userRoleRepository;

  final AuthGateway _authGateway;
  final BootstrapUserProfileClient _bootstrapClient;
  final UpdateUserProfileClient _updateUserProfileClient;
  final UserRoleRepository _userRoleRepository;

  AuthSession? get currentSession => _authGateway.currentSession;

  Stream<AuthSession?> authStateChanges() => _authGateway.authStateChanges();

  Stream<UserRole> watchCurrentRole() {
    return Stream<UserRole>.multi((controller) {
      StreamSubscription<UserRole?>? roleSubscription;

      final authSubscription = _authGateway.authStateChanges().listen(
        (session) {
          roleSubscription?.cancel();
          roleSubscription = null;

          if (session == null) {
            controller.add(UserRole.unknown);
            return;
          }

          roleSubscription = _userRoleRepository.watchRole(session.uid).listen(
            (role) => controller.add(role ?? UserRole.unknown),
            onError: controller.addError,
          );
        },
        onError: controller.addError,
        onDone: () async {
          await roleSubscription?.cancel();
          controller.close();
        },
      );

      controller.onCancel = () async {
        await roleSubscription?.cancel();
        await authSubscription.cancel();
      };
    });
  }

  Future<AuthSession> ensureAnonymousSession() async {
    final existingSession = _authGateway.currentSession;
    if (existingSession != null) {
      return existingSession;
    }
    return _authGateway.signInAnonymously();
  }

  Future<BootstrapUserProfileResult> bootstrapCurrentUserProfile({
    required String displayName,
    String? phone,
  }) async {
    final session = _authGateway.currentSession;
    if (session == null) {
      throw StateError('User must be signed in before bootstrap.');
    }

    return _bootstrapClient.bootstrap(
      BootstrapUserProfileInput(
        displayName: displayName,
        phone: phone,
      ),
    );
  }

  Future<UpdateUserProfileResult> updateCurrentUserProfile({
    required String displayName,
    String? phone,
  }) async {
    final session = _authGateway.currentSession;
    if (session == null) {
      throw StateError('User must be signed in before profile update.');
    }

    return _updateUserProfileClient.update(
      UpdateUserProfileInput(
        displayName: displayName,
        phone: phone,
      ),
    );
  }
}
