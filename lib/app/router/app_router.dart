import 'dart:async';
import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show PlatformException;
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:share/share.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_environment.dart';
import '../../config/app_flavor.dart';
import '../../config/firebase_regions.dart';
import '../../features/location/application/kalman_location_smoother.dart';
import '../../features/location/application/location_freshness.dart';
import '../../features/subscription/presentation/paywall_copy_tr.dart';
import '../../ui/components/sheets/passenger_map_sheet.dart';
import '../../ui/screens/active_trip_screen.dart';
import '../../ui/screens/auth_hero_login_screen.dart';
import '../../ui/screens/driver_home_screen.dart';
import '../../ui/screens/driver_profile_setup_screen.dart';
import '../../ui/screens/driver_route_management_screen.dart';
import '../../ui/screens/join_screen.dart';
import '../../ui/screens/passenger_settings_screen.dart';
import '../../ui/screens/passenger_tracking_screen.dart';
import '../../ui/screens/paywall_screen.dart';
import '../../ui/screens/profile_edit_screen.dart';
import '../../ui/screens/role_select_screen.dart';
import '../../ui/screens/route_create_screen.dart';
import '../../ui/screens/route_update_screen.dart';
import '../../ui/screens/settings_screen.dart';
import '../../ui/screens/stop_crud_screen.dart';
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
          onStartTripTap: () => _handleStartTripWithUndo(context),
          onManageRouteTap: () => context.go(AppRoutePath.driverRoutesManage),
          onAnnouncementTap: () => _handleSendDriverAnnouncement(context),
          onSettingsTap: () => context.go(AppRoutePath.settings),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverRoutesManage,
        builder: (context, state) => DriverRouteManagementScreen(
          onCreateRouteTap: () => context.go(AppRoutePath.driverRouteCreate),
          onUpdateRouteTap: () => context.go(AppRoutePath.driverRouteUpdate),
          onManageStopsTap: () => context.go(AppRoutePath.driverRouteStops),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverRouteCreate,
        builder: (context, state) => RouteCreateScreen(
          onCreate: (input) => _handleCreateRoute(context, input),
          onCreateFromGhostDrive: (input) =>
              _handleCreateRouteFromGhostDrive(context, input),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverRouteUpdate,
        builder: (context, state) => RouteUpdateScreen(
          onSubmit: (input) => _handleUpdateRoute(context, input),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverRouteStops,
        builder: (context, state) => StopCrudScreen(
          onUpsert: (input) => _handleUpsertStop(context, input),
          onDelete: (input) => _handleDeleteStop(context, input),
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
        builder: (context, state) {
          final routeName =
              _nullableParam(state.uri.queryParameters['routeName']) ??
                  'Darica -> GOSB';
          final routeId = _nullableParam(state.uri.queryParameters['routeId']);
          final tripId = _nullableParam(state.uri.queryParameters['tripId']);
          final transitionVersion = int.tryParse(
            _nullableParam(state.uri.queryParameters['transitionVersion']) ??
                '',
          );
          return _DriverFinishTripGuard(
            routeId: routeId,
            tripId: tripId,
            routeName: routeName,
            initialTransitionVersion: transitionVersion,
          );
        },
      ),
      GoRoute(
        path: AppRoutePath.passengerHome,
        builder: (context, state) =>
            _buildPassengerTrackingRoute(context, state, environment),
      ),
      GoRoute(
        path: AppRoutePath.passengerTracking,
        builder: (context, state) =>
            _buildPassengerTrackingRoute(context, state, environment),
      ),
      GoRoute(
        path: AppRoutePath.passengerSettings,
        builder: (context, state) {
          final routeId = _nullableParam(state.uri.queryParameters['routeId']);
          final routeName =
              _nullableParam(state.uri.queryParameters['routeName']);
          return PassengerSettingsScreen(
            routeId: routeId ?? '',
            routeName: routeName,
            onSave: (input) => _handleUpdatePassengerSettings(context, input),
          );
        },
      ),
      GoRoute(
        path: AppRoutePath.join,
        builder: (context, state) {
          final selectedRole =
              joinRoleFromQuery(state.uri.queryParameters['role']);
          return JoinScreen(
            selectedRole: selectedRole,
            onJoinByCode: (input) {
              if (selectedRole == JoinRole.guest) {
                return _handleCreateGuestSession(context, input);
              }
              return _handleJoinBySrvCode(context, input);
            },
            onScanQrTap: () => context.go(AppRoutePath.passengerTracking),
            onContinueDriverTap: () => context.go(AppRoutePath.driverHome),
          );
        },
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

Future<void> _handleCreateRouteFromGhostDrive(
  BuildContext context,
  RouteCreateGhostFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('createRouteFromGhostDrive');
    final response = await callable.call(<String, dynamic>{
      'name': input.name,
      'tracePoints': input.tracePoints
          .map(
            (point) => <String, dynamic>{
              'lat': point.lat,
              'lng': point.lng,
              'accuracy': point.accuracy,
              'sampledAtMs': point.sampledAtMs,
            },
          )
          .toList(),
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
    _showInfo(context, 'Ghost rota olusturuldu. SRV: $srvCode');
    context.go(AppRoutePath.driverHome);
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Ghost rota olusturulamadi (${error.code}).');
  }
}

Future<void> _handleUpdateRoute(
  BuildContext context,
  RouteUpdateFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('updateRoute');
    final payload = <String, dynamic>{
      'routeId': input.routeId,
      if (input.name != null) 'name': input.name,
      if (input.startAddress != null) 'startAddress': input.startAddress,
      if (input.startPoint != null)
        'startPoint': <String, dynamic>{
          'lat': input.startPoint!.lat,
          'lng': input.startPoint!.lng,
        },
      if (input.endAddress != null) 'endAddress': input.endAddress,
      if (input.endPoint != null)
        'endPoint': <String, dynamic>{
          'lat': input.endPoint!.lat,
          'lng': input.endPoint!.lng,
        },
      if (input.scheduledTime != null) 'scheduledTime': input.scheduledTime,
      if (input.timeSlot != null) 'timeSlot': input.timeSlot,
      if (input.allowGuestTracking != null)
        'allowGuestTracking': input.allowGuestTracking,
      if (input.authorizedDriverIds != null)
        'authorizedDriverIds': input.authorizedDriverIds,
      if (input.isArchived != null) 'isArchived': input.isArchived,
      if (input.clearVacationUntil) 'vacationUntil': null,
      if (input.vacationUntil != null) 'vacationUntil': input.vacationUntil,
    };
    await callable.call(payload);
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Route guncellendi.');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Route guncellenemedi (${error.code}).');
  }
}

Future<void> _handleUpsertStop(
  BuildContext context,
  StopUpsertFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('upsertStop');
    final response = await callable.call(<String, dynamic>{
      'routeId': input.routeId,
      if (input.stopId != null && input.stopId!.isNotEmpty)
        'stopId': input.stopId,
      'name': input.name,
      'location': <String, dynamic>{
        'lat': input.lat,
        'lng': input.lng,
      },
      'order': input.order,
    });
    final payload = _extractCallableData(response.data);
    final stopId = payload['stopId'] as String? ?? '-';
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Durak kaydedildi. Stop ID: $stopId');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Durak kaydedilemedi (${error.code}).');
  }
}

Future<void> _handleDeleteStop(
  BuildContext context,
  StopDeleteFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('deleteStop');
    await callable.call(<String, dynamic>{
      'routeId': input.routeId,
      'stopId': input.stopId,
    });
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Durak silindi.');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Durak silinemedi (${error.code}).');
  }
}

