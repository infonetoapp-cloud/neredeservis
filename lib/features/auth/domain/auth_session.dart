class AuthSession {
  const AuthSession({
    required this.uid,
    required this.isAnonymous,
    required this.emailVerified,
  });

  final String uid;
  final bool isAnonymous;
  final bool emailVerified;
}
