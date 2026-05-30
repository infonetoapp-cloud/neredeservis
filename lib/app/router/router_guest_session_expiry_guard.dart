import 'package:flutter/material.dart';

import '../../features/passenger/domain/passenger_tracking_snapshot_repository.dart';
import '../../ui/components/sheets/passenger_map_sheet.dart';
import '../../ui/screens/passenger_tracking_screen.dart';
import 'router_passenger_location_widgets.dart';

typedef RouterGuestTrackingSnapshotStreamFactory
    = Stream<PassengerTrackingSnapshotData?> Function(String sessionId);
typedef RouterGuestSessionInvalidHandler = void Function(BuildContext context);
typedef RouterTripChatTapHandler = void Function(
  BuildContext context, {
  required String routeId,
  required String driverUid,
  String? counterpartName,
  String? counterpartSubtitle,
});
typedef RouterDriverSnapshotFromTripData = PassengerDriverSnapshotInfo?
    Function(
  Map<String, dynamic>? activeTripData,
);

class RouterGuestSessionExpiryGuard extends StatefulWidget {
  const RouterGuestSessionExpiryGuard({
    super.key,
    required this.sessionId,
    required this.initialEtaSourceLabel,
    required this.watchTrackingSnapshot,
    required this.onSessionInvalid,
    required this.buildDriverSnapshotFromTripData,
    this.onTripChatTap,
    this.initialRouteId,
    this.initialRouteName,
    this.initialExpiresAt,
  });

  final String sessionId;
  final String? initialRouteId;
  final String? initialRouteName;
  final String? initialExpiresAt;
  final String initialEtaSourceLabel;
  final RouterGuestTrackingSnapshotStreamFactory watchTrackingSnapshot;
  final RouterGuestSessionInvalidHandler onSessionInvalid;
  final RouterDriverSnapshotFromTripData buildDriverSnapshotFromTripData;
  final RouterTripChatTapHandler? onTripChatTap;

  @override
  State<RouterGuestSessionExpiryGuard> createState() =>
      _RouterGuestSessionExpiryGuardState();
}

class _RouterGuestSessionExpiryGuardState
    extends State<RouterGuestSessionExpiryGuard> {
  bool _redirected = false;

  void _redirectToGuestJoin() {
    if (_redirected || !mounted) {
      return;
    }
    _redirected = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      widget.onSessionInvalid(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<PassengerTrackingSnapshotData?>(
      stream: widget.watchTrackingSnapshot(widget.sessionId),
      builder: (context, snapshot) {
        final trackingSnapshot = snapshot.data;
        final sessionData = trackingSnapshot?.guestSession;
        final status = _nullableString(sessionData?['status'] as String?);
        final routeId =
            trackingSnapshot?.routeId ?? _nullableString(widget.initialRouteId);
        final routeName = trackingSnapshot?.routeName ??
            _nullableString(widget.initialRouteName) ??
            'Misafir Takip';
        final expiresAtRaw =
            _nullableString(sessionData?['expiresAt'] as String?) ??
                _nullableString(widget.initialExpiresAt);
        final expiresAt = expiresAtRaw == null
            ? null
            : DateTime.tryParse(expiresAtRaw)?.toUtc();
        final nowUtc = DateTime.now().toUtc();

        final sessionMissing =
            snapshot.connectionState == ConnectionState.done &&
                trackingSnapshot == null;
        final sessionRevoked = status != null && status != 'active';
        final sessionExpired = expiresAt == null || !expiresAt.isAfter(nowUtc);

        if (sessionMissing || sessionRevoked || sessionExpired) {
          _redirectToGuestJoin();
        }

        if (routeId == null) {
          return PassengerTrackingScreen(
            routeName: routeName,
            etaSourceLabel: widget.initialEtaSourceLabel,
            showUserLocation: true,
          );
        }

        final routeData = trackingSnapshot?.routeData;
        final activeTripData = trackingSnapshot?.activeTripData;
        final resolvedRouteName =
            _nullableString(routeData?['name'] as String?) ?? routeName;
        final routeDriverUid =
            _nullableToken(routeData?['driverId'] as String?);
        final activeDriverUid =
            _nullableToken(activeTripData?['driverId'] as String?) ??
                _nullableToken(activeTripData?['driverUid'] as String?) ??
                routeDriverUid;
        final driverSnapshot =
            widget.buildDriverSnapshotFromTripData(activeTripData);
        return RouterPassengerLocationStreamBuilder(
          routeId: routeId,
          routeData: routeData,
          passengerData: null,
          liveLocationData: trackingSnapshot?.liveLocation,
          fallbackEtaSourceLabel: widget.initialEtaSourceLabel,
          guestSessionId: widget.sessionId,
          builder: (location) => PassengerTrackingScreen(
            routeName: resolvedRouteName,
            estimatedMinutes: location.estimatedMinutes,
            etaSourceLabel: location.etaSourceLabel,
            lastEtaSourceLabel: location.lastEtaSourceLabel,
            offlineBannerLabel: location.offlineBannerLabel,
            latencyIndicatorLabel: location.latencyIndicatorLabel,
            freshness: location.freshness,
            lastSeenAgo: location.lastSeenAgo,
            vehicleLat: location.filteredLat ?? location.rawLat,
            vehicleLng: location.filteredLng ?? location.rawLng,
            showUserLocation: true,
            driverSnapshot: driverSnapshot,
            onMessageDriverTap: activeDriverUid == null
                ? null
                : () => widget.onTripChatTap?.call(
                      context,
                      routeId: routeId,
                      driverUid: activeDriverUid,
                      counterpartName: driverSnapshot?.name,
                      counterpartSubtitle: driverSnapshot?.plate,
                    ),
          ),
        );
      },
    );
  }
}

String? _nullableString(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}

String? _nullableToken(String? value) {
  final token = value?.trim();
  if (token == null || token.isEmpty) {
    return null;
  }
  return token;
}
