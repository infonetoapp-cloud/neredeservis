import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/telemetry/mobile_event_names.dart';
import '../../core/telemetry/mobile_telemetry.dart';
import '../components/indicators/core_status_chip.dart';
import '../components/maps/service_map_view.dart';
import '../components/sheets/passenger_map_sheet.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';
import '../tokens/icon_tokens.dart';

/// Passenger tracking screen: full-screen map shell + draggable bottom sheet.
///
/// Runbook 156: Passenger map bottom-sheet ekranini amber stile gore kodla.
/// Runbook 175: Passenger ekranda tek sheet kuralini sabitle.
///
/// Architecture:
/// - Layer 0: ServiceMapView
/// - Layer 1: Top route info bar (transparent overlay)
/// - Layer 2: Fixed bottom sheet with PassengerMapSheet content
class PassengerTrackingScreen extends StatelessWidget {
  const PassengerTrackingScreen({
    super.key,
    this.routeName = 'Darica -> GOSB',
    this.estimatedMinutes = 12,
    this.etaSourceLabel = 'Kus ucusu tahmini',
    this.lastEtaSourceLabel,
    this.freshness = LocationFreshness.live,
    this.lastSeenAgo,
    this.driverNote,
    this.stops = const <PassengerStopInfo>[],
    this.isLate = false,
    this.scheduledTime,
    this.morningReminderNote,
    this.vacationModeNote,
    this.driverSnapshot,
    this.driverName,
    this.isSoftLockMode = false,
    this.offlineBannerLabel,
    this.latencyIndicatorLabel,
    this.showUserLocation = true,
    this.vehicleLat,
    this.vehicleLng,
    this.onSkipTodayTap,
    this.onLeaveRouteTap,
    this.onSettingsTap,
    VoidCallback? onTripaistoryTap,
    VoidCallback? onTripHistoryTap,
    this.onKeepNotificationsTap,
    this.onBackToServicesTap,
    this.onAddServiceTap,
    this.onMessageDriverTap,
  }) : onTripaistoryTap = onTripaistoryTap ?? onTripHistoryTap;

  /// Route display name.
  final String routeName;

  /// Estimated arrival in minutes.
  final int? estimatedMinutes;

  /// ETA calculation source label.
  final String? etaSourceLabel;

  /// Last resolved ETA source shown in the sheet metadata line.
  final String? lastEtaSourceLabel;

  /// Driver location freshness level.
  final LocationFreshness freshness;

  /// auman-readable last seen time.
  final String? lastSeenAgo;

  /// Latest driver announcement.
  final String? driverNote;

  /// Ordered list of stops on the route.
  final List<PassengerStopInfo> stops;

  /// Whether trip is late (no active trip, past scheduled + 10 min).
  final bool isLate;

  /// Scheduled departure time label.
  final String? scheduledTime;

  /// Morning reminder note around departure time.
  final String? morningReminderNote;

  /// Vacation mode note if route is temporarily paused.
  final String? vacationModeNote;

  /// Driver snapshot shown for active trip context.
  final PassengerDriverSnapshotInfo? driverSnapshot;

  /// Driver's display name (for the map marker label).
  final String? driverName;

  /// Whether the passenger feed is in soft-lock mode.
  final bool isSoftLockMode;

  /// Optional offline banner copy shown in top overlay.
  final String? offlineBannerLabel;

  /// Optional latency indicator label shown near freshness chip.
  final String? latencyIndicatorLabel;

  /// Whether passenger's own map location should be displayed.
  final bool showUserLocation;

  /// Latest vehicle latitude for live marker rendering.
  final double? vehicleLat;

  /// Latest vehicle longitude for live marker rendering.
  final double? vehicleLng;

  /// Optional leave action for joined passengers.
  final VoidCallback? onLeaveRouteTap;

  /// Optional settings action for passenger route preferences.
  final VoidCallback? onSettingsTap;

  /// Optional trip history action for passenger.
  final VoidCallback? onTripaistoryTap;

  /// Optional skip-today action for passenger.
  final VoidCallback? onSkipTodayTap;

  /// Optional CTA for keeping notifications enabled on late inference card.
  final VoidCallback? onKeepNotificationsTap;

  /// Optional CTA for going back to passenger services/home.
  final VoidCallback? onBackToServicesTap;

