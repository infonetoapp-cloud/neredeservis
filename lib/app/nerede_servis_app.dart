import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import '../features/auth/domain/user_role.dart';
import 'providers/auth_feature_providers.dart';
import 'providers/auth_state_provider.dart';
import 'providers/theme_provider.dart';
import 'router/app_router.dart';
import 'router/force_update_version_gate.dart';

class NeredeServisApp extends ConsumerStatefulWidget {
  const NeredeServisApp({
    super.key,
    required this.flavorConfig,
    required this.environment,
  });

  final AppFlavorConfig flavorConfig;
  final AppEnvironment environment;

  @override
  ConsumerState<NeredeServisApp> createState() => _NeredeServisAppState();
}

class _NeredeServisAppState extends ConsumerState<NeredeServisApp> {
  late final _RouterGuardRefreshState _routerGuardRefreshState;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _routerGuardRefreshState = _RouterGuardRefreshState(
      isSignedIn: false,
      currentRole: UserRole.unknown,
      hasLocationConsent: true,
      isForceUpdateRequired: false,
    );
    unawaited(_hydrateForceUpdateRequirement());
    initializeAppRouterRuntime(environment: widget.environment);
    _router = buildAppRouter(
      flavorConfig: widget.flavorConfig,
      environment: widget.environment,
      readIsSignedIn: () => _routerGuardRefreshState.isSignedIn,
      readCurrentRole: () => _routerGuardRefreshState.currentRole,
      readHasLocationConsent: () => _routerGuardRefreshState.hasLocationConsent,
      readIsForceUpdateRequired: () =>
          _routerGuardRefreshState.isForceUpdateRequired,
      refreshListenable: _routerGuardRefreshState,
    );
  }

  Future<void> _hydrateForceUpdateRequirement() async {
    final minVersion = minRequiredAppVersion.trim();
    if (minVersion.isEmpty) {
      return;
    }
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final required = shouldForceUpdateVersion(
        currentVersion: packageInfo.version,
        minVersion: minVersion,
      );
      _routerGuardRefreshState.update(
        isSignedIn: _routerGuardRefreshState.isSignedIn,
        currentRole: _routerGuardRefreshState.currentRole,
        hasLocationConsent: _routerGuardRefreshState.hasLocationConsent,
        isForceUpdateRequired: required,
      );
    } catch (_) {
      // Keep gate disabled if platform package info cannot be resolved.
    }
  }

  @override
  void dispose() {
    _router.dispose();
    _routerGuardRefreshState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSignedIn = ref.watch(isSignedInProvider);
    final currentRole = Firebase.apps.isEmpty
        ? UserRole.unknown
        : (ref.watch(currentUserRoleProvider).valueOrNull ?? UserRole.unknown);
    final hasLocationConsent = Firebase.apps.isEmpty
        ? true
        : (ref.watch(currentUserConsentGrantedProvider).valueOrNull ?? false);
    _routerGuardRefreshState.update(
      isSignedIn: isSignedIn,
      currentRole: currentRole,
      hasLocationConsent: hasLocationConsent,
      isForceUpdateRequired: _routerGuardRefreshState.isForceUpdateRequired,
    );
    final theme = ref.watch(coreLightThemeProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: widget.flavorConfig.appName,
      theme: theme,
      themeMode: themeMode,
      routerConfig: _router,
    );
  }
}

class _RouterGuardRefreshState extends ChangeNotifier {
  _RouterGuardRefreshState({
    required this.isSignedIn,
    required this.currentRole,
    required this.hasLocationConsent,
    required this.isForceUpdateRequired,
  });

  bool isSignedIn;
  UserRole currentRole;
  bool hasLocationConsent;
  bool isForceUpdateRequired;

  bool _refreshQueued = false;
  bool _disposed = false;

  void update({
    required bool isSignedIn,
    required UserRole currentRole,
    required bool hasLocationConsent,
    required bool isForceUpdateRequired,
  }) {
    if (this.isSignedIn == isSignedIn &&
        this.currentRole == currentRole &&
        this.hasLocationConsent == hasLocationConsent &&
        this.isForceUpdateRequired == isForceUpdateRequired) {
      return;
    }

    this.isSignedIn = isSignedIn;
    this.currentRole = currentRole;
    this.hasLocationConsent = hasLocationConsent;
    this.isForceUpdateRequired = isForceUpdateRequired;

    if (_refreshQueued) {
      return;
    }
    _refreshQueued = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshQueued = false;
      if (_disposed) {
        return;
      }
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}
