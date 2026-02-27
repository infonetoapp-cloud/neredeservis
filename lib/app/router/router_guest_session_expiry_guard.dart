import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../ui/components/sheets/passenger_map_sheet.dart';
import '../../ui/screens/passenger_tracking_screen.dart';
import 'router_passenger_location_widgets.dart';

typedef RouterGuestSessionDocStreamFactory
    = Stream<DocumentSnapshot<Map<String, dynamic>>> Function(String sessionId);
typedef RouterRouteDocStreamFactory
    = Stream<DocumentSnapshot<Map<String, dynamic>>> Function(String routeId);
typedef RouterActiveTripDocsStreamFactory
    = Stream<QuerySnapshot<Map<String, dynamic>>> Function(String routeId);
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
    required this.mapboxPublicToken,
    required this.initialEtaSourceLabel,
    required this.watchGuestSessionDocument,
    required this.watchRouteDocument,
    required this.watchActiveTripDocuments,
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
  final String? mapboxPublicToken;
  final String initialEtaSourceLabel;
  final RouterGuestSessionDocStreamFactory watchGuestSessionDocument;
  final RouterRouteDocStreamFactory watchRouteDocument;
  final RouterActiveTripDocsStreamFactory watchActiveTripDocuments;
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
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: widget.watchGuestSessionDocument(widget.sessionId),
      builder: (context, snapshot) {
        final data = snapshot.data?.data();
        final status = _nullableString(data?['status'] as String?);
        final routeId = _nullableString(data?['routeId'] as String?) ??
            _nullableString(widget.initialRouteId);
        final routeName = _nullableString(data?['routeName'] as String?) ??
            _nullableString(widget.initialRouteName) ??
            'Misafir Takip';
        final expiresAtRaw = _nullableString(data?['expiresAt'] as String?) ??
            _nullableString(widget.initialExpiresAt);
        final expiresAt = expiresAtRaw == null
            ? null
            : DateTime.tryParse(expiresAtRaw)?.toUtc();
        final nowUtc = DateTime.now().toUtc();

        final sessionMissing =
            snapshot.connectionState == ConnectionState.done &&
                !snapshot.hasData &&
                data == null;
        final sessionRevoked = status != null && status != 'active';
        final sessionExpired = expiresAt == null || !expiresAt.isAfter(nowUtc);

        if (snapshot.hasError ||
            sessionMissing ||
            sessionRevoked ||
            sessionExpired) {
          _redirectToGuestJoin();
        }

        if (routeId == null) {
          return PassengerTrackingScreen(
            mapboxPublicToken: widget.mapboxPublicToken,
            routeName: routeName,
            etaSourceLabel: widget.initialEtaSourceLabel,
            showUserLocation: true,
          );
        }

        return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: widget.watchRouteDocument(routeId),
          builder: (context, routeSnapshot) {
            final routeData = routeSnapshot.data?.data();
            final resolvedRouteName =
                _nullableString(routeData?['name'] as String?) ?? routeName;
            final routeDriverUid =
                _nullableToken(routeData?['driverId'] as String?);

            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: widget.watchActiveTripDocuments(routeId),
              builder: (context, activeTripSnapshot) {
                final hasActiveTrip =
                    activeTripSnapshot.data?.docs.isNotEmpty ?? false;
                final activeTripData = hasActiveTrip
                    ? activeTripSnapshot.data?.docs.first.data()
                    : null;
                final activeDriverUid =
                    _nullableToken(activeTripData?['driverId'] as String?) ??
                        routeDriverUid;
                final driverSnapshot =
                    widget.buildDriverSnapshotFromTripData(activeTripData);
                return RouterPassengerLocationStreamBuilder(
                  routeId: routeId,
                  routeData: null,
                  passengerData: null,
                  fallbackEtaSourceLabel: widget.initialEtaSourceLabel,
                  builder: (location) => PassengerTrackingScreen(
                    mapboxPublicToken: widget.mapboxPublicToken,
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
          },
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