  /// Optional CTA for adding/joining a new passenger service.
  final VoidCallback? onAddServiceTap;

  /// Optional CTA for sending a direct message to the driver.
  final VoidCallback? onMessageDriverTap;

  @override
  Widget build(BuildContext context) {
    final vehiclePoint = _toVehiclePoint(
      lat: vehicleLat,
      lng: vehicleLng,
    );
    final hasMenuActions = onAddServiceTap != null ||
        onBackToServicesTap != null ||
        onSettingsTap != null ||
        onTripaistoryTap != null ||
        onSkipTodayTap != null ||
        onLeaveRouteTap != null;
    return Scaffold(
      drawer: hasMenuActions
          ? _PassengerActionDrawer(
              routeName: routeName,
              onAddServiceTap: onAddServiceTap,
              onBackToServicesTap: onBackToServicesTap,
              onSettingsTap: onSettingsTap,
              onTripaistoryTap: onTripaistoryTap,
              onSkipTodayTap: onSkipTodayTap,
              onLeaveRouteTap: onLeaveRouteTap,
            )
          : null,
      body: Builder(
        builder: (scaffoldContext) {
          return Stack(
            children: <Widget>[
              // Layer 0: Map shell
              Positioned.fill(
                child: _ServicePassengerMapShell(
                  showUserLocation: showUserLocation,
                  vehiclePoint: vehiclePoint,
                ),
              ),

              // Layer 1: Top status bar
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: _TopBar(
                  routeName: routeName,
                  freshness: freshness,
                  offlineBannerLabel: offlineBannerLabel,
                  latencyIndicatorLabel: latencyIndicatorLabel,
                  onMenuTap: hasMenuActions
                      ? () => Scaffold.of(scaffoldContext).openDrawer()
                      : null,
                  onSettingsTap: onSettingsTap,
                  onSkipTodayTap: onSkipTodayTap,
                  onLeaveRouteTap: onLeaveRouteTap,
                ),
              ),

              // Layer 2: Fixed bottom sheet
              _PassengerFixedSheet(
                routeName: routeName,
                estimatedMinutes: estimatedMinutes,
                etaSourceLabel: etaSourceLabel,
                lastEtaSourceLabel: lastEtaSourceLabel,
                freshness: freshness,
                lastSeenAgo: lastSeenAgo,
                driverNote: driverNote,
                stops: stops,
                isLate: isLate,
                scheduledTime: scheduledTime,
                morningReminderNote: morningReminderNote,
                vacationModeNote: vacationModeNote,
                driverSnapshot: driverSnapshot,
                isSoftLockMode: isSoftLockMode,
                onKeepNotificationsTap: onKeepNotificationsTap,
                onBackToServicesTap: onBackToServicesTap,
                onSkipTodayTap: onSkipTodayTap,
                onMessageDriverTap: onMessageDriverTap,
              ),
            ],
          );
        },
      ),
    );
  }
}

// --- Internal Widgets ---

PassengerVehicleMapPoint? _toVehiclePoint({
  required double? lat,
  required double? lng,
}) {
  if (lat == null || lng == null) {
    return null;
  }
  // Guard malformed backend/cache values before they hit the map widget.
  if (!lat.isFinite || !lng.isFinite) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return PassengerVehicleMapPoint(lat: lat, lng: lng);
}

class PassengerVehicleMapPoint {
  const PassengerVehicleMapPoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is PassengerVehicleMapPoint &&
        other.lat == lat &&
        other.lng == lng;
  }

  @override
  int get hashCode => Object.hash(lat, lng);
}

class _ServicePassengerMapShell extends StatefulWidget {
  const _ServicePassengerMapShell({
    required this.showUserLocation,
    required this.vehiclePoint,
  });

  final bool showUserLocation;
  final PassengerVehicleMapPoint? vehiclePoint;

  @override
  State<_ServicePassengerMapShell> createState() =>
      _ServicePassengerMapShellState();
}

class _ServicePassengerMapShellState extends State<_ServicePassengerMapShell> {
  final ServiceMapController _mapController = ServiceMapController();
  Position? _lastKnownUserPosition;
  bool _locationPermissionGranted = false;
  bool _permissionPromptAttempted = false;
  bool _permissionDeniedSnackShown = false;
  bool _privacySnackShown = false;
  final Stopwatch _mapRenderStopwatch = Stopwatch()..start();
  bool _mapRenderMetricSent = false;

