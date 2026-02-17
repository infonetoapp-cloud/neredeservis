import '../data/auth_gateway.dart';
import '../data/bootstrap_user_profile_client.dart';
import '../data/user_role_repository.dart';
import '../domain/auth_session.dart';
import '../domain/user_role.dart';

class AuthRoleBootstrapService {
  const AuthRoleBootstrapService({
    required AuthGateway authGateway,
    required BootstrapUserProfileClient bootstrapClient,
    required UserRoleRepository userRoleRepository,
  })  : _authGateway = authGateway,
        _bootstrapClient = bootstrapClient,
        _userRoleRepository = userRoleRepository;

  final AuthGateway _authGateway;
  final BootstrapUserProfileClient _bootstrapClient;
  final UserRoleRepository _userRoleRepository;

  AuthSession? get currentSession => _authGateway.currentSession;

  Stream<AuthSession?> authStateChanges() => _authGateway.authStateChanges();

  Stream<UserRole> watchCurrentRole() {
    return _authGateway.authStateChanges().asyncExpand((session) {
      if (session == null) {
        return Stream.value(UserRole.unknown);
      }
      return _userRoleRepository
          .watchRole(session.uid)
          .map((role) => role ?? UserRole.unknown);
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
}
