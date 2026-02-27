part of '../app_router.dart';

List<RouteBase> _buildSharedRoutes(_AppRouterRouteDeps deps) {
  return <RouteBase>[
    GoRoute(
      path: AppRoutePath.settings,
      builder: (context, state) {
        final currentRole = _resolveRoutingRoleWithSessionPreference(
          backendRole: deps.readCurrentRole(),
        );
        if (currentRole == UserRole.driver) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!context.mounted) {
              return;
            }
            context.go(AppRoutePath.driverSettings);
          });
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator.adaptive(),
            ),
          );
        }
        return _buildAppSettingsRouteView(
          context,
          deps,
          roleOverride: currentRole,
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.profileEdit,
      builder: (context, state) {
        final user = _authCredentialGateway.currentUser;
        return FutureBuilder<_ProfileEditBootstrapData>(
          future: _loadProfileEditBootstrapData(user),
          builder: (context, snapshot) {
            final bootstrap = snapshot.data ??
                _ProfileEditBootstrapData(
                  displayName: _resolveDisplayName(user),
                  phone: user?.phoneNumber,
                );
            return ProfileEditScreen(
              initialDisplayName: bootstrap.displayName,
              initialPhone: bootstrap.phone,
              initialProfilePhotoUrl: bootstrap.photoUrl,
              initialProfilePhotoPath: bootstrap.photoPath,
              onPickPhoto: (currentPhotoPath) => _handleProfilePhotoPick(
                context,
                role: bootstrap.role,
                currentPhotoPath: currentPhotoPath,
              ),
              onSave: (displayName, phone, {photoUrl, photoPath}) =>
                  _handleProfileUpdate(
                context,
                displayName: displayName,
                phone: phone,
                photoUrl: photoUrl,
                photoPath: photoPath,
              ),
            );
          },
        );
      },
    ),
  ];
}

Widget _buildAppSettingsRouteView(
  BuildContext context,
  _AppRouterRouteDeps deps, {
  UserRole? roleOverride,
}) {
  final currentRole = roleOverride ??
      _resolveRoutingRoleWithSessionPreference(
        backendRole: deps.readCurrentRole(),
      );
  final settingsFallbackPath = currentRole == UserRole.driver
      ? AppRoutePath.driverHome
      : _resolveRoleCorridorFallbackLocation(currentRole);
  return PopScope(
    canPop: Navigator.of(context).canPop(),
    onPopInvokedWithResult: (didPop, _) {
      if (didPop) {
        return;
      }
      _popRouteOrGo(
        context,
        fallbackPath: settingsFallbackPath,
      );
    },
    child: FutureBuilder<_SettingsBootstrapData>(
      future: _loadSettingsBootstrapData(),
      builder: (context, snapshot) {
        final bootstrap = snapshot.data ?? const _SettingsBootstrapData();
        return SettingsScreen(
          appName: deps.flavorConfig.appName,
          showSubscriptionSection: bootstrap.isDriver,
          subscriptionStatus: bootstrap.subscriptionStatus,
          trialDaysLeft: bootstrap.trialDaysLeft,
          initialConsentEnabled: deps.readHasLocationConsent(),
          initialVoiceAlertEnabled: bootstrap.initialVoiceAlertEnabled,
          showDriverPhoneVisibilitySection: bootstrap.isDriver,
          initialShowPhoneToPassengers: bootstrap.initialShowPhoneToPassengers,
          onSubscriptionTap: () => context.push(
            _buildPaywallRouteWithSource('settings'),
          ),
          onConsentTap: (value) => _handleConsentUpdate(context, value),
          onVoiceAlertTap: (value) =>
              _handleVoiceAlertSettingUpdate(context, value),
          onDriverPhoneVisibilityTap: (value) =>
              _handleDriverPhoneVisibilityToggle(context, value),
          onSupportTap: () => _handleOpenSupportCenter(context),
          onReportIssueTap: () => _handleSubmitSupportReport(
            context,
            source: SupportReportSource.settings,
          ),
          onDeleteAccountTap: () =>
              _handleDeleteAccount(context, environment: deps.environment),
        );
      },
    ),
  );
}