  @override
  void initState() {
    super.initState();
    _requestLocationPermissionIfNeeded();
  }

  @override
  void didUpdateWidget(covariant _ServicePassengerMapShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.showUserLocation != widget.showUserLocation) {
      _requestLocationPermissionIfNeeded();
    }
    if (oldWidget.vehiclePoint != widget.vehiclePoint ||
        oldWidget.showUserLocation != widget.showUserLocation) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) {
          return;
        }
        _syncCameraToLatestState();
      });
    }
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userMarker = _buildUserMarker();
    final vehicleMarker = _buildVehicleMarker();
    final markers = <ServiceMapMarkerData>[
      if (userMarker != null) userMarker,
      if (vehicleMarker != null) vehicleMarker,
    ];
    final fallbackCenter = _resolveFallbackCenter();

    return ServiceMapView(
      controller: _mapController,
      markers: markers,
      fitPoints: <ServiceMapPoint>[
        if (userMarker != null) userMarker.point,
        if (vehicleMarker != null) vehicleMarker.point,
      ],
      fallbackCenter: fallbackCenter,
      initialZoom: 13.2,
      onMapReady: () {
        _markMapReady();
        _syncCameraToLatestState();
      },
    );
  }

  ServiceMapPoint _resolveFallbackCenter() {
    final vehiclePoint = widget.vehiclePoint;
    if (vehiclePoint != null) {
      return ServiceMapPoint(lat: vehiclePoint.lat, lng: vehiclePoint.lng);
    }
    final userPosition = _lastKnownUserPosition;
    if (userPosition != null) {
      return ServiceMapPoint(
        lat: userPosition.latitude,
        lng: userPosition.longitude,
      );
    }
    return const ServiceMapPoint(lat: 40.7731, lng: 29.3739);
  }

  ServiceMapMarkerData? _buildUserMarker() {
    final userPosition = _lastKnownUserPosition;
    if (!widget.showUserLocation ||
        !_locationPermissionGranted ||
        userPosition == null) {
      return null;
    }
    return ServiceMapMarkerData(
      id: 'user',
      point: ServiceMapPoint(
        lat: userPosition.latitude,
        lng: userPosition.longitude,
      ),
      label: 'Konumum',
      icon: Icons.my_location_rounded,
      tone: ServiceMapMarkerTone.user,
      size: 26,
    );
  }

  ServiceMapMarkerData? _buildVehicleMarker() {
    final vehiclePoint = widget.vehiclePoint;
    if (vehiclePoint == null) {
      return null;
    }
    return ServiceMapMarkerData(
      id: 'vehicle',
      point: ServiceMapPoint(lat: vehiclePoint.lat, lng: vehiclePoint.lng),
      label: (widget.showUserLocation && _locationPermissionGranted)
          ? 'Servis'
          : 'Sofor',
      icon: Icons.directions_bus_filled_rounded,
      tone: ServiceMapMarkerTone.vehicle,
    );
  }

  void _markMapReady() {
    if (_mapRenderMetricSent) {
      return;
    }
    _mapRenderMetricSent = true;
    _mapRenderStopwatch.stop();
    MobileTelemetry.instance.trackPerf(
      eventName: MobileEventNames.mapRender,
      durationMs: _mapRenderStopwatch.elapsedMilliseconds,
      attributes: <String, Object?>{
        'screen': 'passenger_tracking',
        'mode': 'service_map_loaded',
      },
    );
  }

  Future<void> _requestLocationPermissionIfNeeded() async {
    if (_permissionPromptAttempted || !widget.showUserLocation) {
      return;
    }
    _permissionPromptAttempted = true;
    if (kIsWeb) {
      return;
    }

    PermissionStatus status;
    try {
      status = await Permission.locationWhenInUse.status;
    } catch (_) {
      return;
    }

    if (!status.isGranted && !status.isLimited) {
      try {
        status = await Permission.locationWhenInUse.request();
      } catch (_) {
        return;
      }
    }

    final granted = status.isGranted || status.isLimited;
    if (mounted) {
      setState(() {
        _locationPermissionGranted = granted;
      });
    } else {
      _locationPermissionGranted = granted;
    }

    if (!granted && mounted && !_permissionDeniedSnackShown) {
      _permissionDeniedSnackShown = true;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Konum izni olmadan kendi konumun haritada gosterilemez.',
          ),
        ),
      );
    }
    if (granted && mounted && !_privacySnackShown) {
      _privacySnackShown = true;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Konumun sadece bu cihazda gosterilir, soforle paylasilmaz.',
          ),
        ),
      );
    }
    await _resolveInitialUserLocation();
    if (mounted) {
      setState(() {});
    }
    _syncCameraToLatestState();
  }

  Future<void> _resolveInitialUserLocation() async {
    if (!widget.showUserLocation || !_locationPermissionGranted) {
      return;
    }
    if (_lastKnownUserPosition != null) {
      return;
    }

    Position? position;
    try {
      position = await Geolocator.getLastKnownPosition();
      position ??= await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 4),
      );
    } catch (_) {
      return;
    }
    _lastKnownUserPosition = position;
  }

  void _syncCameraToLatestState() {
    final userPosition = _lastKnownUserPosition;
    if (widget.showUserLocation &&
        _locationPermissionGranted &&
        userPosition != null) {
      _mapController.moveTo(
        ServiceMapPoint(
          lat: userPosition.latitude,
          lng: userPosition.longitude,
        ),
        zoom: 15.2,
      );
      return;
    }
    final vehiclePoint = widget.vehiclePoint;
    if (vehiclePoint != null) {
      _mapController.moveTo(
        ServiceMapPoint(lat: vehiclePoint.lat, lng: vehiclePoint.lng),
        zoom: 14.2,
      );
    }
  }
}


