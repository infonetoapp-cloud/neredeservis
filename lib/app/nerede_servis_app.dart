import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import '../features/auth/domain/user_role.dart';
import 'providers/auth_feature_providers.dart';
import 'providers/auth_state_provider.dart';
import 'providers/theme_provider.dart';
import 'router/app_router.dart';

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
    );
    initializeAppRouterRuntime(environment: widget.environment);
    _router = buildAppRouter(
      flavorConfig: widget.flavorConfig,
      environment: widget.environment,
      readIsSignedIn: () => _routerGuardRefreshState.isSignedIn,
      readCurrentRole: () => _routerGuardRefreshState.currentRole,
      readHasLocationConsent: () => _routerGuardRefreshState.hasLocationConsent,
      refreshListenable: _routerGuardRefreshState,
    );
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
  });

  bool isSignedIn;
  UserRole currentRole;
  bool hasLocationConsent;

  bool _refreshQueued = false;
  bool _disposed = false;

  void update({
    required bool isSignedIn,
    required UserRole currentRole,
    required bool hasLocationConsent,
  }) {
    if (this.isSignedIn == isSignedIn &&
        this.currentRole == currentRole &&
        this.hasLocationConsent == hasLocationConsent) {
      return;
    }

    this.isSignedIn = isSignedIn;
    this.currentRole = currentRole;
    this.hasLocationConsent = hasLocationConsent;

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