Future<void> _handleStartTripWithUndo(BuildContext context) async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) {
    if (context.mounted) {
      _showInfo(context, 'Oturum bulunamadi. Lutfen tekrar giris yap.');
    }
    return;
  }

  final routeContext = await _resolvePrimaryDriverRouteContext(user.uid);
  if (!context.mounted) {
    return;
  }
  if (routeContext == null) {
    _showInfo(
        context, 'Baslatilabilir bir rota bulunamadi. Once rota olustur.');
    return;
  }

  final shouldCommit = await _showStartTripUndoWindow(
    context,
    routeName: routeContext.routeName,
  );
  if (!context.mounted) {
    return;
  }
  if (!shouldCommit) {
    _showInfo(context, 'Sefer baslatma iptal edildi.');
    return;
  }

  await _commitStartTrip(context, user, routeContext);
}

Future<void> _commitStartTrip(
  BuildContext context,
  User user,
  _DriverRouteContext routeContext,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('startTrip');
    final expectedTransitionVersion =
        await _readCurrentTripTransitionVersion(routeContext.routeId);
    final uidPrefix =
        user.uid.length <= 8 ? user.uid : user.uid.substring(0, 8);
    final deviceId = '${_devicePlatformKey()}_$uidPrefix';
    final response = await callable.call(<String, dynamic>{
      'routeId': routeContext.routeId,
      'deviceId': deviceId,
      'idempotencyKey': _buildTripActionIdempotencyKey(
        action: 'start_trip',
        subject: routeContext.routeId,
      ),
      'expectedTransitionVersion': expectedTransitionVersion,
    });
    final payload = _extractCallableData(response.data);
    final tripId = payload['tripId'] as String? ?? '';
    final status = payload['status'] as String? ?? '';
    final transitionVersion = (payload['transitionVersion'] as num?)?.toInt() ??
        expectedTransitionVersion;
    if (!context.mounted) {
      return;
    }
    if (tripId.isEmpty || status != 'active') {
      _showInfo(context, 'Sefer baslatma cevabi eksik geldi.');
      return;
    }

    final activeTripUri = Uri(
      path: AppRoutePath.activeTrip,
      queryParameters: <String, String>{
        'routeId': routeContext.routeId,
        'routeName': routeContext.routeName,
        'tripId': tripId,
        'transitionVersion': transitionVersion.toString(),
      },
    );
    _showInfo(context, 'Sefer baslatildi.');
    context.go(activeTripUri.toString());
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    final transitionMismatch =
        (error.message ?? '').contains('TRANSITION_VERSION_MISMATCH');
    final message = switch (error.code) {
      'permission-denied' => 'Bu route icin sefer baslatma yetkin yok.',
      'not-found' => 'Route bulunamadi.',
      'failed-precondition' => transitionMismatch
          ? 'Sefer durumu degisti. Lutfen tekrar dene.'
          : 'Sefer su an baslatilamiyor.',
      _ => 'Sefer baslatma basarisiz (${error.code}).',
    };
    _showInfo(context, message);
  }
}

Future<bool> _showStartTripUndoWindow(
  BuildContext context, {
  required String routeName,
}) async {
  final completer = Completer<bool>();
  final messenger = ScaffoldMessenger.of(context);
  messenger.clearSnackBars();
  final controller = messenger.showSnackBar(
    SnackBar(
      duration: const Duration(seconds: 10),
      content: Text(
        'Sefer 10 sn sonra baslayacak ($routeName). Iptal etmek icin simdi dokun.',
      ),
      action: SnackBarAction(
        label: 'Iptal',
        onPressed: () {
          if (!completer.isCompleted) {
            completer.complete(false);
          }
        },
      ),
    ),
  );

  controller.closed.then((reason) {
    if (completer.isCompleted) {
      return;
    }
    completer.complete(reason != SnackBarClosedReason.action);
  });
  return completer.future;
}

Future<bool> _showFinishTripUndoWindow(BuildContext context) async {
  final completer = Completer<bool>();
  final messenger = ScaffoldMessenger.of(context);
  messenger.clearSnackBars();
  final controller = messenger.showSnackBar(
    SnackBar(
      duration: const Duration(seconds: 3),
      content: const Text(
        'Sefer 3 sn icinde sonlandirilacak. Iptal etmek icin simdi dokun.',
      ),
      action: SnackBarAction(
        label: 'Iptal',
        onPressed: () {
          if (!completer.isCompleted) {
            completer.complete(false);
          }
        },
      ),
    ),
  );
  controller.closed.then((reason) {
    if (completer.isCompleted) {
      return;
    }
    completer.complete(reason != SnackBarClosedReason.action);
  });
  return completer.future;
}

