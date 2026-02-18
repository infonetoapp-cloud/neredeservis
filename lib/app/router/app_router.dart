import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show PlatformException;
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../config/app_environment.dart';
import '../../config/app_flavor.dart';
import '../../config/firebase_regions.dart';
import '../../features/subscription/presentation/paywall_copy_tr.dart';
import '../../ui/screens/active_trip_screen.dart';
import '../../ui/screens/auth_hero_login_screen.dart';
import '../../ui/screens/driver_home_screen.dart';
import '../../ui/screens/driver_profile_setup_screen.dart';
import '../../ui/screens/join_screen.dart';
import '../../ui/screens/passenger_tracking_screen.dart';
import '../../ui/screens/paywall_screen.dart';
import '../../ui/screens/profile_edit_screen.dart';
import '../../ui/screens/role_select_screen.dart';
import '../../ui/screens/route_create_screen.dart';
import '../../ui/screens/settings_screen.dart';
import 'app_route_paths.dart';
import 'auth_guard.dart';
import 'consent_guard.dart';
import 'role_guard.dart';

GoRouter buildAppRouter({
  required AppFlavorConfig flavorConfig,
  required AppEnvironment environment,
  required AuthGuard authGuard,
  required RoleGuard roleGuard,
  required ConsentGuard consentGuard,
}) {
  return GoRouter(
    initialLocation: AppRoutePath.auth,
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutePath.auth,
        builder: (context, state) => AuthHeroLoginScreen(
          appName: flavorConfig.appName,
          onSignInTap: () => _handleEmailSignIn(context),
          onGoogleSignInTap: () => _handleGoogleSignIn(context),
          onRegisterTap: () => _handleEmailRegister(context),
        ),
      ),
      GoRoute(
        path: AppRoutePath.splash,
        builder: (context, state) => AuthHeroLoginScreen(
          appName: flavorConfig.appName,
          onSignInTap: () => _handleEmailSignIn(context),
          onGoogleSignInTap: () => _handleGoogleSignIn(context),
          onRegisterTap: () => _handleEmailRegister(context),
        ),
      ),
      GoRoute(
        path: AppRoutePath.roleSelect,
        builder: (context, state) => RoleSelectScreen(
          appName: flavorConfig.appName,
          onDriverTap: () => _handleContinueAsDriver(context),
          onPassengerTap: () => _handleContinueAsPassenger(context),
          onGuestTap: () => _handleContinueAsGuest(context),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverProfileSetup,
        builder: (context, state) {
          final user = FirebaseAuth.instance.currentUser;
          return DriverProfileSetupScreen(
            initialName: _resolveDisplayName(user),
            initialPhone: user?.phoneNumber,
            onSave: (name, phone, plate, showPhoneToPassengers) =>
                _handleDriverProfileSetupSave(
              context,
              name: name,
              phone: phone,
              plate: plate,
              showPhoneToPassengers: showPhoneToPassengers,
            ),
          );
        },
      ),
      GoRoute(
        path: AppRoutePath.driverHome,
        builder: (context, state) => DriverHomeScreen(
          appName: flavorConfig.appName,
          onStartTripTap: () => context.go(AppRoutePath.activeTrip),
          onManageRouteTap: () => context.go(AppRoutePath.driverRouteCreate),
          onAnnouncementTap: () => context.go(AppRoutePath.settings),
          onSettingsTap: () => context.go(AppRoutePath.settings),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverRouteCreate,
        builder: (context, state) => RouteCreateScreen(
          onCreate: (input) => _handleCreateRoute(context, input),
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
        builder: (context, state) => PassengerTrackingScreen(
          mapboxPublicToken: environment.mapboxPublicToken,
        ),
      ),
      GoRoute(
        path: AppRoutePath.passengerTracking,
        builder: (context, state) => PassengerTrackingScreen(
          mapboxPublicToken: environment.mapboxPublicToken,
        ),
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
          initialConsentEnabled: consentGuard.hasLocationConsent,
          onSubscriptionTap: () => context.go(AppRoutePath.paywall),
          onProfileTap: () => context.go(AppRoutePath.profileEdit),
          onConsentTap: (value) => _handleConsentUpdate(context, value),
          onDeleteAccountTap: () => _handleDeleteAccount(context),
        ),
      ),
      GoRoute(
        path: AppRoutePath.profileEdit,
        builder: (context, state) {
          final user = FirebaseAuth.instance.currentUser;
          final initialDisplayName = _resolveDisplayName(user);
          return ProfileEditScreen(
            initialDisplayName: initialDisplayName,
            onSave: (displayName, phone) => _handleProfileUpdate(
              context,
              displayName: displayName,
              phone: phone,
            ),
          );
        },
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

      final consentRedirect = consentGuard.redirect(location);
      if (consentRedirect != null && consentRedirect != location) {
        return consentRedirect;
      }

      return null;
    },
  );
}

Future<void> _handleEmailSignIn(BuildContext context) async {
  final input = await _showEmailAuthDialog(
    context,
    title: 'Email ile Giris',
    actionLabel: 'Giris Yap',
  );
  if (input == null) {
    return;
  }

  try {
    await FirebaseAuth.instance.signInWithEmailAndPassword(
      email: input.email,
      password: input.password,
    );
  } on FirebaseAuthException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(
      context,
      switch (error.code) {
        'invalid-credential' => 'Email veya sifre hatali.',
        'user-not-found' => 'Bu email ile kullanici bulunamadi.',
        'wrong-password' => 'Sifre hatali.',
        'network-request-failed' => 'Internet baglantini kontrol et.',
        _ => 'Email girisi basarisiz (${error.code}).',
      },
    );
    return;
  }

  try {
    await _bootstrapCurrentProfile();
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil hazirlanamadi (${error.code}).');
  } catch (_) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil hazirlanamadi. Sonra tekrar dene.');
  }

  if (!context.mounted) {
    return;
  }
  context.go(AppRoutePath.roleSelect);
}

