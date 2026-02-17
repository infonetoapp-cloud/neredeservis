import '../domain/auth_session.dart';

abstract class AuthGateway {
  AuthSession? get currentSession;

  Stream<AuthSession?> authStateChanges();

  Future<AuthSession> signInAnonymously();

  Future<void> signOut();
}
