import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;

import '../tokens/core_colors.dart';
import '../tokens/core_elevations.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';
import '../tokens/icon_tokens.dart';
import 'driver_trips_models.dart';

class DriverMapStopInfo {
  const DriverMapStopInfo({
    required this.stopId,
    required this.name,
    required this.order,
    this.passengersWaiting,
  });

  final String stopId;
  final String name;
  final int order;
  final int? passengersWaiting;
}

enum _DriverHomeBottomTab {
  stops,
  trips,
}

class DriverMapHomeScreen extends StatefulWidget {
  const DriverMapHomeScreen({
    super.key,
    required this.appName,
    required this.routeName,
    this.driverDisplayName,
    this.driverPhotoUrl,
    this.mapboxPublicToken,
    this.stops = const <DriverMapStopInfo>[],
    this.myTrips = const <DriverTripListItem>[],
    this.loadMyTrips,
    this.initialPreviewRouteId,
    this.initialStartedRouteId,
    this.queuedPassengerCount,
    this.onStartTripTap,
    this.onMyTripsTap,
    this.onTripDetailTap,
    this.onManageRouteTap,
    this.onAnnouncementTap,
    this.onTripHistoryTap,
    this.onSettingsTap,
    this.onProfileSetupTap,
    this.onSubscriptionTap,
    this.onSignOutTap,
  });

  final String appName;
  final String routeName;
  final String? driverDisplayName;
  final String? driverPhotoUrl;
  final String? mapboxPublicToken;
  final List<DriverMapStopInfo> stops;
  final List<DriverTripListItem> myTrips;
  final Future<List<DriverTripListItem>> Function()? loadMyTrips;
  final String? initialPreviewRouteId;
  final String? initialStartedRouteId;
  final int? queuedPassengerCount;
  final VoidCallback? onStartTripTap;
  final Future<void> Function()? onMyTripsTap;
  final ValueChanged<DriverTripListItem>? onTripDetailTap;
  final VoidCallback? onManageRouteTap;
  final VoidCallback? onAnnouncementTap;
  final VoidCallback? onTripHistoryTap;
  final VoidCallback? onSettingsTap;
  final VoidCallback? onProfileSetupTap;
  final VoidCallback? onSubscriptionTap;
  final Future<void> Function()? onSignOutTap;

  @override
  State<DriverMapHomeScreen> createState() => _DriverMapHomeScreenState();
}

class _DriverMapHomeScreenState extends State<DriverMapHomeScreen> {
  final GlobalKey<_DriverMapShellState> _mapShellKey =
      GlobalKey<_DriverMapShellState>();
  final GlobalKey _bottomSheetKey = GlobalKey();
  _DriverHomeBottomTab _activeBottomTab = _DriverHomeBottomTab.stops;
  DriverTripListItem? _selectedTripPreview;
  List<DriverTripListItem> _homeTrips = const <DriverTripListItem>[];
  bool _tripRefreshInFlight = false;
  String? _recentlyStartedRouteId;
  double _bottomSheetRenderedHeight = 260;

  @override
  void initState() {
    super.initState();
    _homeTrips = widget.myTrips;
    _recentlyStartedRouteId = _normalizeRouteId(widget.initialStartedRouteId);
    _applyInitialTripPreviewSelection();
    unawaited(_refreshHomeTrips(force: _homeTrips.isEmpty));
  }