Future<void> _handleEmailRegister(BuildContext context) async {
  final input = await _showEmailAuthDialog(
    context,
    title: 'Email ile Kayit',
    actionLabel: 'Kayit Ol',
  );
  if (input == null) {
    return;
  }

  try {
    await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: input.email,
      password: input.password,
    );
  } on FirebaseAuthException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(
      context,
      switch (error.code) {
        'email-already-in-use' => 'Bu email zaten kayitli.',
        'weak-password' => 'Sifre en az 6 karakter olmali.',
        'invalid-email' => 'Email formati gecersiz.',
        'network-request-failed' => 'Internet baglantini kontrol et.',
        _ => 'Kayit islemi basarisiz (${error.code}).',
      },
    );
    return;
  }

  try {
    await _bootstrapCurrentProfile();
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil hazirlanamadi (${error.code}).');
  } catch (_) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil hazirlanamadi. Sonra tekrar dene.');
  }

  if (!context.mounted) {
    return;
  }
  context.go(AppRoutePath.roleSelect);
}

Future<void> _handleGoogleSignIn(BuildContext context) async {
  UserCredential? credentialResult;
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

    credentialResult =
        await FirebaseAuth.instance.signInWithCredential(credential);
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
    return;
  }

  if (credentialResult?.user == null) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Google hesabi dogrulanamadi.');
    return;
  }

  try {
    await _bootstrapCurrentProfile();
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil hazirlanamadi (${error.code}).');
  } catch (_) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil hazirlanamadi. Sonra tekrar dene.');
  }

  if (!context.mounted) {
    return;
  }
  context.go(AppRoutePath.roleSelect);
}

Future<void> _handleContinueAsPassenger(BuildContext context) async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null || user.isAnonymous) {
    _showInfo(
      context,
      'Yolcu rolu icin once email veya Google ile giris yap.',
    );
    return;
  }

  try {
    await _bootstrapCurrentProfile();
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil kontrolu basarisiz (${error.code}).');
    return;
  } catch (_) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil kontrolu su an yapilamadi.');
    return;
  }

  if (!context.mounted) {
    return;
  }
  context.go('${AppRoutePath.join}?role=passenger');
}

Future<void> _handleContinueAsDriver(BuildContext context) async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null || user.isAnonymous) {
    _showInfo(
      context,
      'Sofor rolu icin once email veya Google ile giris yap.',
    );
    return;
  }

  String role;
  try {
    role = await _bootstrapCurrentProfile();
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil kontrolu basarisiz (${error.code}).');
    return;
  } catch (_) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil kontrolu su an yapilamadi.');
    return;
  }

  if (role != 'driver') {
    if (!context.mounted) {
      return;
    }
    _showInfo(
      context,
      'Hesabin driver rolunde degil. Yetki tanimlandiktan sonra tekrar dene.',
    );
    return;
  }

  if (!context.mounted) {
    return;
  }
  final destination = await _resolveDriverEntryDestination(user);
  if (!context.mounted) {
    return;
  }
  context.go(destination);
}

