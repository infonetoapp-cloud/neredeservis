import '../domain/auth_session.dart';
import 'auth_gateway.dart';
import 'identity_toolkit_auth_runtime.dart';

class IdentityToolkitAuthGateway implements AuthGateway {
  IdentityToolkitAuthGateway({
    IdentityToolkitAuthRuntime? runtime,
  }) : _runtime = runtime ?? identityToolkitAuthRuntime;

  final IdentityToolkitAuthRuntime _runtime;

  @override
  AuthSession? get currentSession => _runtime.currentSession;

  @override
  Stream<AuthSession?> authStateChanges() {
    return _runtime.authStateChanges();
  }

  @override
  Future<AuthSession> signInAnonymously() {
    return _runtime.signInAnonymously();
  }

  @override
  Future<void> signOut() {
    return _runtime.signOut();
  }
}