  @override
  void didUpdateWidget(covariant DriverMapHomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final previewRouteChanged =
        oldWidget.initialPreviewRouteId != widget.initialPreviewRouteId;
    final startedRouteChanged =
        oldWidget.initialStartedRouteId != widget.initialStartedRouteId;
    final tripsChanged = !listEquals(oldWidget.myTrips, widget.myTrips);
    if (tripsChanged) {
      final shouldAdoptWidgetTrips =
          widget.myTrips.isNotEmpty || _homeTrips.isEmpty;
      if (shouldAdoptWidgetTrips) {
        _homeTrips = widget.myTrips;
      }
    }
    if (previewRouteChanged || tripsChanged) {
      _applyInitialTripPreviewSelection();
    }
    if (startedRouteChanged) {
      final startedRouteId = _normalizeRouteId(widget.initialStartedRouteId);
      if (startedRouteId != null) {
        _recentlyStartedRouteId = startedRouteId;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const double sheetMinChildSize = 0.28;
    const double sheetInitialChildSize = 0.42;
    const double sheetMaxChildSize = 0.92;
    final hasDrawerActions = widget.onStartTripTap != null ||
        widget.onMyTripsTap != null ||
        widget.onManageRouteTap != null ||
        widget.onAnnouncementTap != null ||
        widget.onTripHistoryTap != null ||
        widget.onSettingsTap != null ||
        widget.onProfileSetupTap != null ||
        widget.onSubscriptionTap != null ||
        widget.onSignOutTap != null;
    final nextStopName =
        widget.stops.isEmpty ? 'Durak bekleniyor' : widget.stops.first.name;
    final heading = widget.queuedPassengerCount == null
        ? 'Sıradaki Durak: $nextStopName'
        : 'Sıradaki Yolcu: ${widget.queuedPassengerCount} Kişi';
    final mediaQuery = MediaQuery.of(context);
    final screenHeight = mediaQuery.size.height;
    _scheduleBottomSheetHeightSync();
    final sheetOffsetForButton = _bottomSheetRenderedHeight > 0
        ? _bottomSheetRenderedHeight
        : screenHeight * sheetInitialChildSize;
    final maxButtonBottom = (screenHeight - mediaQuery.padding.top - 104)
        .clamp(CoreSpacing.space16, double.infinity);
    final locationButtonBottom =
        (sheetOffsetForButton + CoreSpacing.space16).clamp(
      CoreSpacing.space16,
      maxButtonBottom,
    );
    return Scaffold(
      drawer: hasDrawerActions
          ? _DriverDrawer(
              routeName: widget.routeName,
              driverDisplayName: widget.driverDisplayName,
              driverPhotoUrl: widget.driverPhotoUrl,
              onStartTripTap: widget.onStartTripTap,
              onMyTripsTap: _handleOpenMyTripsScreen,
              onManageRouteTap: widget.onManageRouteTap,
              onAnnouncementTap: widget.onAnnouncementTap,
              onTripHistoryTap: widget.onTripHistoryTap,
              onSettingsTap: widget.onSettingsTap,
              onProfileSetupTap: widget.onProfileSetupTap,
              onSubscriptionTap: widget.onSubscriptionTap,
              onSignOutTap: widget.onSignOutTap,
            )
          : null,
      body: Builder(
        builder: (scaffoldContext) {
          return Stack(
            children: <Widget>[
              Positioned.fill(
                child: _DriverMapShell(
                  key: _mapShellKey,
                  mapboxPublicToken: widget.mapboxPublicToken,
                  selectedTripPreview: _selectedTripPreview,
                ),
              ),
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: _TopOverlay(
                  appName: widget.appName,
                  routeName: widget.routeName,
                  nextStopName: nextStopName,
                  onMenuTap: hasDrawerActions
                      ? () => Scaffold.of(scaffoldContext).openDrawer()
                      : null,
                ),
              ),
              Positioned(
                right: CoreSpacing.space16,
                bottom: locationButtonBottom.toDouble(),
                child: _MapActionButton(
                  icon: Icons.my_location_rounded,
                  onTap: () {
                    final recenterFuture =
                        _mapShellKey.currentState?.recenterOnUserLocation();
                    if (recenterFuture != null) {
                      unawaited(recenterFuture);
                    }
                  },
                ),
              ),
              Positioned.fill(
                child: NotificationListener<DraggableScrollableNotification>(
                  onNotification: (notification) {
                    final nextHeight = screenHeight * notification.extent;
                    if ((nextHeight - _bottomSheetRenderedHeight).abs() < 1) {
                      return false;
                    }
                    setState(() {
                      _bottomSheetRenderedHeight = nextHeight;
                    });
                    return false;
                  },
                  child: DraggableScrollableSheet(
                    expand: false,
                    minChildSize: sheetMinChildSize,
                    initialChildSize: sheetInitialChildSize,
                    maxChildSize: sheetMaxChildSize,
                    builder: (context, scrollController) {
                      return Container(
                        key: _bottomSheetKey,
                        decoration: const BoxDecoration(
                          color: CoreColors.surface0,
                          borderRadius:
                              BorderRadius.vertical(top: Radius.circular(28)),
                          boxShadow: CoreElevations.shadowLevel2,
                        ),
                        child: SafeArea(
                          top: false,
                          child: SingleChildScrollView(
                            controller: scrollController,
                            padding: const EdgeInsets.fromLTRB(
                              CoreSpacing.space16,
                              CoreSpacing.space12,
                              CoreSpacing.space16,
                              CoreSpacing.space16,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Center(
                                  child: Container(
                                    width: 44,
                                    height: 4,
                                    decoration: BoxDecoration(
                                      color: CoreColors.line200,
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: CoreSpacing.space16),
                                _DriverHomeBottomTabs(
                                  activeTab: _activeBottomTab,
                                  onTabChanged: (tab) {
                                    setState(() {
                                      _activeBottomTab = tab;
                                    });
                                    if (tab == _DriverHomeBottomTab.trips) {
                                      unawaited(_refreshHomeTrips(force: true));
                                    }
                                  },
                                ),
                                const SizedBox(height: CoreSpacing.space12),
                                if (_activeBottomTab ==
                                    _DriverHomeBottomTab.stops)
                                  ..._buildStopsBottomSheetContent(heading)
                                else
                                  _DriverTripsQuickPanel(
                                    routeName: widget.routeName,
                                    queuedPassengerCount:
                                        widget.queuedPassengerCount,
                                    stopCount: widget.stops.length,
                                    trips: _homeTrips,
                                    recentlyStartedRouteId:
                                        _recentlyStartedRouteId,
                                    selectedPreviewRouteId:
                                        _selectedTripPreview?.routeId,
                                    onPreviewTripTap:
                                        _handlePreviewTripOnHomeMap,
                                    onOpenTripTap: widget.onTripDetailTap,
                                    onManageRouteTap: widget.onManageRouteTap,
                                    onAnnouncementTap: widget.onAnnouncementTap,
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _handlePreviewTripOnHomeMap(DriverTripListItem trip) {
    setState(() {
      _selectedTripPreview = trip;
    });
    final previewFuture = _mapShellKey.currentState?.focusTripPreview();
    if (previewFuture != null) {
      unawaited(previewFuture);
    }
  }

  void _applyInitialTripPreviewSelection() {
    final desiredRouteId = widget.initialPreviewRouteId?.trim() ?? '';
    if (desiredRouteId.isEmpty || _homeTrips.isEmpty) {
      return;
    }
    DriverTripListItem? matchedTrip;
    for (final item in _homeTrips) {
      if (item.routeId == desiredRouteId) {
        matchedTrip = item;
        break;
      }
    }
    if (matchedTrip == null) {
      return;
    }
    final current = _selectedTripPreview;
    if (current != null &&
        current.routeId == matchedTrip.routeId &&
        current.tripId == matchedTrip.tripId) {
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _activeBottomTab = _DriverHomeBottomTab.trips;
        _selectedTripPreview = matchedTrip;
      });
      final previewFuture = _mapShellKey.currentState?.focusTripPreview();
      if (previewFuture != null) {
        unawaited(previewFuture);
      }
    });
  }

  Future<void> _refreshHomeTrips({required bool force}) async {
    final loader = widget.loadMyTrips;
    if (loader == null) {
      return;
    }
    if (_tripRefreshInFlight) {
      return;
    }
    if (!force && _homeTrips.isNotEmpty) {
      return;
    }
    _tripRefreshInFlight = true;
    try {
      final items = await loader();
      if (!mounted) {
        return;
      }
      if (items.isEmpty && _homeTrips.isNotEmpty) {
        return;
      }
      if (!listEquals(_homeTrips, items)) {
        setState(() {
          _homeTrips = items;
        });
        _applyInitialTripPreviewSelection();
      }
    } catch (_) {
      // Non-blocking: home quick panel can keep last known list.
    } finally {
      _tripRefreshInFlight = false;
    }
  }

  Future<void> _handleOpenMyTripsScreen() async {
    final openMyTrips = widget.onMyTripsTap;
    if (openMyTrips == null) {
      return;
    }
    await openMyTrips();
    if (!mounted) {
      return;
    }
    await _refreshHomeTrips(force: true);
  }

  String? _normalizeRouteId(String? value) {
    final normalized = value?.trim();
    if (normalized == null || normalized.isEmpty) {
      return null;
    }
    return normalized;
  }

  void _scheduleBottomSheetHeightSync() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      final measuredHeight = _bottomSheetKey.currentContext?.size?.height;
      if (measuredHeight == null) {
        return;
      }
      if ((measuredHeight - _bottomSheetRenderedHeight).abs() < 1) {
        return;
      }
      setState(() {
        _bottomSheetRenderedHeight = measuredHeight;
      });
    });
  }

  List<Widget> _buildStopsBottomSheetContent(String heading) {
    return <Widget>[
      Text(
        heading,
        style: const TextStyle(
          fontFamily: CoreTypography.headingFamily,
          fontWeight: FontWeight.w700,
          fontSize: 20,
          color: CoreColors.ink900,
        ),
      ),
      const SizedBox(height: CoreSpacing.space12),
      const Text(
        'Duraklar',
        style: TextStyle(
          fontFamily: CoreTypography.bodyFamily,
          fontWeight: FontWeight.w700,
          fontSize: 13,
          color: CoreColors.ink700,
        ),
      ),
      const SizedBox(height: CoreSpacing.space8),
      if (widget.stops.isEmpty)
        const Text(
          'Durak girildiginde burada listelenir.',
          style: TextStyle(
            fontFamily: CoreTypography.bodyFamily,
            fontWeight: FontWeight.w500,
            fontSize: 14,
            color: CoreColors.ink700,
          ),
        )
      else
        ...widget.stops.map(
          (stop) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: <Widget>[
                Container(
                  width: stop == widget.stops.first ? 14 : 10,
                  height: stop == widget.stops.first ? 14 : 10,
                  decoration: BoxDecoration(
                    color: stop == widget.stops.first
                        ? CoreColors.amber500
                        : const Color(0xFFC3CFDA),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    stop.name,
                    style: TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: stop == widget.stops.first
                          ? FontWeight.w700
                          : FontWeight.w600,
                      fontSize: 16,
                      color: stop == widget.stops.first
                          ? CoreColors.ink900
                          : const Color(0xFF8F9AA8),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
    ];
  }
}

class _DriverMapShell extends StatefulWidget {
  const _DriverMapShell({
    super.key,
    required this.mapboxPublicToken,
    this.selectedTripPreview,
  });

  final String? mapboxPublicToken;
  final DriverTripListItem? selectedTripPreview;

  @override
  State<_DriverMapShell> createState() => _DriverMapShellState();
}

class _DriverMapShellState extends State<_DriverMapShell> {
  gmaps.GoogleMapController? _mapController;
  Position? _resolvedUserPosition;
  bool _permissionPromptAttempted = false;
  bool _locationPermissionGranted = false;
  bool _initialCameraCenteredOnUser = false;
  bool _locationResolveInFlight = false;

  bool get _hasApiKeyHint =>
      widget.mapboxPublicToken?.trim().isNotEmpty == true;

  bool get _isMobile =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  @override
  void initState() {
    super.initState();
    unawaited(_resolveUserLocationAndCenterIfPossible());
  }

  @override
  void didUpdateWidget(covariant _DriverMapShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    final previous = oldWidget.selectedTripPreview;
    final next = widget.selectedTripPreview;
    final changed = previous?.routeId != next?.routeId ||
        previous?.tripId != next?.tripId ||
        previous?.routePolylineEncoded != next?.routePolylineEncoded;
    if (changed && next != null) {
      unawaited(focusTripPreview());
    }
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isMobile || !_hasApiKeyHint) {
      return Container(color: const Color(0xFFE0E9EE));
    }
    return gmaps.GoogleMap(
      initialCameraPosition: _initialCameraPosition(),
      zoomControlsEnabled: false,
      myLocationButtonEnabled: false,
      myLocationEnabled: _locationPermissionGranted,
      mapToolbarEnabled: false,
      compassEnabled: false,
      markers: _buildPreviewMarkers(),
      polylines: _buildPreviewPolylines(),
      onMapCreated: _onMapCreated,
    );
  }

  gmaps.CameraPosition _initialCameraPosition() {
    final userPosition = _resolvedUserPosition;
    if (userPosition != null) {
      return gmaps.CameraPosition(
        target: gmaps.LatLng(userPosition.latitude, userPosition.longitude),
        zoom: 15.2,
        bearing: 0,
        tilt: 18,
      );
    }
    return const gmaps.CameraPosition(
      target: gmaps.LatLng(41.0082, 28.9784),
      zoom: 11.6,
      bearing: 0,
      tilt: 24,
    );
  }

  void _onMapCreated(gmaps.GoogleMapController controller) {
    _mapController = controller;
    unawaited(_centerOnUserIfReady());
    unawaited(_resolveUserLocationAndCenterIfPossible());
  }

  Future<void> recenterOnUserLocation() async {
    await _resolveUserLocationAndCenterIfPossible(
      forceRefreshPosition: true,
      forceCenter: true,
    );
  }

  Future<void> focusTripPreview() async {
    final controller = _mapController;
    final preview = widget.selectedTripPreview;
    if (controller == null || preview == null) {
      return;
    }
    final boundsPoints = _previewPolylinePoints(preview);
    if (boundsPoints.isEmpty) {
      return;
    }
    try {
      if (boundsPoints.length == 1) {
        await controller.animateCamera(
          gmaps.CameraUpdate.newLatLngZoom(boundsPoints.first, 13.8),
        );
        return;
      }
      await controller.animateCamera(
        gmaps.CameraUpdate.newLatLngBounds(_buildBounds(boundsPoints), 64),
      );
    } catch (_) {
      // Map channel can be unavailable in tests.
    }
  }

  Future<void> _resolveUserLocationAndCenterIfPossible({
    bool forceRefreshPosition = false,
    bool forceCenter = false,
  }) async {
    if (!_isMobile || !_hasApiKeyHint || _locationResolveInFlight) {
      return;
    }
    if (!forceRefreshPosition &&
        !forceCenter &&
        _resolvedUserPosition != null &&
        _initialCameraCenteredOnUser) {
      return;
    }

    _locationResolveInFlight = true;
    try {
      var permissionGranted = _locationPermissionGranted;
      if (!permissionGranted) {
        permissionGranted = await _ensureLocationPermission();
        if (!permissionGranted) {
          return;
        }
      }

      Position? position = forceRefreshPosition ? null : _resolvedUserPosition;
      if (position == null) {
        try {
          position = await Geolocator.getLastKnownPosition();
          position ??= await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.medium,
            timeLimit: const Duration(seconds: 4),
          );
        } catch (_) {
          position = null;
        }
      }

      if (position == null) {
        return;
      }

      if (mounted) {
        setState(() {
          _resolvedUserPosition = position;
          _locationPermissionGranted = true;
        });
      } else {
        _resolvedUserPosition = position;
        _locationPermissionGranted = true;
      }
      await _centerOnUserIfReady(force: forceCenter);
    } finally {
      _locationResolveInFlight = false;
    }
  }

  Future<bool> _ensureLocationPermission() async {
    if (!_isMobile) {
      return false;
    }
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return false;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied &&
          !_permissionPromptAttempted) {
        _permissionPromptAttempted = true;
        permission = await Geolocator.requestPermission();
      }
      final granted = permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
      if (mounted) {
        setState(() {
          _locationPermissionGranted = granted;
        });
      } else {
        _locationPermissionGranted = granted;
      }
      return granted;
    } catch (_) {
      return false;
    }
  }

  Future<void> _centerOnUserIfReady({bool force = false}) async {
    if (_initialCameraCenteredOnUser && !force) {
      return;
    }
    final controller = _mapController;
    final userPosition = _resolvedUserPosition;
    if (controller == null || userPosition == null) {
      return;
    }
    try {
      await controller.animateCamera(
        gmaps.CameraUpdate.newCameraPosition(
          gmaps.CameraPosition(
            target: gmaps.LatLng(userPosition.latitude, userPosition.longitude),
            zoom: 15.2,
            bearing: 0,
            tilt: 18,
          ),
        ),
      );
      _initialCameraCenteredOnUser = true;
    } catch (_) {
      // Plugin channels can be unavailable in widget tests.
    }
  }

  Set<gmaps.Marker> _buildPreviewMarkers() {
    final preview = widget.selectedTripPreview;
    final start = preview?.startPoint;
    final end = preview?.endPoint;
    if (preview == null ||
        start == null ||
        end == null ||
        !_isValidMapCoordinate(start.lat, start.lng) ||
        !_isValidMapCoordinate(end.lat, end.lng)) {
      return const <gmaps.Marker>{};
    }
    return <gmaps.Marker>{
      gmaps.Marker(
        markerId: const gmaps.MarkerId('home_preview_start'),
        position: gmaps.LatLng(start.lat, start.lng),
        infoWindow: const gmaps.InfoWindow(title: 'Başlangıç'),
        icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
          gmaps.BitmapDescriptor.hueGreen,
        ),
      ),
      gmaps.Marker(
        markerId: const gmaps.MarkerId('home_preview_end'),
        position: gmaps.LatLng(end.lat, end.lng),
        infoWindow: const gmaps.InfoWindow(title: 'Bitiş'),
        icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
          gmaps.BitmapDescriptor.hueRed,
        ),
      ),
    };
  }

  Set<gmaps.Polyline> _buildPreviewPolylines() {
    final preview = widget.selectedTripPreview;
    if (preview == null) {
      return const <gmaps.Polyline>{};
    }
    final points = _previewPolylinePoints(preview);
    if (points.length < 2) {
      return const <gmaps.Polyline>{};
    }
    return <gmaps.Polyline>{
      gmaps.Polyline(
        polylineId: const gmaps.PolylineId('home_preview_route'),
        points: points,
        width: 5,
        color: const Color(0xFFF5A000),
      ),
    };
  }

  List<gmaps.LatLng> _previewPolylinePoints(DriverTripListItem preview) {
    final decoded = _decodePolylineOrNull(preview.routePolylineEncoded);
    if (decoded != null && decoded.length >= 2) {
      return decoded
          .where((point) => _isValidMapCoordinate(point.lat, point.lng))
          .map((point) => gmaps.LatLng(point.lat, point.lng))
          .toList(growable: false);
    }
    final start = preview.startPoint;
    final end = preview.endPoint;
    if (start == null ||
        end == null ||
        !_isValidMapCoordinate(start.lat, start.lng) ||
        !_isValidMapCoordinate(end.lat, end.lng)) {
      return const <gmaps.LatLng>[];
    }
    return <gmaps.LatLng>[
      gmaps.LatLng(start.lat, start.lng),
      gmaps.LatLng(end.lat, end.lng),
    ];
  }

  gmaps.LatLngBounds _buildBounds(List<gmaps.LatLng> points) {
    var minLat = points.first.latitude;
    var maxLat = points.first.latitude;
    var minLng = points.first.longitude;
    var maxLng = points.first.longitude;
    for (final point in points.skip(1)) {
      if (point.latitude < minLat) {
        minLat = point.latitude;
      }
      if (point.latitude > maxLat) {
        maxLat = point.latitude;
      }
      if (point.longitude < minLng) {
        minLng = point.longitude;
      }
      if (point.longitude > maxLng) {
        maxLng = point.longitude;
      }
    }
    if (minLat == maxLat) {
      minLat -= 0.0025;
      maxLat += 0.0025;
    }
    if (minLng == maxLng) {
      minLng -= 0.0025;
      maxLng += 0.0025;
    }
    return gmaps.LatLngBounds(
      southwest: gmaps.LatLng(minLat, minLng),
      northeast: gmaps.LatLng(maxLat, maxLng),
    );
  }

  bool _isValidMapCoordinate(double lat, double lng) {
    if (!lat.isFinite || !lng.isFinite) {
      return false;
    }
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}

class _TopOverlay extends StatelessWidget {
  const _TopOverlay({
    required this.appName,
    required this.routeName,
    required this.nextStopName,
    this.onMenuTap,
  });

  final String appName;
  final String routeName;
  final String nextStopName;
  final VoidCallback? onMenuTap;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
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
          colors: <Color>[CoreColors.scrim700, Color(0x000A1411)],
        ),
      ),
      child: Row(
        children: <Widget>[
          if (onMenuTap != null)
            IconButton(
              tooltip: 'Menü',
              onPressed: onMenuTap,
              style: IconButton.styleFrom(
                backgroundColor: const Color(0x2BFFFFFF),
                foregroundColor: CoreColors.surface0,
              ),
              icon: const Icon(Icons.menu_rounded),
            ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  routeName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: CoreTypography.headingFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 17,
                    color: CoreColors.surface0,
                  ),
                ),
                Text(
                  appName,
                  style: const TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                    color: Color(0xD4FFFFFF),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xEB090909),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              'Sıradaki: $nextStopName',
              style: const TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: CoreColors.surface0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapActionButton extends StatelessWidget {
  const _MapActionButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xE70D0D0D),
      shape: const CircleBorder(),
      elevation: 3,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 62,
          height: 62,
          child: Icon(icon, color: CoreColors.surface0, size: 30),
        ),
      ),
    );
  }
}

class _DriverHomeBottomTabs extends StatelessWidget {
  const _DriverHomeBottomTabs({
    required this.activeTab,
    required this.onTabChanged,
  });

  final _DriverHomeBottomTab activeTab;
  final ValueChanged<_DriverHomeBottomTab> onTabChanged;

  @override
  Widget build(BuildContext context) {
    Widget buildTab({
      required _DriverHomeBottomTab tab,
      required String label,
      required IconData icon,
    }) {
      final selected = activeTab == tab;
      return Expanded(
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => onTabChanged(tab),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
            decoration: BoxDecoration(
              color: selected ? CoreColors.surface0 : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              boxShadow: selected ? CoreElevations.shadowLevel1 : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Icon(
                  icon,
                  size: 18,
                  color: selected ? CoreColors.ink900 : CoreColors.ink700,
                ),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: selected ? CoreColors.ink900 : CoreColors.ink700,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F4F6),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E7EC)),
      ),
      child: Row(
        children: <Widget>[
          buildTab(
            tab: _DriverHomeBottomTab.stops,
            label: 'Duraklar',
            icon: Icons.pin_drop_outlined,
          ),
          buildTab(
            tab: _DriverHomeBottomTab.trips,
            label: 'Seferlerim',
            icon: Icons.route_rounded,
          ),
        ],
      ),
    );
  }
}

class _DriverTripsQuickPanel extends StatelessWidget {
  const _DriverTripsQuickPanel({
    required this.routeName,
    required this.stopCount,
    required this.trips,
    this.recentlyStartedRouteId,
    this.selectedPreviewRouteId,
    this.onPreviewTripTap,
    this.onOpenTripTap,
    this.queuedPassengerCount,
    this.onManageRouteTap,
    this.onAnnouncementTap,
  });

  final String routeName;
  final int stopCount;
  final List<DriverTripListItem> trips;
  final String? recentlyStartedRouteId;
  final String? selectedPreviewRouteId;
  final ValueChanged<DriverTripListItem>? onPreviewTripTap;
  final ValueChanged<DriverTripListItem>? onOpenTripTap;
  final int? queuedPassengerCount;
  final VoidCallback? onManageRouteTap;
  final VoidCallback? onAnnouncementTap;

  @override
  Widget build(BuildContext context) {
    final visibleTrips =
        trips.where((trip) => !trip.isHistory).take(4).toList(growable: false);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const Text(
          'Seferlerim',
          style: TextStyle(
            fontFamily: CoreTypography.headingFamily,
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: CoreColors.ink900,
          ),
        ),
        const SizedBox(height: CoreSpacing.space10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF5F7FA),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E7EC)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                routeName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  color: CoreColors.ink900,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: <Widget>[
                  _QuickBadge(
                    icon: Icons.pin_drop_outlined,
                    label: '$stopCount durak',
                  ),
                  _QuickBadge(
                    icon: Icons.groups_rounded,
                    label: queuedPassengerCount == null
                        ? 'Yolcu bilgisi yok'
                        : '$queuedPassengerCount kişi sırada',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Karta dokununca ana haritada başlangıç-bitiş çizgisi görünür.',
                style: TextStyle(
                  fontFamily: CoreTypography.bodyFamily,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: CoreColors.ink700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (recentlyStartedRouteId != null) ...<Widget>[
          _TripStartedInfoCard(
            routeName: visibleTrips
                    .cast<DriverTripListItem?>()
                    .firstWhere(
                      (trip) => trip?.routeId == recentlyStartedRouteId,
                      orElse: () => null,
                    )
                    ?.routeName ??
                routeName,
          ),
          const SizedBox(height: 12),
        ],
        if (visibleTrips.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E7EC)),
            ),
            child: const Text(
              'Henüz görüntülenecek sefer yok. Rota oluşturunca burada listelenir.',
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: CoreColors.ink700,
              ),
            ),
          )
        else
          ...visibleTrips.map(
            (trip) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _HomeTripListRow(
                trip: trip,
                locallyLive: recentlyStartedRouteId == trip.routeId,
                isSelected: selectedPreviewRouteId == trip.routeId,
                onPreviewTap: onPreviewTripTap == null
                    ? null
                    : () => onPreviewTripTap?.call(trip),
                onOpenTap: onOpenTripTap == null
                    ? null
                    : () => onOpenTripTap?.call(trip),
              ),
            ),
          ),
        const SizedBox(height: 8),
        Row(
          children: <Widget>[
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onManageRouteTap,
                icon: const Icon(Icons.settings_input_component_outlined),
                label: const Text('Rotalar'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onAnnouncementTap,
                icon: const Icon(Icons.campaign_outlined),
                label: const Text('Duyuru'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _HomeTripListRow extends StatelessWidget {
  const _HomeTripListRow({
    required this.trip,
    this.locallyLive = false,
    required this.isSelected,
    this.onPreviewTap,
    this.onOpenTap,
  });

  final DriverTripListItem trip;
  final bool locallyLive;
  final bool isSelected;
  final VoidCallback? onPreviewTap;
  final VoidCallback? onOpenTap;

  @override
  Widget build(BuildContext context) {
    final effectiveStatus = locallyLive && !trip.isHistory
        ? DriverTripCardStatus.live
        : trip.status;
    final statusLabel = switch (effectiveStatus) {
      DriverTripCardStatus.live => 'CANLI',
      DriverTripCardStatus.planned => 'PLANLI',
      DriverTripCardStatus.completed => 'TAMAM',
      DriverTripCardStatus.canceled => 'İPTAL',
    };
    final timeLabel = (trip.scheduledTimeLabel ?? '').trim();
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFFFFF7E8) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? const Color(0xFFF3C46B) : const Color(0xFFE2E7EC),
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onPreviewTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      trip.routeName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: CoreColors.ink900,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    statusLabel,
                    style: TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      color: isSelected
                          ? const Color(0xFF9C6500)
                          : CoreColors.ink700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                timeLabel.isEmpty ? 'Saat belirtilmedi' : 'Saat: $timeLabel',
                style: const TextStyle(
                  fontFamily: CoreTypography.bodyFamily,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                  color: CoreColors.ink700,
                ),
              ),
              if (locallyLive && !trip.isHistory) ...<Widget>[
                const SizedBox(height: 4),
                const Text(
                  'Sefer başlatıldı. Konum yayını aktif kabul edilir.',
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    color: Color(0xFF0E8F46),
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onPreviewTap,
                      child: const Text('Detaya Bak'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: onOpenTap,
                      child: const Text('Tam Detay'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TripStartedInfoCard extends StatelessWidget {
  const _TripStartedInfoCard({required this.routeName});

  final String routeName;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF8EF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBDE3C8)),
      ),
      child: Row(
        children: <Widget>[
          const Icon(
            Icons.play_circle_fill_rounded,
            color: Color(0xFF0E8F46),
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Sefer başlatıldı: $routeName',
              style: const TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: Color(0xFF0E8F46),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickBadge extends StatelessWidget {
  const _QuickBadge({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E6EC)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 16, color: CoreColors.ink900),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              color: CoreColors.ink900,
            ),
          ),
        ],
      ),
    );
  }
}

List<_HomePolylinePoint>? _decodePolylineOrNull(String? encodedRaw) {
  final encoded = encodedRaw?.trim() ?? '';
  if (encoded.isEmpty) {
    return null;
  }
  try {
    final decoded = _decodePolyline1e5(encoded);
    return decoded.isEmpty ? null : decoded;
  } catch (_) {
    return null;
  }
}

List<_HomePolylinePoint> _decodePolyline1e5(String encoded) {
  final points = <_HomePolylinePoint>[];
  var index = 0;
  var lat = 0;
  var lng = 0;
  while (index < encoded.length) {
    final latChunk = _decodePolylineChunk(encoded, index);
    if (latChunk == null) {
      break;
    }
    index = latChunk.nextIndex;
    lat += latChunk.delta;

    final lngChunk = _decodePolylineChunk(encoded, index);
    if (lngChunk == null) {
      break;
    }
    index = lngChunk.nextIndex;
    lng += lngChunk.delta;

    points.add(_HomePolylinePoint(lat: lat / 1e5, lng: lng / 1e5));
  }
  return points;
}

_HomePolylineChunk? _decodePolylineChunk(String encoded, int startIndex) {
  var result = 0;
  var shift = 0;
  var index = startIndex;
  while (index < encoded.length) {
    final byte = encoded.codeUnitAt(index) - 63;
    result |= (byte & 0x1F) << shift;
    shift += 5;
    index++;
    if (byte < 0x20) {
      final delta = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      return _HomePolylineChunk(delta: delta, nextIndex: index);
    }
  }
  return null;
}

class _HomePolylinePoint {
  const _HomePolylinePoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class _HomePolylineChunk {
  const _HomePolylineChunk({
    required this.delta,
    required this.nextIndex,
  });

  final int delta;
  final int nextIndex;
}

class _DriverDrawer extends StatelessWidget {
  const _DriverDrawer({
    required this.routeName,
    this.driverDisplayName,
    this.driverPhotoUrl,
    this.onStartTripTap,
    this.onMyTripsTap,
    this.onManageRouteTap,
    this.onAnnouncementTap,
    this.onTripHistoryTap,
    this.onSettingsTap,
    this.onProfileSetupTap,
    this.onSubscriptionTap,
    this.onSignOutTap,
  });

  final String routeName;
  final String? driverDisplayName;
  final String? driverPhotoUrl;
  final VoidCallback? onStartTripTap;
  final Future<void> Function()? onMyTripsTap;
  final VoidCallback? onManageRouteTap;
  final VoidCallback? onAnnouncementTap;
  final VoidCallback? onTripHistoryTap;
  final VoidCallback? onSettingsTap;
  final VoidCallback? onProfileSetupTap;
  final VoidCallback? onSubscriptionTap;
  final Future<void> Function()? onSignOutTap;

  @override
  Widget build(BuildContext context) {
    final drawerWidth = (MediaQuery.of(context).size.width * 0.78)
        .clamp(280.0, 360.0)
        .toDouble();
    final name = _normalizeDrawerName(driverDisplayName);
    final items = <({String label, IconData icon, VoidCallback? onTap})>[
      (
        label: 'Seferlerim',
        icon: Icons.route_rounded,
        onTap: onMyTripsTap == null ? null : () => unawaited(onMyTripsTap!()),
      ),
      (
        label: 'Rotaları Yönet',
        icon: CoreIconTokens.bus,
        onTap: onManageRouteTap
      ),
      (
        label: 'Sefer Geçmişi',
        icon: CoreIconTokens.clock,
        onTap: onTripHistoryTap
      ),
      (
        label: 'Duyuru Gönder',
        icon: CoreIconTokens.megaphone,
        onTap: onAnnouncementTap
      ),
      (
        label: 'Profil Bilgileri',
        icon: CoreIconTokens.user,
        onTap: onProfileSetupTap
      ),
      (label: 'Ayarlar', icon: CoreIconTokens.settings, onTap: onSettingsTap),
      (
        label: 'Abonelik',
        icon: CoreIconTokens.warning,
        onTap: onSubscriptionTap
      ),
    ];
    return Drawer(
      width: drawerWidth,
      backgroundColor: Colors.transparent,
      elevation: 0,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(28)),
      ),
      child: SafeArea(
        child: Container(
          decoration: const BoxDecoration(
            color: CoreColors.surface0,
            borderRadius: BorderRadius.horizontal(right: Radius.circular(28)),
            boxShadow: CoreElevations.shadowLevel2,
          ),
          child: Column(
            children: <Widget>[
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(
                    CoreSpacing.space16,
                    CoreSpacing.space20,
                    CoreSpacing.space16,
                    CoreSpacing.space12,
                  ),
                  children: <Widget>[
                    _DriverDrawerHeader(
                      name: name,
                      photoUrl: driverPhotoUrl,
                    ),
                    const SizedBox(height: CoreSpacing.space20),
                    for (final item
                        in items.where((item) => item.onTap != null))
                      Padding(
                        padding:
                            const EdgeInsets.only(bottom: CoreSpacing.space10),
                        child: _DriverDrawerMenuItem(
                          icon: item.icon,
                          label: item.label,
                          onTap: () {
                            Navigator.of(context).pop();
                            item.onTap?.call();
                          },
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  CoreSpacing.space16,
                  CoreSpacing.space4,
                  CoreSpacing.space16,
                  CoreSpacing.space16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    if (onSignOutTap != null) ...<Widget>[
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () {
                            Navigator.of(context).pop();
                            unawaited(onSignOutTap!());
                          },
                          child: Ink(
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF1F2),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFFFECACA),
                              ),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: CoreSpacing.space12,
                                vertical: CoreSpacing.space10,
                              ),
                              child: Row(
                                children: <Widget>[
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    alignment: Alignment.center,
                                    child: const Icon(
                                      Icons.logout_rounded,
                                      size: 20,
                                      color: Color(0xFFDC2626),
                                    ),
                                  ),
                                  const SizedBox(width: CoreSpacing.space12),
                                  Expanded(
                                    child: Text(
                                      'Çıkış Yap',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.titleMedium?.copyWith(
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFFDC2626),
                                          ),
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right_rounded,
                                    color: Color(0xFFF87171),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: CoreSpacing.space12),
                    ],
                    Divider(color: Colors.black.withValues(alpha: 0.08), height: 1),
                    const SizedBox(height: CoreSpacing.space12),
                    Row(
                      children: <Widget>[
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 22,
                            height: 22,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(width: CoreSpacing.space8),
                        Expanded(
                          child: Text(
                            'NEREDE SERVİS ŞOFÖR PANELİ',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w700,
                                  color: CoreColors.ink500,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _normalizeDrawerName(String? raw) {
    final value = raw?.trim();
    if (value == null || value.isEmpty) {
      return 'Şoför';
    }
    return value;
  }
}

class _DriverDrawerHeader extends StatelessWidget {
  const _DriverDrawerHeader({
    required this.name,
    this.photoUrl,
  });

  final String name;
  final String? photoUrl;

  @override
  Widget build(BuildContext context) {
    final initials = _initialsFromName(name);
    final normalizedPhotoUrl = photoUrl?.trim();
    final hasPhoto =
        normalizedPhotoUrl != null && normalizedPhotoUrl.isNotEmpty;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: <Widget>[
        Container(
          width: 68,
          height: 68,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
          ),
          child: ClipOval(
            child: hasPhoto
                ? Image.network(
                    normalizedPhotoUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        _DrawerAvatarFallback(initials: initials),
                  )
                : _DrawerAvatarFallback(initials: initials),
          ),
        ),
        const SizedBox(width: CoreSpacing.space12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 4),
              Row(
                children: <Widget>[
                  const Icon(
                    Icons.star_rounded,
                    size: 16,
                    color: Color(0xFFF4B400),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '4.9',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: CoreColors.ink700,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  static String _initialsFromName(String name) {
    final parts = name
        .split(RegExp(r'\s+'))
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .toList(growable: false);
    if (parts.isEmpty) {
      return 'S';
    }
    if (parts.length == 1) {
      return parts.first.substring(0, 1).toUpperCase();
    }
    final first = parts.first.substring(0, 1).toUpperCase();
    final last = parts.last.substring(0, 1).toUpperCase();
    return '$first$last';
  }
}

class _DrawerAvatarFallback extends StatelessWidget {
  const _DrawerAvatarFallback({required this.initials});

  final String initials;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFE7ECEF),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: const Color(0xFF334155),
            ),
      ),
    );
  }
}

class _DriverDrawerMenuItem extends StatelessWidget {
  const _DriverDrawerMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: CoreSpacing.space4,
            vertical: CoreSpacing.space8,
          ),
          child: Row(
            children: <Widget>[
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: const Color(0xFF334155), size: 22),
              ),
              const SizedBox(width: CoreSpacing.space12),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
