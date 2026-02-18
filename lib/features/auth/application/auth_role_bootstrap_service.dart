import 'dart:async';

import '../../../core/errors/error_codes.dart';
import '../../../core/errors/error_propagation.dart';
import '../../../core/exceptions/app_exception.dart';
import '../data/auth_gateway.dart';
import '../data/bootstrap_user_profile_client.dart';
import '../data/profile_error_propagation.dart';
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
            onError: (Object error, StackTrace stackTrace) {
              controller.addError(
                propagateAppException(
                  error: error,
                  fallbackCode: ErrorCodes.unknown,
                  fallbackMessage: 'Role stream failed.',
                ),
                stackTrace,
              );
            },
          );
        },
        onError: (Object error, StackTrace stackTrace) {
          controller.addError(
            propagateAppException(
              error: error,
              fallbackCode: ErrorCodes.unknown,
              fallbackMessage: 'Auth stream failed.',
            ),
            stackTrace,
          );
        },
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
    try {
      return await _authGateway.signInAnonymously();
    } catch (error) {
      throw propagateAppException(
        error: error,
        fallbackCode: ErrorCodes.unavailable,
        fallbackMessage: 'Anonymous sign-in failed.',
      );
    }
  }

  Future<BootstrapUserProfileResult> bootstrapCurrentUserProfile({
    required String displayName,
    String? phone,
  }) async {
    final session = _authGateway.currentSession;
    if (session == null) {
      throw const AppException(
        code: ErrorCodes.failedPrecondition,
        message: 'User must be signed in before bootstrap.',
      );
    }
    try {
      return await _bootstrapClient.bootstrap(
        BootstrapUserProfileInput(
          displayName: displayName,
          phone: phone,
        ),
      );
    } catch (error) {
      throw propagateProfileCallableException(
        callableName: 'bootstrapUserProfile',
        error: error,
      );
    }
  }

  Future<UpdateUserProfileResult> updateCurrentUserProfile({
    required String displayName,
    String? phone,
  }) async {
    final session = _authGateway.currentSession;
    if (session == null) {
      throw const AppException(
        code: ErrorCodes.failedPrecondition,
        message: 'User must be signed in before profile update.',
      );
    }
    try {
      return await _updateUserProfileClient.update(
        UpdateUserProfileInput(
          displayName: displayName,
          phone: phone,
        ),
      );
    } catch (error) {
      throw propagateProfileCallableException(
        callableName: 'updateUserProfile',
        error: error,
      );
    }
  }
}