Future<bool> _commitFinishTrip(
  BuildContext context,
  User user,
  _DriverActiveTripContext tripContext,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('finishTrip');
    final uidPrefix =
        user.uid.length <= 8 ? user.uid : user.uid.substring(0, 8);
    final deviceId = '${_devicePlatformKey()}_$uidPrefix';
    await callable.call(<String, dynamic>{
      'tripId': tripContext.tripId,
      'deviceId': deviceId,
      'idempotencyKey': _buildTripActionIdempotencyKey(
        action: 'finish_trip',
        subject: tripContext.tripId,
      ),
      'expectedTransitionVersion': tripContext.transitionVersion,
    });
    if (!context.mounted) {
      return false;
    }
    _showInfo(context, 'Sefer sonlandirildi.');
    return true;
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return false;
    }
    final transitionMismatch =
        (error.message ?? '').contains('TRANSITION_VERSION_MISMATCH');
    final message = switch (error.code) {
      'permission-denied' =>
        'Bu cihazdan sefer sonlandirma yetkin yok (baslatan cihaz gerekli).',
      'not-found' => 'Aktif trip bulunamadi.',
      'failed-precondition' => transitionMismatch
          ? 'Sefer durumu degisti. Lutfen tekrar dene.'
          : 'Sefer su an sonlandirilamiyor.',
      _ => 'Sefer sonlandirma basarisiz (${error.code}).',
    };
    _showInfo(context, message);
    return false;
  }
}

Future<_DriverActiveTripContext?> _resolveActiveTripContextForFinish(
  User user, {
  required String? tripId,
  required String? routeId,
  required int? initialTransitionVersion,
}) async {
  final tripsCollection = FirebaseFirestore.instance.collection('trips');
  if (tripId != null) {
    final tripSnapshot = await tripsCollection.doc(tripId).get();
    final tripData = tripSnapshot.data();
    if (tripData != null) {
      final status = (tripData['status'] as String?)?.trim();
      final driverId = (tripData['driverId'] as String?)?.trim();
      final resolvedRouteId =
          (tripData['routeId'] as String?)?.trim() ?? routeId ?? '';
      final transitionVersion =
          (tripData['transitionVersion'] as num?)?.toInt() ??
              initialTransitionVersion ??
              0;
      if (status == 'active' &&
          driverId == user.uid &&
          resolvedRouteId.isNotEmpty) {
        return _DriverActiveTripContext(
          routeId: resolvedRouteId,
          tripId: tripSnapshot.id,
          transitionVersion: transitionVersion,
        );
      }
    }
  }

  if (routeId == null || routeId.isEmpty) {
    return null;
  }

  final activeTripSnapshot = await tripsCollection
      .where('routeId', isEqualTo: routeId)
      .where('status', isEqualTo: 'active')
      .limit(1)
      .get();
  if (activeTripSnapshot.docs.isEmpty) {
    return null;
  }
  final activeTripDoc = activeTripSnapshot.docs.first;
  final tripData = activeTripDoc.data();
  final driverId = (tripData['driverId'] as String?)?.trim();
  if (driverId != user.uid) {
    return null;
  }
  final transitionVersion = (tripData['transitionVersion'] as num?)?.toInt() ??
      initialTransitionVersion ??
      0;
  return _DriverActiveTripContext(
    routeId: routeId,
    tripId: activeTripDoc.id,
    transitionVersion: transitionVersion,
  );
}

Future<void> _handleSendDriverAnnouncement(BuildContext context) async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) {
    if (context.mounted) {
      _showInfo(context, 'Oturum bulunamadi. Lutfen tekrar giris yap.');
    }
    return;
  }

  final routeContext = await _resolvePrimaryDriverRouteContext(user.uid);
  if (!context.mounted) {
    return;
  }
  if (routeContext == null) {
    _showInfo(context, 'Duyuru gondermek icin uygun rota bulunamadi.');
    return;
  }

  final announcementText = await _showDriverAnnouncementDialog(
    context,
    routeName: routeContext.routeName,
  );
  if (!context.mounted) {
    return;
  }
  if (announcementText == null || announcementText.trim().isEmpty) {
    return;
  }

  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('sendDriverAnnouncement');
    final response = await callable.call(<String, dynamic>{
      'routeId': routeContext.routeId,
      'templateKey': 'custom_text',
      'customText': announcementText.trim(),
      'idempotencyKey': _buildTripActionIdempotencyKey(
        action: 'announcement',
        subject: routeContext.routeId,
      ),
    });
    final payload = _extractCallableData(response.data);
    final shareUrl = (payload['shareUrl'] as String?)?.trim();
    if (!context.mounted) {
      return;
    }
    if (shareUrl != null && shareUrl.isNotEmpty) {
      await _shareAnnouncementLink(
        context,
        routeName: routeContext.routeName,
        shareUrl: shareUrl,
      );
      return;
    }
    _showInfo(context, 'Duyuru kuyruga alindi.');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    final message = switch (error.code) {
      'permission-denied' =>
        'Duyuru gonderimi premium yetki gerektiriyor veya route yetkin yok.',
      'not-found' => 'Route bulunamadi.',
      'failed-precondition' => 'Bu route icin duyuru su an gonderilemiyor.',
      _ => 'Duyuru gonderimi basarisiz (${error.code}).',
    };
    _showInfo(context, message);
  }
}

