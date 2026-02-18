import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show PlatformException;
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../config/app_flavor.dart';
import '../../features/subscription/presentation/paywall_copy_tr.dart';
import '../../ui/screens/active_trip_screen.dart';
import '../../ui/screens/auth_hero_login_screen.dart';
import '../../ui/screens/driver_home_screen.dart';
import '../../ui/screens/join_screen.dart';
import '../../ui/screens/passenger_tracking_screen.dart';
import '../../ui/screens/paywall_screen.dart';
import '../../ui/screens/role_select_screen.dart';
import '../../ui/screens/settings_screen.dart';
import 'app_route_paths.dart';
import 'auth_guard.dart';
import 'role_guard.dart';

GoRouter buildAppRouter({
  required AppFlavorConfig flavorConfig,
  required AuthGuard authGuard,
  required RoleGuard roleGuard,
}) {
  return GoRouter(
    initialLocation: AppRoutePath.auth,
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutePath.auth,
        builder: (context, state) => AuthHeroLoginScreen(
          appName: flavorConfig.appName,
          onSignInTap: () => context.go(AppRoutePath.roleSelect),
          onGoogleSignInTap: () => _handleGoogleSignIn(context),
          onRegisterTap: () => context.go(AppRoutePath.roleSelect),
        ),
      ),
      GoRoute(
        path: AppRoutePath.splash,
        builder: (context, state) => AuthHeroLoginScreen(
          appName: flavorConfig.appName,
          onSignInTap: () => context.go(AppRoutePath.roleSelect),
          onGoogleSignInTap: () => _handleGoogleSignIn(context),
          onRegisterTap: () => context.go(AppRoutePath.roleSelect),
        ),
      ),
      GoRoute(
        path: AppRoutePath.roleSelect,
        builder: (context, state) => RoleSelectScreen(
          appName: flavorConfig.appName,
          onDriverTap: () => context.go(AppRoutePath.driverHome),
          onPassengerTap: () =>
              context.go('${AppRoutePath.join}?role=passenger'),
          onGuestTap: () => context.go('${AppRoutePath.join}?role=guest'),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverHome,
        builder: (context, state) => DriverHomeScreen(
          appName: flavorConfig.appName,
          onStartTripTap: () => context.go(AppRoutePath.activeTrip),
          onManageRouteTap: () => context.go(AppRoutePath.settings),
          onAnnouncementTap: () => context.go(AppRoutePath.settings),
          onSettingsTap: () => context.go(AppRoutePath.settings),
        ),
      ),
      GoRoute(
        path: AppRoutePath.paywall,
        builder: (context, state) => PaywallScreen(
          appName: flavorConfig.appName,
          subscriptionStatus: SubscriptionUiStatus.mock,
          onPurchaseTap: (_) {},
          onRestoreTap: () {},
          onManageTap: () {},
          onLaterTap: () => context.go(AppRoutePath.driverHome),
        ),
      ),
      GoRoute(
        path: AppRoutePath.activeTrip,
        builder: (context, state) => const ActiveTripScreen(),
      ),
      GoRoute(
        path: AppRoutePath.passengerHome,
        builder: (context, state) => const PassengerTrackingScreen(),
      ),
      GoRoute(
        path: AppRoutePath.passengerTracking,
        builder: (context, state) => const PassengerTrackingScreen(),
      ),
      GoRoute(
        path: AppRoutePath.join,
        builder: (context, state) => JoinScreen(
          selectedRole: joinRoleFromQuery(state.uri.queryParameters['role']),
          onJoinByCode: (_) => context.go(AppRoutePath.passengerTracking),
          onScanQrTap: () => context.go(AppRoutePath.passengerTracking),
          onContinueDriverTap: () => context.go(AppRoutePath.driverHome),
        ),
      ),
      GoRoute(
        path: AppRoutePath.settings,
        builder: (context, state) => SettingsScreen(
          appName: flavorConfig.appName,
          subscriptionStatus: SubscriptionUiStatus.trialActive,
          onSubscriptionTap: () => context.go(AppRoutePath.paywall),
        ),
      ),
    ],
    redirect: (context, state) {
      final location = state.matchedLocation;

      final authRedirect = authGuard.redirect(location);
      if (authRedirect != null && authRedirect != location) {
        return authRedirect;
      }

      final roleRedirect = roleGuard.redirect(location);
      if (roleRedirect != null && roleRedirect != location) {
        return roleRedirect;
      }

      return null;
    },
  );
}

Future<void> _handleGoogleSignIn(BuildContext context) async {
  try {
    final googleSignIn = GoogleSignIn();
    final googleUser = await googleSignIn.signIn();
    if (googleUser == null) {
      return;
    }

    final googleAuth = await googleUser.authentication;
    final idToken = _nullableToken(googleAuth.idToken);
    final accessToken = _nullableToken(googleAuth.accessToken);

    if (idToken == null && accessToken == null) {
      throw FirebaseAuthException(
        code: 'missing-google-tokens',
        message: 'Google tokenlari alinamadi.',
      );
    }

    final credential = GoogleAuthProvider.credential(
      idToken: idToken,
      accessToken: accessToken,
    );

    await FirebaseAuth.instance.signInWithCredential(credential);
    if (!context.mounted) {
      return;
    }
    context.go(AppRoutePath.roleSelect);
  } on PlatformException catch (error) {
    if (!context.mounted) {
      return;
    }

    final message = switch (error.code) {
      'sign_in_canceled' => 'Google girisi iptal edildi.',
      'sign_in_failed' =>
        'Google girisi basarisiz oldu. Google Play Services durumunu kontrol et.',
      _ => 'Google girisi baslatilamadi (${error.code}).',
    };

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  } on FirebaseAuthException catch (error) {
    if (!context.mounted) {
      return;
    }

    final message = switch (error.code) {
      'network-request-failed' =>
        'Google girisi acilamadi. Internet baglantini kontrol et.',
      'operation-not-allowed' =>
        'Google provider kapali gorunuyor. Firebase ayarini kontrol et.',
      'invalid-credential' => 'Google giris kimligi dogrulanamadi.',
      'missing-google-tokens' =>
        'Google tokeni alinamadi. Hesap secimini tekrar dene.',
      _ => 'Google girisi baslatilamadi (${error.code}).',
    };

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  } catch (_) {
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Google girisi su an baslatilamadi.')),
    );
  }
}

String? _nullableToken(String? value) {
  final token = value?.trim();
  if (token == null || token.isEmpty) {
    return null;
  }
  return token;
}
