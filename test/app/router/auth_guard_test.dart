import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/app_route_paths.dart';
import 'package:neredeservis/app/router/auth_guard.dart';

void main() {
  test('join qr route is public when signed out', () {
    const guard = AuthGuard(isSignedIn: false);

    expect(guard.redirect(AppRoutePath.joinQr), isNull);
  });

  test('join success route is public when signed out', () {
    const guard = AuthGuard(isSignedIn: false);

    expect(guard.redirect(AppRoutePath.joinSuccess), isNull);
  });

  test('join error route is public when signed out', () {
    const guard = AuthGuard(isSignedIn: false);

    expect(guard.redirect(AppRoutePath.joinError), isNull);
  });

  test('private route redirects to auth when signed out', () {
    const guard = AuthGuard(isSignedIn: false);

    expect(guard.redirect(AppRoutePath.settings), AppRoutePath.auth);
  });
}
