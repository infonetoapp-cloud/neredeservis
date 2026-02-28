import 'package:firebase_auth/firebase_auth.dart';

abstract class AuthCredentialGateway {
  User? get currentUser;

  Future<UserCredential> signInWithEmailAndPassword({
    required String email,
    required String password,
  });

  Future<UserCredential> createUserWithEmailAndPassword({
    required String email,
    required String password,
  });

  Future<void> sendPasswordResetEmail({
    required String email,
  });

  Future<UserCredential> signInWithCredential(
    AuthCredential credential,
  );

  Future<UserCredential> signInWithProvider(
    AuthProvider provider,
  );

  Future<UserCredential> signInAnonymously();

  Future<void> signOut();
}
