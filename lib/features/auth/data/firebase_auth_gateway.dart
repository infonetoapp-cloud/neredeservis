import 'package:firebase_auth/firebase_auth.dart';

import '../../../core/errors/error_codes.dart';
import '../../../core/errors/error_propagation.dart';
import '../../../core/exceptions/app_exception.dart';
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
    try {
      final credential = await _auth.signInAnonymously();
      final user = credential.user;
      if (user == null) {
        throw const AppException(
          code: ErrorCodes.failedPrecondition,
          message: 'Anonymous sign-in returned null user.',
        );
      }
      return AuthSession(
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
      );
    } catch (error) {
      throw propagateAppException(
        error: error,
        fallbackCode: ErrorCodes.unavailable,
        fallbackMessage: 'Anonymous sign-in failed.',
      );
    }
  }

  @override
  Future<void> signOut() {
    return _auth.signOut();
  }
}