Future<String?> _showDriverAnnouncementDialog(
  BuildContext context, {
  required String routeName,
}) async {
  final textController = TextEditingController();
  String? inlineError;

  try {
    return await showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (dialogContext, setDialogState) {
            void submit() {
              final message = textController.text.trim();
              if (message.length < 3) {
                setDialogState(() {
                  inlineError = 'Duyuru metni en az 3 karakter olmali.';
                });
                return;
              }
              Navigator.of(dialogContext).pop(message);
            }

            return AlertDialog(
              title: const Text('Duyuru Gonder'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Rota: $routeName'),
                  const SizedBox(height: 12),
                  TextField(
                    controller: textController,
                    autofocus: true,
                    minLines: 2,
                    maxLines: 4,
                    maxLength: 240,
                    decoration: InputDecoration(
                      labelText: 'Duyuru metni',
                      errorText: inlineError,
                    ),
                    onChanged: (_) {
                      if (inlineError == null) {
                        return;
                      }
                      setDialogState(() {
                        inlineError = null;
                      });
                    },
                  ),
                ],
              ),
              actions: <Widget>[
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Iptal'),
                ),
                FilledButton(
                  onPressed: submit,
                  child: const Text('Gonder'),
                ),
              ],
            );
          },
        );
      },
    );
  } finally {
    textController.dispose();
  }
}

Future<void> _shareAnnouncementLink(
  BuildContext context, {
  required String routeName,
  required String shareUrl,
}) async {
  final shareText = 'Nerede Servis duyurusu ($routeName): $shareUrl';
  final whatsappUri = Uri(
    scheme: 'whatsapp',
    host: 'send',
    queryParameters: <String, String>{
      'text': shareText,
    },
  );
  final whatsappBusinessUri = Uri(
    scheme: 'whatsapp-business',
    host: 'send',
    queryParameters: <String, String>{
      'text': shareText,
    },
  );

  try {
    final openedWhatsapp = await launchUrl(
      whatsappUri,
      mode: LaunchMode.externalApplication,
    );
    if (openedWhatsapp) {
      if (context.mounted) {
        _showInfo(context, 'WhatsApp paylasim ekrani acildi.');
      }
      return;
    }

    final openedWhatsappBusiness = await launchUrl(
      whatsappBusinessUri,
      mode: LaunchMode.externalApplication,
    );
    if (openedWhatsappBusiness) {
      if (context.mounted) {
        _showInfo(context, 'WhatsApp Business paylasim ekrani acildi.');
      }
      return;
    }
  } catch (_) {
    // Fallback handled below via system share sheet.
  }

  try {
    await Share.share(
      shareText,
      subject: 'Nerede Servis Duyurusu',
    );
    if (context.mounted) {
      _showInfo(
          context, 'WhatsApp bulunamadi; sistem paylasim penceresi acildi.');
    }
  } catch (_) {
    if (context.mounted) {
      _showInfo(
          context, 'Paylasim baslatilamadi. Lutfen daha sonra tekrar dene.');
    }
  }
}

Future<void> _handleJoinBySrvCode(
  BuildContext context,
  JoinBySrvFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('joinRouteBySrvCode');
    final response = await callable.call(<String, dynamic>{
      'srvCode': input.srvCode,
      'name': input.name,
      if (input.phone != null && input.phone!.isNotEmpty) 'phone': input.phone,
      'showPhoneToDriver': input.showPhoneToDriver,
      'boardingArea': input.boardingArea,
      'notificationTime': input.notificationTime,
    });
    final payload = _extractCallableData(response.data);
    final routeId = payload['routeId'] as String? ?? '';
    final routeName = payload['routeName'] as String? ?? '';
    if (!context.mounted) {
      return;
    }
    if (routeId.isEmpty) {
      _showInfo(context, 'Katilim cevabi eksik geldi (routeId bos).');
      return;
    }

    if (input.virtualStop != null || input.virtualStopLabel != null) {
      try {
        final updateSettingsCallable =
            FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
                .httpsCallable('updatePassengerSettings');
        await updateSettingsCallable.call(<String, dynamic>{
          'routeId': routeId,
          'showPhoneToDriver': input.showPhoneToDriver,
          if (input.phone != null && input.phone!.isNotEmpty)
            'phone': input.phone,
          'boardingArea': input.boardingArea,
          'notificationTime': input.notificationTime,
          if (input.virtualStop != null)
            'virtualStop': <String, dynamic>{
              'lat': input.virtualStop!.lat,
              'lng': input.virtualStop!.lng,
            },
          if (input.virtualStopLabel != null &&
              input.virtualStopLabel!.trim().isNotEmpty)
            'virtualStopLabel': input.virtualStopLabel!.trim(),
        });
      } on FirebaseFunctionsException catch (error) {
        if (context.mounted) {
          _showInfo(
            context,
            'Servise katildin, fakat sanal durak kaydedilemedi (${error.code}).',
          );
        }
      }
    }

    final etaSourceLabel = _buildEtaSourceLabel(
      hasVirtualStop: input.virtualStop != null,
      virtualStopLabel: input.virtualStopLabel,
      boardingArea: input.boardingArea,
    );
    final trackingUri = Uri(
      path: AppRoutePath.passengerTracking,
      queryParameters: <String, String>{
        'routeId': routeId,
        if (routeName.trim().isNotEmpty) 'routeName': routeName.trim(),
        'etaSourceLabel': etaSourceLabel,
      },
    );
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Servise katilim basarili.');
    context.go(trackingUri.toString());
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    final message = switch (error.code) {
      'permission-denied' =>
        'Bu hesapla katilim izni yok. Yolcu rolu ile tekrar dene.',
      'not-found' => 'SRV kodu ile route bulunamadi.',
      'failed-precondition' => 'Bu route su an katilima kapali.',
      'resource-exhausted' => 'SRV deneme limiti doldu. Sonra tekrar dene.',
      _ => 'Servise katilim basarisiz (${error.code}).',
    };
    _showInfo(context, message);
  }
}