Future<void> _handleContinueAsGuest(BuildContext context) async {
  final auth = FirebaseAuth.instance;
  final currentUser = auth.currentUser;
  if (currentUser != null && !currentUser.isAnonymous) {
    await auth.signOut();
  }
  await auth.signInAnonymously();
  try {
    await _bootstrapCurrentProfile();
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Misafir profili hazirlanamadi (${error.code}).');
    return;
  } catch (_) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Misafir profili hazirlanamadi.');
    return;
  }

  if (!context.mounted) {
    return;
  }
  context.go('${AppRoutePath.join}?role=guest');
}

Future<void> _handleProfileUpdate(
  BuildContext context, {
  required String displayName,
  String? phone,
}) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('updateUserProfile');
    await callable.call(<String, dynamic>{
      'displayName': displayName,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil guncellendi.');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Profil guncellenemedi (${error.code}).');
    rethrow;
  }
}

Future<void> _handleCreateRoute(
  BuildContext context,
  RouteCreateFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('createRoute');
    final response = await callable.call(<String, dynamic>{
      'name': input.name,
      'startPoint': <String, double>{
        'lat': input.startLat,
        'lng': input.startLng,
      },
      'startAddress': input.startAddress,
      'endPoint': <String, double>{
        'lat': input.endLat,
        'lng': input.endLng,
      },
      'endAddress': input.endAddress,
      'scheduledTime': input.scheduledTime,
      'timeSlot': input.timeSlot,
      'allowGuestTracking': input.allowGuestTracking,
      'authorizedDriverIds': const <String>[],
    });
    final payload = _extractCallableData(response.data);
    final srvCode = payload['srvCode'] as String? ?? '-';
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Rota olusturuldu. SRV: $srvCode');
    context.go(AppRoutePath.driverHome);
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Rota olusturulamadi (${error.code}).');
  }
}

Future<void> _handleDriverProfileSetupSave(
  BuildContext context, {
  required String name,
  required String phone,
  required String plate,
  required bool showPhoneToPassengers,
}) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('upsertDriverProfile');
    await callable.call(<String, dynamic>{
      'name': name,
      'phone': phone,
      'plate': plate.toUpperCase(),
      'showPhoneToPassengers': showPhoneToPassengers,
      'companyId': null,
    });

    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      try {
        await _registerDevice(user);
      } catch (_) {
        // Driver profile kaydedildi; device register kritik olmayan fallback.
      }
    }

    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Sofor profili kaydedildi.');
    context.go(AppRoutePath.driverHome);
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Sofor profili kaydedilemedi (${error.code}).');
    rethrow;
  }
}

Future<void> _handleConsentUpdate(BuildContext context, bool value) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('upsertConsent');
    await callable.call(<String, dynamic>{
      'privacyVersion': 'v1.0-draft',
      'kvkkTextVersion': 'v1.0-draft',
      'locationConsent': value,
      'platform': _platformValue(),
    });
    if (!context.mounted) {
      return;
    }
    _showInfo(
      context,
      value ? 'Acik riza kaydedildi.' : 'Acik riza pasif hale getirildi.',
    );
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Acik riza guncellenemedi (${error.code}).');
  }
}

Future<void> _handleDeleteAccount(BuildContext context) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('deleteUserData');
    final response = await callable.call(<String, dynamic>{
      'dryRun': false,
    });
    final payload = _extractCallableData(response.data);
    final status = payload['status'] as String? ?? '';
    if (!context.mounted) {
      return;
    }
    if (status == 'blocked_subscription') {
      final message = payload['interceptorMessage'] as String? ??
          'Abonelik aktif oldugu icin hesap silme bloklandi.';
      _showInfo(context, message);
      return;
    }
    _showInfo(context, 'Hesap silme talebi alindi.');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Hesap silme talebi basarisiz (${error.code}).');
  }
}

Future<String> _bootstrapCurrentProfile() async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) {
    return 'unknown';
  }

  final callable =
      FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
          .httpsCallable('bootstrapUserProfile');
  final response = await callable.call(<String, dynamic>{
    'displayName': _resolveDisplayName(user),
  });
  final payload = _extractCallableData(response.data);
  final role = (payload['role'] as String? ?? 'unknown').toLowerCase();
  if (role == 'driver') {
    try {
      await _registerDevice(user);
    } on FirebaseFunctionsException catch (error) {
      debugPrint('registerDevice skipped (${error.code}).');
    } catch (_) {
      debugPrint('registerDevice skipped (unknown).');
    }
  }
  return role;
}