class _PassengerActionDrawer extends StatelessWidget {
  const _PassengerActionDrawer({
    required this.routeName,
    this.onAddServiceTap,
    this.onBackToServicesTap,
    this.onSettingsTap,
    this.onTripaistoryTap,
    this.onSkipTodayTap,
    this.onLeaveRouteTap,
  });

  final String routeName;
  final VoidCallback? onAddServiceTap;
  final VoidCallback? onBackToServicesTap;
  final VoidCallback? onSettingsTap;
  final VoidCallback? onTripaistoryTap;
  final VoidCallback? onSkipTodayTap;
  final VoidCallback? onLeaveRouteTap;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: CoreColors.surface0,
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space16,
                CoreSpacing.space16,
                CoreSpacing.space12,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Yolcu Menusu',
                    style: TextStyle(
                      fontFamily: CoreTypography.headingFamily,
                      fontWeight: FontWeight.w700,
                      fontSize: 20,
                      color: CoreColors.ink900,
                    ),
                  ),
                  const SizedBox(height: CoreSpacing.space4),
                  Text(
                    routeName,
                    style: const TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                      color: CoreColors.ink700,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            if (onAddServiceTap != null)
              _DrawerActionTile(
                icon: Icons.add_rounded,
                label: 'Yeni Servis Ekle',
                onTap: () => _runAction(context, onAddServiceTap),
              ),
            if (onBackToServicesTap != null)
              _DrawerActionTile(
                icon: CoreIconTokens.bus,
                label: 'Servislerim',
                onTap: () => _runAction(context, onBackToServicesTap),
              ),
            if (onSettingsTap != null)
              _DrawerActionTile(
                icon: CoreIconTokens.settings,
                label: 'Yolcu Ayarlari',
                onTap: () => _runAction(context, onSettingsTap),
              ),
            if (onTripaistoryTap != null)
              _DrawerActionTile(
                icon: CoreIconTokens.clock,
                label: 'Sefer Geçmişi',
                onTap: () => _runAction(context, onTripaistoryTap),
              ),
            if (onSkipTodayTap != null)
              _DrawerActionTile(
                icon: CoreIconTokens.skipToday,
                label: 'Bugün Binmiyorum',
                onTap: () => _runAction(context, onSkipTodayTap),
              ),
            if (onLeaveRouteTap != null)
              _DrawerActionTile(
                icon: CoreIconTokens.signOut,
                label: 'Rotadan Ayrıl',
                onTap: () => _runAction(context, onLeaveRouteTap),
              ),
          ],
        ),
      ),
    );
  }

  void _runAction(BuildContext context, VoidCallback? callback) {
    Navigator.of(context).pop();
    callback?.call();
  }
}

