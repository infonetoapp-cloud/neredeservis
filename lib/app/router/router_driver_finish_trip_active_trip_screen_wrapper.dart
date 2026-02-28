import 'package:flutter/material.dart';

import '../../ui/components/indicators/core_heartbeat_indicator.dart';
import '../../ui/screens/active_trip_screen.dart';
import 'router_driver_finish_trip_passenger_helpers.dart';

class RouterDriverFinishTripActiveTripScreenWrapper extends StatelessWidget {
  const RouterDriverFinishTripActiveTripScreenWrapper({
    super.key,
    required this.routeId,
    required this.tripId,
    required this.routeName,
    required this.screenResetSeed,
    required this.heartbeatState,
    required this.lastHeartbeatAgo,
    required this.routePathPoints,
    required this.vehiclePoint,
    required this.nextStopPoint,
    required this.nextStopName,
    required this.crowFlyDistanceMeters,
    required this.stopsRemaining,
    required this.passengerEntries,
    required this.hasPendingCriticalSync,
    required this.mapboxPublicToken,
    required this.onBlockedPopAttempt,
    this.syncStateLabel,
    this.manualInterventionMessage,
    this.offlineBannerLabel,
    this.latencyIndicatorLabel,
    this.onPassengerMessageTap,
    this.onRetrySyncTap,
    this.onReportIssueTap,
    this.onTripFinished,
  });

  final String? routeId;
  final String? tripId;
  final String routeName;
  final int screenResetSeed;
  final HeartbeatState heartbeatState;
  final String lastHeartbeatAgo;
  final List<ActiveTripMapPoint> routePathPoints;
  final ActiveTripMapPoint? vehiclePoint;
  final ActiveTripMapPoint? nextStopPoint;
  final String? nextStopName;
  final int? crowFlyDistanceMeters;
  final int? stopsRemaining;
  final List<ActiveTripPassengerEntry> passengerEntries;
  final bool hasPendingCriticalSync;
  final String? mapboxPublicToken;
  final String? syncStateLabel;
  final String? manualInterventionMessage;
  final String? offlineBannerLabel;
  final String? latencyIndicatorLabel;
  final ValueChanged<ActiveTripPassengerEntry>? onPassengerMessageTap;
  final VoidCallback? onRetrySyncTap;
  final VoidCallback? onReportIssueTap;
  final VoidCallback? onTripFinished;
  final VoidCallback onBlockedPopAttempt;

  @override
  Widget build(BuildContext context) {
    final screen = ActiveTripScreen(
      key: ValueKey<String>(
        'active_trip_${routeId ?? 'none'}_${tripId ?? 'none'}_$screenResetSeed',
      ),
      routeName: routeName,
      nextStopName: nextStopName,
      crowFlyDistanceMeters: crowFlyDistanceMeters,
      stopsRemaining: stopsRemaining,
      passengersAtNextStop:
          resolveDriverFinishTripPassengersAtNextStop(passengerEntries),
      passengerEntries: passengerEntries,
      heartbeatState: heartbeatState,
      lastHeartbeatAgo: lastHeartbeatAgo,
      routePathPoints: routePathPoints,
      vehiclePoint: vehiclePoint,
      nextStopPoint: nextStopPoint,
      syncStateLabel: syncStateLabel,
      manualInterventionMessage: manualInterventionMessage,
      offlineBannerLabel: offlineBannerLabel,
      latencyIndicatorLabel: latencyIndicatorLabel,
      mapboxPublicToken: mapboxPublicToken,
      onPassengerMessageTap: onPassengerMessageTap,
      onRetrySyncTap: onRetrySyncTap,
      onReportIssueTap: onReportIssueTap,
      onTripFinished: onTripFinished,
    );
    return PopScope(
      canPop: !hasPendingCriticalSync,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop || !hasPendingCriticalSync) {
          return;
        }
        onBlockedPopAttempt();
      },
      child: screen,
    );
  }
}
