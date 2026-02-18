import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import '../features/auth/domain/user_role.dart';
import 'providers/auth_feature_providers.dart';
import 'providers/auth_state_provider.dart';
import 'providers/theme_provider.dart';
import 'router/app_router.dart';
import 'router/auth_guard.dart';
import 'router/consent_guard.dart';
import 'router/role_guard.dart';

class NeredeServisApp extends ConsumerWidget {
  const NeredeServisApp({
    super.key,
    required this.flavorConfig,
    required this.environment,
  });

  final AppFlavorConfig flavorConfig;
  final AppEnvironment environment;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSignedIn = ref.watch(isSignedInProvider);
    final currentRole = Firebase.apps.isEmpty
        ? UserRole.unknown
        : (ref.watch(currentUserRoleProvider).valueOrNull ?? UserRole.unknown);
    final hasLocationConsent = Firebase.apps.isEmpty
        ? true
        : (ref.watch(currentUserConsentGrantedProvider).valueOrNull ?? false);
    final router = buildAppRouter(
      flavorConfig: flavorConfig,
      environment: environment,
      authGuard: AuthGuard(isSignedIn: isSignedIn),
      roleGuard: RoleGuard(currentRole: currentRole),
      consentGuard: ConsentGuard(
        currentRole: currentRole,
        hasLocationConsent: hasLocationConsent,
      ),
    );
    final theme = ref.watch(amberLightThemeProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: flavorConfig.appName,
      theme: theme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
