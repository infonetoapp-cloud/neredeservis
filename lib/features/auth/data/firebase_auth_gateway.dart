import 'package:firebase_auth/firebase_auth.dart';

import '../domain/auth_session.dart';
import 'auth_gateway.dart';

class FirebaseAuthGateway implements AuthGateway {
  FirebaseAuthGateway({
    FirebaseAuth? auth,
  }) : _auth = auth ?? FirebaseAuth.instance;

  final FirebaseAuth _auth;

  @override
  AuthSession? get currentSession {
    final user = _auth.currentUser;
    if (user == null) {
      return null;
    }
    return AuthSession(
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
    );
  }

  @override
  Stream<AuthSession?> authStateChanges() {
    return _auth.authStateChanges().map((user) {
      if (user == null) {
        return null;
      }
      return AuthSession(
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
      );
    });
  }

  @override
  Future<AuthSession> signInAnonymously() async {
    final credential = await _auth.signInAnonymously();
    final user = credential.user;
    if (user == null) {
      throw StateError('Anonymous sign-in returned null user.');
    }
    return AuthSession(
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
    );
  }

  @override
  Future<void> signOut() {
    return _auth.signOut();
  }
}
