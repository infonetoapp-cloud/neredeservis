import 'package:firebase_auth/firebase_auth.dart';

import 'auth_credential_gateway.dart';

class FirebaseAuthCredentialGateway implements AuthCredentialGateway {
  FirebaseAuthCredentialGateway({
    FirebaseAuth? auth,
  }) : _auth = auth ?? FirebaseAuth.instance;

  final FirebaseAuth _auth;

  @override
  User? get currentUser => _auth.currentUser;

  @override
  Future<UserCredential> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) {
    return _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  @override
  Future<UserCredential> createUserWithEmailAndPassword({
    required String email,
    required String password,
  }) {
    return _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  @override
  Future<void> sendPasswordResetEmail({
    required String email,
  }) {
    return _auth.sendPasswordResetEmail(email: email);
  }

  @override
  Future<UserCredential> signInWithCredential(AuthCredential credential) {
    return _auth.signInWithCredential(credential);
  }

  @override
  Future<UserCredential> signInWithProvider(AuthProvider provider) {
    return _auth.signInWithProvider(provider);
  }

  @override
  Future<UserCredential> signInAnonymously() {
    return _auth.signInAnonymously();
  }

  @override
  Future<void> signOut() {
    return _auth.signOut();
  }
}