Future<void> _registerDevice(User user) async {
  final callable =
      FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
          .httpsCallable('registerDevice');
  String? pushToken;
  try {
    pushToken = await FirebaseMessaging.instance.getToken();
  } catch (_) {
    pushToken = null;
  }
  final token = (pushToken == null || pushToken.trim().isEmpty)
      ? 'push_token_pending'
      : pushToken.trim();
  final uidPrefix = user.uid.length <= 8 ? user.uid : user.uid.substring(0, 8);
  await callable.call(<String, dynamic>{
    'deviceId': '${_devicePlatformKey()}_$uidPrefix',
    'activeDeviceToken': token,
    'lastSeenAt': DateTime.now().toUtc().toIso8601String(),
  });
}

Future<String> _resolveDriverEntryDestination(User user) async {
  try {
    final snapshot = await FirebaseFirestore.instance
        .collection('drivers')
        .doc(user.uid)
        .get();
    final data = snapshot.data();
    if (_hasReadyDriverProfile(data)) {
      return AppRoutePath.driverHome;
    }
    return AppRoutePath.driverProfileSetup;
  } catch (_) {
    return AppRoutePath.driverProfileSetup;
  }
}

bool _hasReadyDriverProfile(Map<String, dynamic>? data) {
  if (data == null) {
    return false;
  }
  final name = (data['name'] as String? ?? '').trim();
  final phone = (data['phone'] as String? ?? '').trim();
  final plate = (data['plate'] as String? ?? '').trim();
  return name.length >= 2 && phone.length >= 7 && plate.length >= 3;
}

String _resolveDisplayName(User? user) {
  if (user == null) {
    return 'Kullanici';
  }
  final displayName = user.displayName?.trim();
  if (displayName != null && displayName.length >= 2) {
    return displayName;
  }
  final email = user.email?.trim();
  if (email != null && email.isNotEmpty) {
    final prefix = email.split('@').first.trim();
    if (prefix.length >= 2) {
      return prefix;
    }
  }
  return user.isAnonymous ? 'Misafir' : 'Kullanici';
}

Map<String, dynamic> _extractCallableData(dynamic raw) {
  if (raw is! Map) {
    return <String, dynamic>{};
  }
  final payload = Map<String, dynamic>.from(raw);
  final nested = payload['data'];
  if (nested is Map) {
    return Map<String, dynamic>.from(nested);
  }
  return payload;
}

Future<_EmailAuthInput?> _showEmailAuthDialog(
  BuildContext context, {
  required String title,
  required String actionLabel,
}) async {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  try {
    return await showDialog<_EmailAuthInput>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(title),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              TextField(
                controller: emailController,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Email',
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: passwordController,
                decoration: const InputDecoration(
                  labelText: 'Sifre',
                ),
                obscureText: true,
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Iptal'),
            ),
            FilledButton(
              onPressed: () {
                final email = emailController.text.trim();
                final password = passwordController.text.trim();
                if (email.isEmpty || password.isEmpty) {
                  return;
                }
                Navigator.of(dialogContext).pop(
                  _EmailAuthInput(email: email, password: password),
                );
              },
              child: Text(actionLabel),
            ),
          ],
        );
      },
    );
  } finally {
    emailController.dispose();
    passwordController.dispose();
  }
}

void _showInfo(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message)),
  );
}

String _platformValue() {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    return 'ios';
  }
  return 'android';
}

String _devicePlatformKey() {
  return switch (defaultTargetPlatform) {
    TargetPlatform.android => 'android',
    TargetPlatform.iOS => 'ios',
    TargetPlatform.macOS => 'macos',
    TargetPlatform.windows => 'windows',
    TargetPlatform.linux => 'linux',
    TargetPlatform.fuchsia => 'fuchsia',
  };
}

String? _nullableToken(String? value) {
  final token = value?.trim();
  if (token == null || token.isEmpty) {
    return null;
  }
  return token;
}

class _EmailAuthInput {
  const _EmailAuthInput({
    required this.email,
    required this.password,
  });

  final String email;
  final String password;
}
