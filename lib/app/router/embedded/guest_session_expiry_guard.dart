part of '../app_router.dart';

class _GuestSessionExpiryGuard extends StatefulWidget {
  const _GuestSessionExpiryGuard({
    required this.sessionId,
    required this.mapboxPublicToken,
    required this.initialEtaSourceLabel,
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

  @override
  State<_GuestSessionExpiryGuard> createState() =>
      _GuestSessionExpiryGuardState();
}

class _GuestSessionExpiryGuardState extends State<_GuestSessionExpiryGuard> {
  bool _redirected = false;

  void _redirectToGuestJoin(String message) {
    if (_redirected || !mounted) {
      return;
    }
    final switchSourceRole = _snapshotRoleSwitchSourceRole();
    _redirected = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _showInfo(context, message);
      _applyRoleSwitchNavigationPlan(
        context,
        fromRole: switchSourceRole,
        toRole: UserRole.guest,
        targetLocation: _buildJoinRoute(role: JoinRole.guest),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('guest_sessions')
          .doc(widget.sessionId)
          .snapshots(),
      builder: (context, snapshot) {
        final data = snapshot.data?.data();
        final status = _nullableParam(data?['status'] as String?);
        final routeId = _nullableParam(data?['routeId'] as String?) ??
            _nullableParam(widget.initialRouteId);
        final routeName = _nullableParam(data?['routeName'] as String?) ??
            _nullableParam(widget.initialRouteName) ??
            'Misafir Takip';
        final expiresAtRaw = _nullableParam(data?['expiresAt'] as String?) ??
            _nullableParam(widget.initialExpiresAt);
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
          _redirectToGuestJoin(
            'Misafir takip oturumu sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼resi doldu. LÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼tfen yeniden katÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±l.',
          );
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
          stream: FirebaseFirestore.instance
              .collection('routes')
              .doc(routeId)
              .snapshots(),
          builder: (context, routeSnapshot) {
            final routeData = routeSnapshot.data?.data();
            final resolvedRouteName =
                _nullableParam(routeData?['name'] as String?) ?? routeName;
            final routeDriverUid =
                _nullableToken(routeData?['driverId'] as String?);

            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('trips')
                  .where('routeId', isEqualTo: routeId)
                  .where('status', isEqualTo: 'active')
                  .limit(1)
                  .snapshots(),
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
                    _toPassengerDriverSnapshotFromTripData(activeTripData);
                return _PassengerLocationStreamBuilder(
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
                        : () => unawaited(
                              _handleOpenTripChat(
                                context,
                                routeId: routeId,
                                driverUid: activeDriverUid,
                                counterpartName: driverSnapshot?.name,
                                counterpartSubtitle: driverSnapshot?.plate,
                              ),
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
