import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_flavor.dart';
import '../features/auth/domain/user_role.dart';
import 'providers/theme_provider.dart';
import 'router/app_router.dart';
import 'router/auth_guard.dart';
import 'router/role_guard.dart';

class NeredeServisApp extends ConsumerWidget {
  const NeredeServisApp({
    super.key,
    required this.flavorConfig,
  });

  final AppFlavorConfig flavorConfig;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = buildAppRouter(
      flavorConfig: flavorConfig,
      authGuard: const AuthGuard(isSignedIn: false),
      roleGuard: const RoleGuard(currentRole: UserRole.unknown),
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