Future<void> _handleCreateGuestSession(
  BuildContext context,
  JoinBySrvFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('createGuestSession');
    final response = await callable.call(<String, dynamic>{
      'srvCode': input.srvCode,
    });
    final payload = _extractCallableData(response.data);
    final routeId = payload['routeId'] as String? ?? '';
    final sessionId = payload['sessionId'] as String? ?? '';
    final expiresAt = payload['expiresAt'] as String? ?? '';

    if (!context.mounted) {
      return;
    }
    if (routeId.isEmpty || sessionId.isEmpty || expiresAt.isEmpty) {
      _showInfo(context, 'Misafir oturumu acilamadi (yanit eksik).');
      return;
    }

    final trackingUri = Uri(
      path: AppRoutePath.passengerTracking,
      queryParameters: <String, String>{
        'routeId': routeId,
        'guestSessionId': sessionId,
        'guestExpiresAt': expiresAt,
      },
    );
    _showInfo(context, 'Misafir takip oturumu baslatildi.');
    context.go(trackingUri.toString());
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    final message = switch (error.code) {
      'permission-denied' => 'Bu route icin misafir takip kapali.',
      'not-found' => 'SRV kodu ile route bulunamadi.',
      _ => 'Misafir oturumu acilamadi (${error.code}).',
    };
    _showInfo(context, message);
  }
}

Future<void> _handleSubmitSkipToday(
  BuildContext context,
  String routeId,
) async {
  final approved = await showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: const Text('Bugun Binmiyorum'),
        content: const Text(
          'Bugun bu servis icin katilim durumun "Binmiyor" olarak isaretlenecek. Onayliyor musun?',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Iptal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Onayla'),
          ),
        ],
      );
    },
  );
  if (approved != true) {
    return;
  }

  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('submitSkipToday');
    final dateKey = _buildIstanbulDateKey(DateTime.now().toUtc());
    await callable.call(<String, dynamic>{
      'routeId': routeId,
      'dateKey': dateKey,
      'idempotencyKey': _buildSkipTodayIdempotencyKey(dateKey),
    });
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Bugun binmiyorum bildirimi kaydedildi.');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    final message = switch (error.code) {
      'failed-precondition' => 'Bugun binmiyorum islemi su an kabul edilmiyor.',
      'permission-denied' =>
        'Bu route icin yolcu kaydin olmadigindan skip islemi yapilamadi.',
      'not-found' => 'Route bulunamadi.',
      _ => 'Bugun binmiyorum islemi basarisiz (${error.code}).',
    };
    _showInfo(context, message);
  }
}

Future<void> _handleUpdatePassengerSettings(
  BuildContext context,
  PassengerSettingsFormInput input,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('updatePassengerSettings');
    await callable.call(<String, dynamic>{
      'routeId': input.routeId,
      'showPhoneToDriver': input.showPhoneToDriver,
      if (input.phone != null && input.phone!.isNotEmpty) 'phone': input.phone,
      'boardingArea': input.boardingArea,
      'notificationTime': input.notificationTime,
      if (input.virtualStop != null)
        'virtualStop': <String, dynamic>{
          'lat': input.virtualStop!.lat,
          'lng': input.virtualStop!.lng,
        },
      if (input.virtualStopLabel != null &&
          input.virtualStopLabel!.trim().isNotEmpty)
        'virtualStopLabel': input.virtualStopLabel!.trim(),
    });

    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Yolcu ayarlari kaydedildi.');

    final etaSourceLabel = _buildEtaSourceLabel(
      hasVirtualStop: input.virtualStop != null,
      virtualStopLabel: input.virtualStopLabel,
      boardingArea: input.boardingArea,
    );
    final trackingUri = Uri(
      path: AppRoutePath.passengerTracking,
      queryParameters: <String, String>{
        'routeId': input.routeId,
        if (input.routeName != null && input.routeName!.trim().isNotEmpty)
          'routeName': input.routeName!.trim(),
        'etaSourceLabel': etaSourceLabel,
      },
    );
    context.go(trackingUri.toString());
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Yolcu ayarlari kaydedilemedi (${error.code}).');
  }
}

Future<void> _handleLeaveRoute(
  BuildContext context,
  String routeId,
) async {
  final decision = await showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: const Text('Rotadan Ayril'),
        content: const Text(
          'Bu rotadan ayrilirsan tekrar SRV kodu ile katilman gerekir. Devam edilsin mi?',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Iptal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Ayril'),
          ),
        ],
      );
    },
  );
  if (decision != true) {
    return;
  }

  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('leaveRoute');
    final response = await callable.call(<String, dynamic>{
      'routeId': routeId,
    });
    final payload = _extractCallableData(response.data);
    final left = payload['left'] as bool? ?? false;
    if (!context.mounted) {
      return;
    }
    _showInfo(
      context,
      left ? 'Rotadan ayrildin.' : 'Bu rota icin aktif katilim kaydi yoktu.',
    );
    context.go('${AppRoutePath.join}?role=passenger');
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(context, 'Rotadan ayrilma basarisiz (${error.code}).');
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