class _DrawerActionTile extends StatelessWidget {
  const _DrawerActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: CoreColors.ink900),
      title: Text(
        label,
        style: const TextStyle(
          fontFamily: CoreTypography.bodyFamily,
          fontWeight: FontWeight.w600,
          fontSize: 15,
          color: CoreColors.ink900,
        ),
      ),
      onTap: onTap,
    );
  }
}

/// Transparent top bar with route name and connection status.
class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.routeName,
    required this.freshness,
    this.offlineBannerLabel,
    this.latencyIndicatorLabel,
    this.onMenuTap,
    this.onSettingsTap,
    this.onSkipTodayTap,
    this.onLeaveRouteTap,
  });
  final String routeName;
  final LocationFreshness freshness;
  final String? offlineBannerLabel;
  final String? latencyIndicatorLabel;
  final VoidCallback? onMenuTap;
  final VoidCallback? onSettingsTap;
  final VoidCallback? onSkipTodayTap;
  final VoidCallback? onLeaveRouteTap;
  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final hasActionMenu = onSettingsTap != null ||
        onSkipTodayTap != null ||
        onLeaveRouteTap != null;
    return Container(
      padding: EdgeInsets.only(
        top: topPadding + CoreSpacing.space8,
        left: CoreSpacing.space16,
        right: CoreSpacing.space16,
        bottom: CoreSpacing.space12,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[
            CoreColors.scrim700,
            Color(0x000A1411),
          ],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              if (onMenuTap != null) ...<Widget>[
                Tooltip(
                  message: 'Menu',
                  child: IconButton(
                    onPressed: onMenuTap,
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0x1FFFFFFF),
                      foregroundColor: CoreColors.surface0,
                    ),
                    icon: const Icon(Icons.menu_rounded),
                  ),
                ),
                const SizedBox(width: 4),
              ],
              Expanded(
                child: Text(
                  routeName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: CoreTypography.headingFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: CoreColors.surface0,
                  ),
                ),
              ),
              CoreStatusChip(
                label: _freshnessLabel(freshness),
                tone: _freshnessTone(freshness),
                compact: true,
              ),
              if (hasActionMenu) ...<Widget>[
                const SizedBox(width: CoreSpacing.space8),
                PopupMenuButton<_TopBarAction>(
                  tooltip: 'Islemler',
                  icon: const Icon(Icons.more_horiz_rounded),
                  color: CoreColors.surface0,
                  onSelected: (action) {
                    switch (action) {
                      case _TopBarAction.settings:
                        onSettingsTap?.call();
                      case _TopBarAction.skipToday:
                        onSkipTodayTap?.call();
                      case _TopBarAction.leaveRoute:
                        onLeaveRouteTap?.call();
                    }
                  },
                  itemBuilder: (context) => <PopupMenuEntry<_TopBarAction>>[
                    if (onSettingsTap != null)
                      const PopupMenuItem<_TopBarAction>(
                        value: _TopBarAction.settings,
                        child: Text('Yolcu Ayarlari'),
                      ),
                    if (onSkipTodayTap != null)
                      const PopupMenuItem<_TopBarAction>(
                        value: _TopBarAction.skipToday,
                        child: Text('Bugün Binmiyorum'),
                      ),
                    if (onLeaveRouteTap != null)
                      const PopupMenuItem<_TopBarAction>(
                        value: _TopBarAction.leaveRoute,
                        child: Text('Rotadan Ayrıl'),
                      ),
                  ],
                ),
              ],
            ],
          ),
          if (latencyIndicatorLabel != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            Align(
              alignment: Alignment.centerRight,
              child: _ConnectionLatencyPill(label: latencyIndicatorLabel!),
            ),
          ],
          if (offlineBannerLabel != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            _PassengerOfflineBanner(
              label: offlineBannerLabel!,
            ),
          ],
        ],
      ),
    );
  }

  String _freshnessLabel(LocationFreshness freshness) {
    return switch (freshness) {
      LocationFreshness.live => 'Canlı',
      LocationFreshness.mild => 'Gecikme',
      LocationFreshness.stale => 'Eski veri',
      LocationFreshness.lost => 'Baglanti yok',
    };
  }

  CoreStatusChipTone _freshnessTone(LocationFreshness freshness) {
    return switch (freshness) {
      LocationFreshness.live => CoreStatusChipTone.green,
      LocationFreshness.mild => CoreStatusChipTone.yellow,
      LocationFreshness.stale => CoreStatusChipTone.orange,
      LocationFreshness.lost => CoreStatusChipTone.red,
    };
  }
}

