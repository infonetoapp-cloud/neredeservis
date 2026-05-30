class AuthUser {
  AuthUser({
    required this.uid,
    required this.isAnonymous,
    required this.emailVerified,
    this.email,
    this.displayName,
    this.phoneNumber,
    this.photoURL,
    required Future<String?> Function(bool forceRefresh) idTokenReader,
    required Future<void> Function() reloader,
    required Future<void> Function() emailVerificationSender,
    required Future<void> Function(String? displayName) displayNameUpdater,
    required Future<void> Function(String? photoUrl) photoUrlUpdater,
  })  : _idTokenReader = idTokenReader,
        _reloader = reloader,
        _emailVerificationSender = emailVerificationSender,
        _displayNameUpdater = displayNameUpdater,
        _photoUrlUpdater = photoUrlUpdater;

  final String uid;
  final bool isAnonymous;
  final bool emailVerified;
  final String? email;
  final String? displayName;
  final String? phoneNumber;
  final String? photoURL;
  final Future<String?> Function(bool forceRefresh) _idTokenReader;
  final Future<void> Function() _reloader;
  final Future<void> Function() _emailVerificationSender;
  final Future<void> Function(String? displayName) _displayNameUpdater;
  final Future<void> Function(String? photoUrl) _photoUrlUpdater;

  Future<String?> getIdToken([bool forceRefresh = false]) {
    return _idTokenReader(forceRefresh);
  }

  Future<void> reload() {
    return _reloader();
  }

  Future<void> sendEmailVerification() {
    return _emailVerificationSender();
  }

  Future<void> updateDisplayName(String? displayName) {
    return _displayNameUpdater(displayName);
  }

  Future<void> updatePhotoURL(String? photoUrl) {
    return _photoUrlUpdater(photoUrl);
  }
}

class AuthCredentialResult {
  const AuthCredentialResult({
    required this.user,
  });

  final AuthUser? user;
}

class AuthCredentialException implements Exception {
  const AuthCredentialException({
    required this.code,
    required this.message,
  });

  final String code;
  final String message;

  @override
  String toString() {
    return 'AuthCredentialException(code: $code, message: $message)';
  }
}

abstract class AuthCredentialGateway {
  AuthUser? get currentUser;

  Future<AuthCredentialResult> signInWithEmailAndPassword({
    required String email,
    required String password,
  });

  Future<AuthCredentialResult> createUserWithEmailAndPassword({
    required String email,
    required String password,
  });

  Future<void> sendPasswordResetEmail({
    required String email,
  });

  Future<AuthCredentialResult> signInWithGoogleTokens({
    String? idToken,
    String? accessToken,
  });

  Future<AuthCredentialResult> signInWithGoogleProvider();

  Future<AuthCredentialResult> signInWithMicrosoftProvider();

  Future<AuthCredentialResult> signInAnonymously();

  Future<void> signOut();
}