Widget _buildPassengerTrackingRoute(
  BuildContext context,
  GoRouterState state,
  AppEnvironment environment,
) {
  final routeId = _nullableParam(state.uri.queryParameters['routeId']);
  final routeName = _nullableParam(state.uri.queryParameters['routeName']);
  final etaSourceFromQuery =
      _nullableParam(state.uri.queryParameters['etaSourceLabel']);
  final guestSessionId =
      _nullableParam(state.uri.queryParameters['guestSessionId']);
  final guestExpiresAt =
      _nullableParam(state.uri.queryParameters['guestExpiresAt']);
  final user = FirebaseAuth.instance.currentUser;

  PassengerTrackingScreen buildTrackingScreen({
    required String resolvedRouteName,
    required String etaSourceLabel,
    LocationFreshness freshness = LocationFreshness.live,
    String? lastSeenAgo,
    VoidCallback? onSettingsTap,
    VoidCallback? onSkipTodayTap,
    VoidCallback? onLeaveRouteTap,
  }) {
    return PassengerTrackingScreen(
      mapboxPublicToken: environment.mapboxPublicToken,
      routeName: resolvedRouteName,
      etaSourceLabel: etaSourceLabel,
      freshness: freshness,
      lastSeenAgo: lastSeenAgo,
      onSettingsTap: onSettingsTap,
      onSkipTodayTap: onSkipTodayTap,
      onLeaveRouteTap: onLeaveRouteTap,
    );
  }

  if (guestSessionId != null) {
    return _GuestSessionExpiryGuard(
      sessionId: guestSessionId,
      initialRouteId: routeId,
      initialRouteName: routeName,
      initialExpiresAt: guestExpiresAt,
      mapboxPublicToken: environment.mapboxPublicToken,
      initialEtaSourceLabel: etaSourceFromQuery ?? 'Rota baslangici tahmini',
    );
  }

  VoidCallback? onLeaveRouteTap;
  VoidCallback? onSettingsTap;
  VoidCallback? onSkipTodayTap;
  if (routeId != null) {
    onLeaveRouteTap = () => _handleLeaveRoute(context, routeId);
    onSkipTodayTap = () => _handleSubmitSkipToday(context, routeId);
    onSettingsTap = () {
      final settingsUri = Uri(
        path: AppRoutePath.passengerSettings,
        queryParameters: <String, String>{
          'routeId': routeId,
          if (routeName != null) 'routeName': routeName,
        },
      );
      context.go(settingsUri.toString());
    };
  }

  final defaultRouteName = routeName ?? 'Darica -> GOSB';

  if (etaSourceFromQuery != null) {
    return buildTrackingScreen(
      resolvedRouteName: defaultRouteName,
      etaSourceLabel: etaSourceFromQuery,
      onSettingsTap: onSettingsTap,
      onSkipTodayTap: onSkipTodayTap,
      onLeaveRouteTap: onLeaveRouteTap,
    );
  }
  if (routeId == null || user == null) {
    return buildTrackingScreen(
      resolvedRouteName: defaultRouteName,
      etaSourceLabel: 'Rota baslangici tahmini',
      onSettingsTap: onSettingsTap,
      onSkipTodayTap: onSkipTodayTap,
      onLeaveRouteTap: onLeaveRouteTap,
    );
  }

  return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
    stream: FirebaseFirestore.instance
        .collection('routes')
        .doc(routeId)
        .collection('passengers')
        .doc(user.uid)
        .snapshots(),
    builder: (context, snapshot) {
      final passengerData = snapshot.data?.data();
      final etaSourceLabel = _resolveEtaSourceLabelFromPassengerData(
        passengerData,
      );
      return _PassengerLocationStreamBuilder(
        routeId: routeId,
        builder: (location) => buildTrackingScreen(
          resolvedRouteName: defaultRouteName,
          etaSourceLabel: etaSourceLabel,
          freshness: location.freshness,
          lastSeenAgo: location.lastSeenAgo,
          onSettingsTap: onSettingsTap,
          onSkipTodayTap: onSkipTodayTap,
          onLeaveRouteTap: onLeaveRouteTap,
        ),
      );
    },
  );
}

String _resolveEtaSourceLabelFromPassengerData(Map<String, dynamic>? data) {
  if (data != null) {
    final virtualStopRaw = data['virtualStop'];
    if (virtualStopRaw is Map) {
      final virtualStop = Map<String, dynamic>.from(virtualStopRaw);
      final lat = (virtualStop['lat'] as num?)?.toDouble();
      final lng = (virtualStop['lng'] as num?)?.toDouble();
      if (lat != null && lng != null) {
        final label = (data['virtualStopLabel'] as String?)?.trim();
        return _buildEtaSourceLabel(
          hasVirtualStop: true,
          virtualStopLabel: label,
          boardingArea: null,
        );
      }
    }
    final boardingArea = (data['boardingArea'] as String?)?.trim();
    return _buildEtaSourceLabel(
      hasVirtualStop: false,
      virtualStopLabel: null,
      boardingArea: boardingArea,
    );
  }
  return _buildEtaSourceLabel(
    hasVirtualStop: false,
    virtualStopLabel: null,
    boardingArea: null,
  );
}

String _buildEtaSourceLabel({
  required bool hasVirtualStop,
  required String? virtualStopLabel,
  required String? boardingArea,
}) {
  if (hasVirtualStop) {
    final label = _nullableParam(virtualStopLabel);
    if (label != null) {
      return 'Sanal Durak: $label';
    }
    return 'Sanal Durak tahmini';
  }
  final normalizedBoardingArea = _nullableParam(boardingArea);
  if (normalizedBoardingArea != null) {
    return 'Binis Alani: $normalizedBoardingArea';
  }
  return 'Rota baslangici tahmini';
}

String? _nullableParam(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}