class _ConnectionLatencyPill extends StatelessWidget {
  const _ConnectionLatencyPill({
    required this.label,
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 220),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: CoreSpacing.space8,
          vertical: CoreSpacing.space8,
        ),
        decoration: BoxDecoration(
          color: CoreColors.ink900.withAlpha(220),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontFamily: CoreTypography.bodyFamily,
            fontWeight: FontWeight.w600,
            fontSize: 11,
            color: CoreColors.surface0,
          ),
        ),
      ),
    );
  }
}

enum _TopBarAction {
  settings,
  skipToday,
  leaveRoute,
}

class _PassengerOfflineBanner extends StatelessWidget {
  const _PassengerOfflineBanner({
    required this.label,
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space12,
        vertical: CoreSpacing.space8,
      ),
      decoration: BoxDecoration(
        color: CoreColors.danger.withAlpha(32),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: CoreColors.danger.withAlpha(120),
        ),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontFamily: CoreTypography.bodyFamily,
          fontWeight: FontWeight.w600,
          fontSize: 12,
          color: CoreColors.ink900,
        ),
      ),
    );
  }
}

/// Renders PassengerMapSheet as a fixed bottom panel (non-draggable).
class _PassengerFixedSheet extends StatelessWidget {
  const _PassengerFixedSheet({
    required this.routeName,
    this.estimatedMinutes,
    this.etaSourceLabel,
    this.lastEtaSourceLabel,
    required this.freshness,
    this.lastSeenAgo,
    this.driverNote,
    required this.stops,
    required this.isLate,
    this.scheduledTime,
    this.morningReminderNote,
    this.vacationModeNote,
    this.driverSnapshot,
    this.isSoftLockMode = false,
    this.onKeepNotificationsTap,
    this.onBackToServicesTap,
    this.onSkipTodayTap,
    this.onMessageDriverTap,
  });

  final String routeName;
  final int? estimatedMinutes;
  final String? etaSourceLabel;
  final String? lastEtaSourceLabel;
  final LocationFreshness freshness;
  final String? lastSeenAgo;
  final String? driverNote;
  final List<PassengerStopInfo> stops;
  final bool isLate;
  final String? scheduledTime;
  final String? morningReminderNote;
  final String? vacationModeNote;
  final PassengerDriverSnapshotInfo? driverSnapshot;
  final bool isSoftLockMode;
  final VoidCallback? onKeepNotificationsTap;
  final VoidCallback? onBackToServicesTap;
  final VoidCallback? onSkipTodayTap;
  final VoidCallback? onMessageDriverTap;

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final safeTop = mediaQuery.padding.top;
    final screenaeight = mediaQuery.size.height;
    final maxAllowed = screenaeight - safeTop - 92;
    final candidate = screenaeight * 0.46;
    final panelaeight = math.max(
      280.0,
      math.min(candidate, maxAllowed),
    );

    return Align(
      alignment: Alignment.bottomCenter,
      child: SizedBox(
        height: panelaeight,
        width: double.infinity,
        child: SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          child: PassengerMapSheet(
            routeName: routeName,
            estimatedMinutes: estimatedMinutes,
            etaSourceLabel: etaSourceLabel,
            lastEtaSourceLabel: lastEtaSourceLabel,
            freshness: freshness,
            lastSeenAgo: lastSeenAgo,
            driverNote: driverNote,
            stops: stops,
            isLate: isLate,
            scheduledTime: scheduledTime,
            morningReminderNote: morningReminderNote,
            vacationModeNote: vacationModeNote,
            driverSnapshot: driverSnapshot,
            isSoftLockMode: isSoftLockMode,
            onKeepNotificationsTap: onKeepNotificationsTap,
            onBackToServicesTap: onBackToServicesTap,
            onSkipTodayTap: onSkipTodayTap,
            onMessageDriverTap: onMessageDriverTap,
          ),
        ),
      ),
    );
  }
}
