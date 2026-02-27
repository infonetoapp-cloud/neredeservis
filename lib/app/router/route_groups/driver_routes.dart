part of '../app_router.dart';

List<RouteBase> _buildDriverRoutes(_AppRouterRouteDeps deps) {
  return <RouteBase>[
    ShellRoute(
      builder: (context, state, child) => DriverShell(child: child),
      routes: <RouteBase>[
        GoRoute(
          path: AppRoutePath.driverProfileSetup,
          builder: (context, state) {
            final user = _authCredentialGateway.currentUser;
            return FutureBuilder<_DriverProfileSetupBootstrapData>(
              future: _loadDriverProfileSetupBootstrapData(user),
              builder: (context, snapshot) {
                final bootstrap = snapshot.data ??
                    _DriverProfileSetupBootstrapData(
                      name: _resolveDisplayName(user),
                      phone: user?.phoneNumber,
                    );
                return DriverProfileSetupScreen(
                  initialName: bootstrap.name,
                  initialPhone: bootstrap.phone,
                  initialPlate: bootstrap.plate,
                  initialShowPhoneToPassengers: bootstrap.showPhoneToPassengers,
                  initialProfilePhotoUrl: bootstrap.photoUrl,
                  initialProfilePhotoPath: bootstrap.photoPath,
                  onPickPhoto: (currentPhotoPath) => _handleProfilePhotoPick(
                    context,
                    role: UserRole.driver,
                    currentPhotoPath: currentPhotoPath,
                  ),
                  onSave: (
                    name,
                    phone,
                    plate,
                    showPhoneToPassengers, {
                    photoUrl,
                    photoPath,
                  }) =>
                      _handleDriverProfileSetupSave(
                    context,
                    name: name,
                    phone: phone,
                    plate: plate,
                    showPhoneToPassengers: showPhoneToPassengers,
                    photoUrl: photoUrl,
                    photoPath: photoPath,
                  ),
                );
              },
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.driverHome,
          builder: (context, state) {
            final query = _DriverHomeRouteQuery.fromState(state);
            unawaited(_ensureDriverHomeLocationPermissionPrompt(context));
            return FutureBuilder<_DriverHomeBootstrapData>(
              future: _loadDriverHomeBootstrapData(),
              builder: (context, snapshot) {
                final bootstrap =
                    snapshot.data ?? const _DriverHomeBootstrapData();
                return RouterDoubleBackExitGuard(
                  onBackBlocked: _showDoubleBackExitHint,
                  child: DriverMapHomeScreen(
                    appName: deps.flavorConfig.appName,
                    routeName: bootstrap.routeName,
                    driverDisplayName: bootstrap.driverDisplayName,
                    driverPhotoUrl: bootstrap.driverPhotoUrl,
                    mapboxPublicToken: deps.environment.googleMapsApiKey,
                    stops: bootstrap.stops,
                    myTrips: bootstrap.myTrips,
                    loadMyTrips: _loadDriverMyTripsItems,
                    initialPreviewRouteId: query.previewRouteId,
                    initialStartedRouteId: query.startedRouteId,
                    queuedPassengerCount: bootstrap.queuedPassengerCount,
                    onStartTripTap: () => unawaited(
                      _handleStartTripWithUndo(context).catchError((_) {
                        if (context.mounted) {
                          _showInfo(
                              context, CoreErrorFeedbackTokens.tripStartFailed);
                        }
                      }),
                    ),
                    onMyTripsTap: () async {
                      await context.push(AppRoutePath.driverMyTrips);
                    },
                    onTripDetailTap: (item) {
                      final detailUri = Uri(
                        path: AppRoutePath.driverTripDetail,
                        queryParameters: <String, String>{
                          'routeId': item.routeId,
                          if ((item.tripId ?? '').isNotEmpty)
                            'tripId': item.tripId!,
                        },
                      );
                      context.push(detailUri.toString());
                    },
                    onManageRouteTap: () =>
                        context.push(AppRoutePath.driverRoutesManage),
                    onAnnouncementTap: () => unawaited(
                      _handleSendDriverAnnouncement(context).catchError((_) {
                        if (context.mounted) {
                          _showInfo(
                            context,
                            CoreErrorFeedbackTokens.announcementSendFailed,
                          );
                        }
                      }),
                    ),
                    onTripHistoryTap: () =>
                        context.push(AppRoutePath.driverTripHistory),
                    onProfileSetupTap: () =>
                        context.push(AppRoutePath.driverProfileSetup),
                    onSubscriptionTap: bootstrap.shouldShowTrialPaywallBanner
                        ? () => context.push(
                              _buildPaywallRouteWithSource(
                                'driver_home_drawer_subscription',
                              ),
                            )
                        : null,
                    onSettingsTap: () =>
                        context.push(AppRoutePath.driverSettings),
                    onSignOutTap: () => _handleDriverDrawerSignOut(context),
                  ),
                );
              },
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.driverSettings,
          builder: (context, state) => _buildAppSettingsRouteView(
            context,
            deps,
            roleOverride: UserRole.driver,
          ),
        ),
        GoRoute(
          path: AppRoutePath.driverRoutesManage,
          builder: (context, state) => DriverRouteManagementScreen(
            onCreateRouteTap: () =>
                context.push(AppRoutePath.driverRouteCreate),
            onUpdateRouteTap: () =>
                context.push(AppRoutePath.driverRouteUpdate),
            onManageStopsTap: () => context.push(AppRoutePath.driverRouteStops),
          ),
        ),
        GoRoute(
          path: AppRoutePath.driverMyTrips,
          builder: (context, state) => DriverMyTripsScreen(
            loadItems: _loadDriverMyTripsItems,
            onTripTap: (item) {
              final detailUri = Uri(
                path: AppRoutePath.driverTripDetail,
                queryParameters: <String, String>{
                  'routeId': item.routeId,
                  if ((item.tripId ?? '').isNotEmpty) 'tripId': item.tripId!,
                },
              );
              context.push(detailUri.toString());
            },
          ),
        ),
        GoRoute(
          path: AppRoutePath.driverTripDetail,
          builder: (context, state) {
            final query = _DriverTripDetailRouteQuery.fromState(state);
            if (!query.hasRouteId) {
              return Scaffold(
                appBar: AppBar(title: const Text('Sefer Detayi')),
                body: const Center(
                  child: Text('Sefer bilgisi eksik. Lütfen tekrar deneyin.'),
                ),
              );
            }
            return DriverTripDetailScreen(
              googleMapsApiKey: deps.environment.googleMapsApiKey,
              loadData: () => _loadDriverTripDetailData(
                routeId: query.routeId!,
                tripId: query.tripId,
              ),
              onEditTripTap: (data) {
                final updateUri = Uri(
                  path: AppRoutePath.driverRouteUpdate,
                  queryParameters: <String, String>{'routeId': data.routeId},
                );
                context.push(updateUri.toString());
              },
              onStartTripTap: (data) => unawaited(
                _handleStartTripWithUndo(
                  context,
                  routeIdOverride: data.routeId,
                  routeNameOverride: data.routeName,
                ).catchError((_) {
                  if (context.mounted) {
                    _showInfo(context, CoreErrorFeedbackTokens.tripStartFailed);
                  }
                }),
              ),
              onSendAnnouncementTap: (data) => unawaited(
                _handleSendDriverAnnouncement(
                  context,
                  routeIdOverride: data.routeId,
                  routeNameOverride: data.routeName,
                ).catchError((_) {
                  if (context.mounted) {
                    _showInfo(
                      context,
                      CoreErrorFeedbackTokens.announcementSendFailed,
                    );
                  }
                }),
              ),
              onOpenNavigationTap: (data) => unawaited(
                _handleOpenDriverTripNavigationInGoogleMaps(
                  context,
                  data: data,
                ).catchError((_) {
                  if (context.mounted) {
                    _showInfo(context, 'Google Maps açılamadı.');
                  }
                }),
              ),
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.driverRouteCreate,
          builder: (context, state) => RouteCreateScreen(
            googleMapsApiKey: deps.environment.googleMapsApiKey,
            onCreate: (input) => _handleCreateRoute(context, input),
          ),
        ),
        GoRoute(
          path: AppRoutePath.driverRouteUpdate,
          builder: (context, state) {
            final query = _RouteIdOnlyRouteQuery.fromState(state);
            return RouteUpdateScreen(
              initialRouteId: query.routeId,
              googleMapsApiKey: deps.environment.googleMapsApiKey,
              onManageStopsTap: (routeId) {
                final stopsUri = Uri(
                  path: AppRoutePath.driverRouteStops,
                  queryParameters: <String, String>{'routeId': routeId},
                );
                context.push(stopsUri.toString());
              },
              onSubmit: (input) => _handleUpdateRoute(context, input),
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.driverRouteStops,
          builder: (context, state) {
            final query = _RouteIdOnlyRouteQuery.fromState(state);
            return StopCrudScreen(
              initialRouteId: query.routeId,
              onUpsert: (input) => _handleUpsertStop(context, input),
              onDelete: (input) => _handleDeleteStop(context, input),
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.paywall,
          builder: (context, state) {
            final query = _DriverPaywallRouteQuery.fromState(state);
            final currentRole = _resolveRoutingRoleWithSessionPreference(
              backendRole: deps.readCurrentRole(),
            );
            if (currentRole != UserRole.driver) {
              final fallback =
                  _resolveRoleCorridorFallbackLocation(currentRole);
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!context.mounted) {
                  return;
                }
                context.go(fallback);
              });
              return const Scaffold(
                body: Center(
                  child: CircularProgressIndicator.adaptive(),
                ),
              );
            }
            final paywallFallbackPath = currentRole == UserRole.passenger
                ? AppRoutePath.passengerHome
                : AppRoutePath.driverHome;
            return FutureBuilder<_DriverSubscriptionSnapshot>(
              future: _resolveCurrentDriverSubscriptionSnapshot(),
              builder: (context, snapshot) {
                final subscriptionSnapshot =
                    snapshot.data ?? const _DriverSubscriptionSnapshot();
                return PopScope(
                  canPop: Navigator.of(context).canPop(),
                  onPopInvokedWithResult: (didPop, _) {
                    if (didPop) {
                      return;
                    }
                    _popRouteOrGo(
                      context,
                      fallbackPath: paywallFallbackPath,
                    );
                  },
                  child: PaywallScreen(
                    appName: deps.flavorConfig.appName,
                    subscriptionStatus: subscriptionSnapshot.status,
                    trialDaysLeft: subscriptionSnapshot.trialDaysLeft,
                    onPurchaseTap: (_) => _handlePaywallPurchaseTap(
                      context,
                      source: query.source,
                      environment: deps.environment,
                    ),
                    onRestoreTap: () => _handlePaywallRestoreTap(context),
                    onManageTap: () => _handlePaywallManageTap(
                      context,
                      environment: deps.environment,
                    ),
                    onLaterTap: () => _popRouteOrGo(
                      context,
                      fallbackPath: paywallFallbackPath,
                    ),
                  ),
                );
              },
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.activeTrip,
          builder: (context, state) {
            final query = _ActiveTripRouteQuery.fromState(state);
            return _DriverFinishTripGuard(
              routeId: query.routeId,
              tripId: query.tripId,
              routeName: query.routeName,
              initialTransitionVersion: query.transitionVersion,
              mapboxPublicToken: deps.environment.googleMapsApiKey,
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.driverTripCompleted,
          builder: (context, state) {
            final query = _DriverTripCompletedRouteQuery.fromState(state);
            return FutureBuilder<_DriverTripCompletedBootstrapData>(
              future: _loadDriverTripCompletedBootstrapData(
                routeId: query.routeId,
                tripId: query.tripId,
              ),
              builder: (context, snapshot) {
                final bootstrap = snapshot.data ??
                    const _DriverTripCompletedBootstrapData(
                      totalDurationMinutes: 0,
                    );
                return DriverTripCompletedScreen(
                  routeName: query.routeName,
                  totalDistanceKm: bootstrap.totalDistanceKm,
                  totalDurationMinutes: bootstrap.totalDurationMinutes,
                  totalPassengers: bootstrap.totalPassengers,
                  stops: bootstrap.stops,
                  onBackHomeTap: () => context.go(AppRoutePath.driverHome),
                );
              },
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.driverTripHistory,
          builder: (context, state) {
            return TripHistoryScreen(
              audience: TripHistoryAudience.driver,
              loadItems: _loadDriverTripHistoryItems,
              onDetailTap: (item) {
                final routeName =
                    _nullableParam(item.routeName) ?? 'Şoför Rotası';
                final routeId = _nullableParam(item.routeId);
                final tripId = _nullableParam(item.tripId);
                if (routeId == null || tripId == null) {
                  _showInfo(context, 'Sefer detayi açılamadı.');
                  return;
                }
                final detailUri = Uri(
                  path: AppRoutePath.driverTripCompleted,
                  queryParameters: <String, String>{
                    'routeId': routeId,
                    'tripId': tripId,
                    'routeName': routeName,
                  },
                );
                context.push(detailUri.toString());
              },
            );
          },
        ),
      ],
    ),
  ];
}
