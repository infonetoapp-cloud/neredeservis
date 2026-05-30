part of '../app_router.dart';

Widget _buildPassengerTrackingRoute(
  BuildContext context,
  GoRouterState state,
  AppEnvironment environment,
) {
  final query = _PassengerTrackingRouteQuery.fromState(state);
  final routeId = query.routeId;
  final routeName = query.routeName;
  final etaSourceFromQuery = query.etaSourceLabel;
  final guestSessionId = query.guestSessionId;
  final guestExpiresAt = query.guestExpiresAt;
  final user = _authCredentialGateway.currentUser;
  final defaultEtaSourceLabel = etaSourceFromQuery ?? 'Rota baslangic tahmini';

  PassengerTrackingScreen buildTrackingScreen({
    required String resolvedRouteName,
    required String fallbackEtaSourceLabel,
    int? estimatedMinutes = 12,
    String? etaSourceLabel,
    String? lastEtaSourceLabel,
    bool isSoftLockMode = false,
    String? offlineBannerLabel,
    String? latencyIndicatorLabel,
    String? driverNote,
    String? morningReminderNote,
    String? vacationModeNote,
    PassengerDriverSnapshotInfo? driverSnapshot,
    List<PassengerStopInfo> stops = const <PassengerStopInfo>[],
    LocationFreshness freshness = LocationFreshness.live,
    String? lastSeenAgo,
    bool isLate = false,
    String? scheduledTime,
    double? vehicleLat,
    double? vehicleLng,
    VoidCallback? onSettingsTap,
    VoidCallback? onTripHistoryTap,
    VoidCallback? onSkipTodayTap,
    VoidCallback? onLeaveRouteTap,
    VoidCallback? onKeepNotificationsTap,
    VoidCallback? onBackToServicesTap,
    VoidCallback? onAddServiceTap,
    VoidCallback? onMessageDriverTap,
  }) {
    return PassengerTrackingScreen(
      routeName: resolvedRouteName,
      estimatedMinutes: estimatedMinutes,
      etaSourceLabel: etaSourceLabel ?? fallbackEtaSourceLabel,
      lastEtaSourceLabel: lastEtaSourceLabel,
      isSoftLockMode: isSoftLockMode,
      offlineBannerLabel: offlineBannerLabel,
      latencyIndicatorLabel: latencyIndicatorLabel,
      driverNote: driverNote,
      morningReminderNote: morningReminderNote,
      vacationModeNote: vacationModeNote,
      driverSnapshot: driverSnapshot,
      stops: stops,
      freshness: freshness,
      lastSeenAgo: lastSeenAgo,
      isLate: isLate,
      scheduledTime: scheduledTime,
      vehicleLat: vehicleLat,
      vehicleLng: vehicleLng,
      onSettingsTap: onSettingsTap,
      onTripHistoryTap: onTripHistoryTap,
      onSkipTodayTap: onSkipTodayTap,
      onLeaveRouteTap: onLeaveRouteTap,
      onKeepNotificationsTap: onKeepNotificationsTap,
      onBackToServicesTap: onBackToServicesTap,
      onAddServiceTap: onAddServiceTap,
      onMessageDriverTap: onMessageDriverTap,
    );
  }

  void pushPassengerSettings({
    String? resolvedRouteId,
    String? resolvedRouteName,
  }) {
    context.push(
      Uri(
        path: AppRoutePath.passengerSettings,
        queryParameters: <String, String>{
          if (resolvedRouteId != null) 'routeId': resolvedRouteId,
          if (resolvedRouteName != null) 'routeName': resolvedRouteName,
        },
      ).toString(),
    );
  }

  void onTripHistoryTap() => context.push(AppRoutePath.passengerTripHistory);

  void onBackToServicesTap() => context.go(AppRoutePath.passengerHome);

  void onAddServiceTap() =>
      context.go(_buildJoinRoute(role: JoinRole.passenger));

  if (guestSessionId != null) {
    return RouterGuestSessionExpiryGuard(
      sessionId: guestSessionId,
      watchTrackingSnapshot:
          _observePassengerTrackingSnapshotsUseCase.watchGuestSessionTracking,
      onSessionInvalid: (context) {
        _showInfo(
          context,
          'Misafir takip oturumu sona erdi. Lutfen yeniden katil.',
        );
        _applyRoleSwitchNavigationPlan(
          context,
          fromRole: _snapshotRoleSwitchSourceRole(),
          toRole: UserRole.guest,
          targetLocation: _buildJoinRoute(role: JoinRole.guest),
        );
      },
      buildDriverSnapshotFromTripData: _toPassengerDriverSnapshotFromTripData,
      onTripChatTap: (
        context, {
        required routeId,
        required driverUid,
        counterpartName,
        counterpartSubtitle,
      }) =>
          unawaited(
        _handleOpenTripChat(
          context,
          routeId: routeId,
          driverUid: driverUid,
          counterpartName: counterpartName,
          counterpartSubtitle: counterpartSubtitle,
        ),
      ),
      initialRouteId: routeId,
      initialRouteName: routeName,
      initialExpiresAt: guestExpiresAt,
      initialEtaSourceLabel: defaultEtaSourceLabel,
    );
  }

  if (routeId == null || user == null || user.isAnonymous) {
    return buildTrackingScreen(
      resolvedRouteName: routeName ?? 'Servis Takibi',
      fallbackEtaSourceLabel: defaultEtaSourceLabel,
      onTripHistoryTap: onTripHistoryTap,
      onBackToServicesTap: onBackToServicesTap,
      onAddServiceTap: onAddServiceTap,
    );
  }

  return StreamBuilder<PassengerTrackingSnapshotData?>(
    stream:
        _observePassengerTrackingSnapshotsUseCase.watchPassengerRouteTracking(
      routeId,
    ),
    builder: (context, snapshot) {
      final trackingSnapshot = snapshot.data;
      final routeData = trackingSnapshot?.routeData;
      final activeTripData = trackingSnapshot?.activeTripData;
      final driverData = trackingSnapshot?.driverData;
      final passengerData = trackingSnapshot?.passengerData;
      final latestAnnouncement = trackingSnapshot?.latestAnnouncement;
      final stops = _resolvePassengerStops(trackingSnapshot?.stops);
      final liveLocationData = trackingSnapshot?.liveLocation;
      final resolvedRouteName = _nullableParam(routeData?['name'] as String?) ??
          trackingSnapshot?.routeName ??
          routeName ??
          'Servis Takibi';
      final scheduledTime =
          _nullableParam(routeData?['scheduledTime'] as String?);
      final hasActiveTrip = activeTripData != null;
      final isLate = shouldShowLateDepartureBanner(
        nowUtc: DateTime.now().toUtc(),
        scheduledTime: scheduledTime,
        hasActiveTrip: hasActiveTrip,
      );
      final isSoftLockMode = _resolvePassengerSoftLockMode(
        routeData: routeData,
        driverData: driverData,
      );
      final fallbackEtaSourceLabel = etaSourceFromQuery ??
          _resolveEtaSourceLabelFromPassengerData(passengerData);
      final notificationUiState = _passengerNotificationUiService.resolve(
        hasActiveTrip: hasActiveTrip,
        routeData: routeData,
        passengerData: passengerData,
        announcementData: latestAnnouncement,
        activeTripData: activeTripData,
      );
      final driverSnapshot =
          _toPassengerDriverSnapshotInfo(notificationUiState.driverSnapshot) ??
              _toPassengerDriverSnapshotFromDriverData(driverData) ??
              _toPassengerDriverSnapshotFromTripData(activeTripData);
      final activeTripDriverUid =
          _nullableToken(activeTripData?['driverId'] as String?) ??
              _nullableToken(activeTripData?['driverUid'] as String?) ??
              _nullableToken(routeData?['driverId'] as String?);

      void onSettingsTap() => pushPassengerSettings(
            resolvedRouteId: routeId,
            resolvedRouteName: resolvedRouteName,
          );

      void onSkipTodayTap() => unawaited(
            _handleSubmitSkipToday(context, routeId),
          );

      void onLeaveRouteTap() => unawaited(
            _handleLeaveRoute(context, routeId),
          );
      final onKeepNotificationsTap = onSettingsTap;
      final onMessageDriverTap = activeTripDriverUid == null
          ? null
          : () => unawaited(
                _handleOpenTripChat(
                  context,
                  routeId: routeId,
                  driverUid: activeTripDriverUid,
                  counterpartName: driverSnapshot?.name,
                  counterpartSubtitle: driverSnapshot?.plate,
                ),
              );

      if (trackingSnapshot == null) {
        return buildTrackingScreen(
          resolvedRouteName: resolvedRouteName,
          fallbackEtaSourceLabel: fallbackEtaSourceLabel,
          isSoftLockMode: isSoftLockMode,
          driverNote: notificationUiState.announcementNote,
          morningReminderNote: notificationUiState.morningReminderNote,
          vacationModeNote: notificationUiState.vacationModeNote,
          driverSnapshot: driverSnapshot,
          stops: stops,
          isLate: isLate,
          scheduledTime: scheduledTime,
          onSettingsTap: onSettingsTap,
          onTripHistoryTap: onTripHistoryTap,
          onSkipTodayTap: onSkipTodayTap,
          onLeaveRouteTap: onLeaveRouteTap,
          onKeepNotificationsTap: onKeepNotificationsTap,
          onBackToServicesTap: onBackToServicesTap,
          onAddServiceTap: onAddServiceTap,
          onMessageDriverTap: onMessageDriverTap,
        );
      }

      return RouterPassengerLocationStreamBuilder(
        routeId: routeId,
        routeData: routeData,
        passengerData: passengerData,
        liveLocationData: liveLocationData,
        fallbackEtaSourceLabel: fallbackEtaSourceLabel,
        builder: (location) => buildTrackingScreen(
          resolvedRouteName: resolvedRouteName,
          estimatedMinutes: location.estimatedMinutes,
          fallbackEtaSourceLabel: fallbackEtaSourceLabel,
          etaSourceLabel: location.etaSourceLabel,
          lastEtaSourceLabel: location.lastEtaSourceLabel,
          isSoftLockMode: isSoftLockMode,
          offlineBannerLabel: location.offlineBannerLabel,
          latencyIndicatorLabel: location.latencyIndicatorLabel,
          driverNote: notificationUiState.announcementNote,
          morningReminderNote: notificationUiState.morningReminderNote,
          vacationModeNote: notificationUiState.vacationModeNote,
          driverSnapshot: driverSnapshot,
          stops: stops,
          freshness: location.freshness,
          lastSeenAgo: location.lastSeenAgo,
          isLate: isLate,
          scheduledTime: scheduledTime,
          vehicleLat: location.filteredLat ?? location.rawLat,
          vehicleLng: location.filteredLng ?? location.rawLng,
          onSettingsTap: onSettingsTap,
          onTripHistoryTap: onTripHistoryTap,
          onSkipTodayTap: onSkipTodayTap,
          onLeaveRouteTap: onLeaveRouteTap,
          onKeepNotificationsTap: onKeepNotificationsTap,
          onBackToServicesTap: onBackToServicesTap,
          onAddServiceTap: onAddServiceTap,
          onMessageDriverTap: onMessageDriverTap,
        ),
      );
    },
  );
}
