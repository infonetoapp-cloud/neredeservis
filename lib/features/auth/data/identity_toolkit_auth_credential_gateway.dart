import 'auth_credential_gateway.dart';
import 'identity_toolkit_auth_runtime.dart';

class IdentityToolkitAuthCredentialGateway implements AuthCredentialGateway {
  IdentityToolkitAuthCredentialGateway({
    IdentityToolkitAuthRuntime? runtime,
  }) : _runtime = runtime ?? identityToolkitAuthRuntime;

  final IdentityToolkitAuthRuntime _runtime;

  @override
  AuthUser? get currentUser => _runtime.currentUser;

  @override
  Future<AuthCredentialResult> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) {
    return _runtime.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  @override
  Future<AuthCredentialResult> createUserWithEmailAndPassword({
    required String email,
    required String password,
  }) {
    return _runtime.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  @override
  Future<void> sendPasswordResetEmail({
    required String email,
  }) {
    return _runtime.sendPasswordResetEmail(email: email);
  }

  @override
  Future<AuthCredentialResult> signInWithGoogleTokens({
    String? idToken,
    String? accessToken,
  }) {
    return _runtime.signInWithGoogleTokens(
      idToken: idToken,
      accessToken: accessToken,
    );
  }

  @override
  Future<AuthCredentialResult> signInWithGoogleProvider() {
    return _runtime.signInWithGoogleProvider();
  }

  @override
  Future<AuthCredentialResult> signInWithMicrosoftProvider() {
    return _runtime.signInWithMicrosoftProvider();
  }

  @override
  Future<AuthCredentialResult> signInAnonymously() {
    return _runtime.signInAnonymouslyCredential();
  }

  @override
  Future<void> signOut() {
    return _runtime.signOut();
  }
}