String _buildIstanbulDateKey(DateTime utcDateTime) {
  final istanbulNow = utcDateTime.add(const Duration(hours: 3));
  final year = istanbulNow.year.toString().padLeft(4, '0');
  final month = istanbulNow.month.toString().padLeft(2, '0');
  final day = istanbulNow.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

String _buildSkipTodayIdempotencyKey(String dateKey) {
  final compactDateKey = dateKey.replaceAll('-', '');
  final nowMs = DateTime.now().toUtc().millisecondsSinceEpoch;
  return 'skip_${compactDateKey}_$nowMs';
}

final Random _idempotencyRandom = Random.secure();

Future<_DriverRouteContext?> _resolvePrimaryDriverRouteContext(
    String uid) async {
  final routesCollection = FirebaseFirestore.instance.collection('routes');
  final ownedFuture =
      routesCollection.where('driverId', isEqualTo: uid).limit(20).get();
  final sharedFuture = routesCollection
      .where('authorizedDriverIds', arrayContains: uid)
      .limit(20)
      .get();
  final snapshots =
      await Future.wait(<Future<QuerySnapshot<Map<String, dynamic>>>>[
    ownedFuture,
    sharedFuture,
  ]);

  final merged = <_DriverRouteContext>[];
  final seenRouteIds = <String>{};
  for (final snapshot in snapshots) {
    for (final doc in snapshot.docs) {
      if (!seenRouteIds.add(doc.id)) {
        continue;
      }
      final data = doc.data();
      if (data['isArchived'] == true) {
        continue;
      }
      final routeNameRaw = (data['name'] as String?)?.trim();
      final routeName = (routeNameRaw == null || routeNameRaw.isEmpty)
          ? 'Sofor Rotasi'
          : routeNameRaw;
      final updatedAtRaw = (data['updatedAt'] as String?)?.trim();
      final updatedAtUtc = DateTime.tryParse(updatedAtRaw ?? '')?.toUtc() ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
      final ownerUid = (data['driverId'] as String?)?.trim();
      merged.add(
        _DriverRouteContext(
          routeId: doc.id,
          routeName: routeName,
          updatedAtUtc: updatedAtUtc,
          isOwnedByCurrentDriver: ownerUid == uid,
        ),
      );
    }
  }

  if (merged.isEmpty) {
    return null;
  }
  merged.sort((left, right) {
    if (left.isOwnedByCurrentDriver != right.isOwnedByCurrentDriver) {
      return left.isOwnedByCurrentDriver ? -1 : 1;
    }
    return right.updatedAtUtc.compareTo(left.updatedAtUtc);
  });
  return merged.first;
}

Future<int> _readCurrentTripTransitionVersion(String routeId) async {
  final snapshot = await FirebaseFirestore.instance
      .collection('trips')
      .where('routeId', isEqualTo: routeId)
      .where('status', isEqualTo: 'active')
      .limit(1)
      .get();
  final data = snapshot.docs.isEmpty ? null : snapshot.docs.first.data();
  final rawVersion = data?['transitionVersion'];
  if (rawVersion is num) {
    return rawVersion.toInt();
  }
  return 0;
}

String _buildTripActionIdempotencyKey({
  required String action,
  required String subject,
  DateTime? nowUtc,
}) {
  final sanitizedAction = _sanitizeIdempotencyPart(action);
  final sanitizedSubject = _sanitizeIdempotencyPart(subject);
  final timestampPart = (nowUtc ?? DateTime.now().toUtc())
      .millisecondsSinceEpoch
      .toRadixString(36);
  final randomPart = _randomIdempotencyToken(10);
  return '$sanitizedAction-$sanitizedSubject-$timestampPart-$randomPart';
}

String _sanitizeIdempotencyPart(String raw, {int maxLength = 24}) {
  final normalized = raw
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
      .replaceAll(RegExp(r'_+'), '_')
      .replaceAll(RegExp(r'^_|_$'), '');
  if (normalized.isEmpty) {
    return 'item';
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return normalized.substring(0, maxLength);
}

String _randomIdempotencyToken(int length) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  final buffer = StringBuffer();
  for (var index = 0; index < length; index++) {
    final alphabetIndex = _idempotencyRandom.nextInt(alphabet.length);
    buffer.write(alphabet[alphabetIndex]);
  }
  return buffer.toString();
}

class _DriverFinishTripGuard extends StatefulWidget {
  const _DriverFinishTripGuard({
    required this.routeName,
    this.routeId,
    this.tripId,
    this.initialTransitionVersion,
  });

  final String routeName;
  final String? routeId;
  final String? tripId;
  final int? initialTransitionVersion;

  @override
  State<_DriverFinishTripGuard> createState() => _DriverFinishTripGuardState();
}

class _DriverFinishTripGuardState extends State<_DriverFinishTripGuard> {
  bool _finishing = false;
  int _screenResetSeed = 0;

  Future<void> _handleTripFinishConfirmed() async {
    if (_finishing) {
      return;
    }
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      _showInfo(context, 'Oturum bulunamadi. Lutfen tekrar giris yap.');
      return;
    }

    setState(() {
      _finishing = true;
    });

    final shouldCommit = await _showFinishTripUndoWindow(context);
    if (!mounted) {
      return;
    }
    if (!shouldCommit) {
      setState(() {
        _finishing = false;
        _screenResetSeed++;
      });
      _showInfo(context, 'Sefer bitirme iptal edildi.');
      return;
    }

    final activeTripContext = await _resolveActiveTripContextForFinish(
      user,
      tripId: widget.tripId,
      routeId: widget.routeId,
      initialTransitionVersion: widget.initialTransitionVersion,
    );
    if (!mounted) {
      return;
    }
    if (activeTripContext == null) {
      setState(() {
        _finishing = false;
        _screenResetSeed++;
      });
      _showInfo(context, 'Aktif sefer baglami bulunamadi.');
      return;
    }

    final completed = await _commitFinishTrip(context, user, activeTripContext);
    if (!mounted) {
      return;
    }
    if (completed) {
      context.go(AppRoutePath.driverHome);
      return;
    }

    setState(() {
      _finishing = false;
      _screenResetSeed++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ActiveTripScreen(
      key: ValueKey<String>(
        'active_trip_${widget.routeId ?? 'none'}_${widget.tripId ?? 'none'}_$_screenResetSeed',
      ),
      routeName: widget.routeName,
      onTripFinished: _finishing ? null : _handleTripFinishConfirmed,
    );
  }
}

class _GuestSessionExpiryGuard extends StatefulWidget {
  const _GuestSessionExpiryGuard({
    required this.sessionId,
    required this.mapboxPublicToken,
    required this.initialEtaSourceLabel,
    this.initialRouteId,
    this.initialRouteName,
    this.initialExpiresAt,
  });

  final String sessionId;
  final String? initialRouteId;
  final String? initialRouteName;
  final String? initialExpiresAt;
  final String? mapboxPublicToken;
  final String initialEtaSourceLabel;

  @override
  State<_GuestSessionExpiryGuard> createState() =>
      _GuestSessionExpiryGuardState();
}

class _GuestSessionExpiryGuardState extends State<_GuestSessionExpiryGuard> {
  bool _redirected = false;

  void _redirectToGuestJoin(String message) {
    if (_redirected || !mounted) {
      return;
    }
    _redirected = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _showInfo(context, message);
      context.go('${AppRoutePath.join}?role=guest');
    });
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('guest_sessions')
          .doc(widget.sessionId)
          .snapshots(),
      builder: (context, snapshot) {
        final data = snapshot.data?.data();
        final status = _nullableParam(data?['status'] as String?);
        final routeId = _nullableParam(data?['routeId'] as String?) ??
            _nullableParam(widget.initialRouteId);
        final routeName = _nullableParam(data?['routeName'] as String?) ??
            _nullableParam(widget.initialRouteName) ??
            'Misafir Takip';
        final expiresAtRaw = _nullableParam(data?['expiresAt'] as String?) ??
            _nullableParam(widget.initialExpiresAt);
        final expiresAt = expiresAtRaw == null
            ? null
            : DateTime.tryParse(expiresAtRaw)?.toUtc();
        final nowUtc = DateTime.now().toUtc();

        final sessionMissing =
            snapshot.connectionState == ConnectionState.done &&
                !snapshot.hasData &&
                data == null;
        final sessionRevoked = status != null && status != 'active';
        final sessionExpired = expiresAt == null || !expiresAt.isAfter(nowUtc);

        if (snapshot.hasError ||
            sessionMissing ||
            sessionRevoked ||
            sessionExpired) {
          _redirectToGuestJoin(
            'Misafir takip oturumu suresi doldu. Lutfen yeniden katil.',
          );
        }

        if (routeId == null) {
          return PassengerTrackingScreen(
            mapboxPublicToken: widget.mapboxPublicToken,
            routeName: routeName,
            etaSourceLabel: widget.initialEtaSourceLabel,
          );
        }

        return _PassengerLocationStreamBuilder(
          routeId: routeId,
          builder: (location) => PassengerTrackingScreen(
            mapboxPublicToken: widget.mapboxPublicToken,
            routeName: routeName,
            etaSourceLabel: widget.initialEtaSourceLabel,
            freshness: location.freshness,
            lastSeenAgo: location.lastSeenAgo,
          ),
        );
      },
    );
  }
}

