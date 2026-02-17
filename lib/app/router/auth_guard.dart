import 'app_route_paths.dart';

class AuthGuard {
  const AuthGuard({
    required this.isSignedIn,
  });

  final bool isSignedIn;

  static const Set<String> _publicRoutes = <String>{
    AppRoutePath.splash,
    AppRoutePath.auth,
    AppRoutePath.join,
  };

  String? redirect(String location) {
    if (isSignedIn || _publicRoutes.contains(location)) {
      return null;
    }
    return AppRoutePath.auth;
  }
}
