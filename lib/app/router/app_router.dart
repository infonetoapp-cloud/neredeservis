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
          onStartTripTap: () => context.go(AppRoutePath.activeTrip),
          onManageRouteTap: () => context.go(AppRoutePath.driverRoutesManage),
          onAnnouncementTap: () => context.go(AppRoutePath.settings),
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
        builder: (context, state) => const ActiveTripScreen(),
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
    VoidCallback? onSettingsTap,
    VoidCallback? onSkipTodayTap,
    VoidCallback? onLeaveRouteTap,
  }) {
    return PassengerTrackingScreen(
      mapboxPublicToken: environment.mapboxPublicToken,
      routeName: resolvedRouteName,
      etaSourceLabel: etaSourceLabel,
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
      return buildTrackingScreen(
        resolvedRouteName: defaultRouteName,
        etaSourceLabel: etaSourceLabel,
        onSettingsTap: onSettingsTap,
        onSkipTodayTap: onSkipTodayTap,
        onLeaveRouteTap: onLeaveRouteTap,
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

        return PassengerTrackingScreen(
          mapboxPublicToken: widget.mapboxPublicToken,
          routeName: widget.initialRouteName ?? 'Misafir Takip',
          etaSourceLabel: widget.initialEtaSourceLabel,
        );
      },
    );
  }
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