class _PassengerLocationSnapshot {
  const _PassengerLocationSnapshot({
    required this.freshness,
    required this.lastSeenAgo,
    this.rawLat,
    this.rawLng,
    this.filteredLat,
    this.filteredLng,
    this.sampledAtMs,
  });

  final LocationFreshness freshness;
  final String? lastSeenAgo;
  final double? rawLat;
  final double? rawLng;
  final double? filteredLat;
  final double? filteredLng;
  final int? sampledAtMs;
}

class _PassengerLocationStreamBuilder extends StatefulWidget {
  const _PassengerLocationStreamBuilder({
    required this.routeId,
    required this.builder,
  });

  final String routeId;
  final Widget Function(_PassengerLocationSnapshot snapshot) builder;

  @override
  State<_PassengerLocationStreamBuilder> createState() =>
      _PassengerLocationStreamBuilderState();
}

class _PassengerLocationStreamBuilderState
    extends State<_PassengerLocationStreamBuilder> {
  final KalmanLocationSmoother _smoother = KalmanLocationSmoother(
    config: const KalmanSmootherConfig(
      processNoise: 0.01,
      measurementNoise: 3.0,
      updateIntervalMs: 1000,
    ),
  );

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DatabaseEvent>(
      stream:
          FirebaseDatabase.instance.ref('locations/${widget.routeId}').onValue,
      builder: (context, snapshot) {
        final rawMap = _mapFromRtdbValue(snapshot.data?.snapshot.value);
        final timestampMs = parseLiveLocationTimestampMs(rawMap?['timestamp']);
        final rawLat = _parseFiniteDouble(rawMap?['lat']);
        final rawLng = _parseFiniteDouble(rawMap?['lng']);
        final nowUtc = DateTime.now().toUtc();
        final freshness = _toPassengerLocationFreshness(
          resolveLiveSignalFreshness(
            nowUtc: nowUtc,
            timestampMs: timestampMs,
            treatMissingAsLive: true,
          ),
        );
        final lastSeenAgo = formatLastSeenAgo(
          nowUtc: nowUtc,
          timestampMs: timestampMs,
        );

        // 321B: raw GPS ve filtrelenmis marker konumunu ayri tut.
        SmoothedLocationPoint? smoothedPoint;
        if (timestampMs != null && rawLat != null && rawLng != null) {
          smoothedPoint = _smoother.update(
            lat: rawLat,
            lng: rawLng,
            sampledAtMs: timestampMs,
          );
        }

        return widget.builder(
          _PassengerLocationSnapshot(
            freshness: freshness,
            lastSeenAgo: lastSeenAgo,
            rawLat: rawLat,
            rawLng: rawLng,
            filteredLat: smoothedPoint?.filteredLat,
            filteredLng: smoothedPoint?.filteredLng,
            sampledAtMs: timestampMs,
          ),
        );
      },
    );
  }
}

LocationFreshness _toPassengerLocationFreshness(
  LiveSignalFreshness freshness,
) {
  return switch (freshness) {
    LiveSignalFreshness.live => LocationFreshness.live,
    LiveSignalFreshness.mild => LocationFreshness.mild,
    LiveSignalFreshness.stale => LocationFreshness.stale,
    LiveSignalFreshness.lost => LocationFreshness.lost,
  };
}

Map<String, dynamic>? _mapFromRtdbValue(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is! Map<Object?, Object?>) {
    return null;
  }

  final output = <String, dynamic>{};
  for (final entry in value.entries) {
    output[entry.key.toString()] = entry.value;
  }
  return output;
}

double? _parseFiniteDouble(Object? value) {
  if (value is num) {
    final number = value.toDouble();
    return number.isFinite ? number : null;
  }
  if (value is String) {
    final parsed = double.tryParse(value.trim());
    if (parsed == null || !parsed.isFinite) {
      return null;
    }
    return parsed;
  }
  return null;
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

class _DriverRouteContext {
  const _DriverRouteContext({
    required this.routeId,
    required this.routeName,
    required this.updatedAtUtc,
    required this.isOwnedByCurrentDriver,
  });

  final String routeId;
  final String routeName;
  final DateTime updatedAtUtc;
  final bool isOwnedByCurrentDriver;
}

class _DriverActiveTripContext {
  const _DriverActiveTripContext({
    required this.routeId,
    required this.tripId,
    required this.transitionVersion,
  });

  final String routeId;
  final String tripId;
  final int transitionVersion;
}

class _EmailAuthInput {
  const _EmailAuthInput({
    required this.email,
    required this.password,
  });

  final String email;
  final String password;
}
