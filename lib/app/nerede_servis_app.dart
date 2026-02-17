import 'package:flutter/material.dart';

import '../config/app_flavor.dart';
import '../features/auth/domain/user_role.dart';
import 'router/app_router.dart';
import 'router/auth_guard.dart';
import 'router/role_guard.dart';

class NeredeServisApp extends StatelessWidget {
  const NeredeServisApp({
    super.key,
    required this.flavorConfig,
  });

  final AppFlavorConfig flavorConfig;

  @override
  Widget build(BuildContext context) {
    final router = buildAppRouter(
      flavorConfig: flavorConfig,
      authGuard: const AuthGuard(isSignedIn: false),
      roleGuard: const RoleGuard(currentRole: UserRole.unknown),
    );

    final theme = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFFB86A00),
        brightness: Brightness.light,
      ),
    );

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: flavorConfig.appName,
      theme: theme,
      routerConfig: router,
    );
  }
}
