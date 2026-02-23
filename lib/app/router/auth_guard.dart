import 'app_route_paths.dart';

class AuthGuard {
  const AuthGuard({
    required this.isSignedIn,
  });

  final bool isSignedIn;

  static const Set<String> _publicRoutes = <String>{
    AppRoutePath.splash,
    AppRoutePath.auth,
    AppRoutePath.authEmail,
    AppRoutePath.roleSelect,
    AppRoutePath.join,
    AppRoutePath.joinQr,
    AppRoutePath.joinSuccess,
    AppRoutePath.joinError,
  };

  String? redirect(String location) {
    if (isSignedIn || _publicRoutes.contains(location)) {
      return null;
    }
    return AppRoutePath.auth;
  }
}
