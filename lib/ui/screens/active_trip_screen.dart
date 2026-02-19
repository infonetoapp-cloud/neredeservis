import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../../features/location/application/driver_heartbeat_voice_feedback_service.dart';
import '../../features/location/application/voice_feedback_settings_service.dart';
import '../../features/location/infrastructure/mapbox_cache_validation_probe.dart';
import '../components/buttons/amber_slide_to_finish.dart';
import '../components/feedback/amber_snackbars.dart';
import '../components/indicators/amber_heartbeat_indicator.dart';
import '../components/indicators/amber_status_chip.dart';
import '../components/panels/amber_driver_guidance_bar.dart';
import '../tokens/color_tokens.dart';
import '../tokens/elevation_tokens.dart';
import '../tokens/icon_tokens.dart';
import '../tokens/spacing_tokens.dart';
import '../tokens/typography_tokens.dart';

class ActiveTripMapPoint {
  const ActiveTripMapPoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

/// Active trip screen for the driver during a live broadcast.
///
/// Runbook 155 / UI contract:
/// - Map shell (top region) with vehicle + next-stop markers
/// - Connection heartbeat widget (YAYINDASIN + pulse ring)
/// - Driver Guidance Lite: next stop name + crow-fly distance
/// - Slide-to-finish guard for the "Seferi Bitir" destructive action
/// - Heartbeat red → peripheral alarm (red border flash + haptic)
/// - No distracting UI elements. Single decision per screen.
class ActiveTripScreen extends StatefulWidget {
  const ActiveTripScreen({
    super.key,
    this.routeName = 'Darica -> GOSB',
    this.nextStopName = 'GOSB Giris',
    this.crowFlyDistanceMeters = 840,
    this.stopsRemaining = 4,
    this.passengersAtNextStop = 3,
    this.heartbeatState = HeartbeatState.green,
    this.lastHeartbeatAgo = '2 sn',
    this.routePathPoints = const <ActiveTripMapPoint>[],
    this.vehiclePoint,
    this.nextStopPoint,
    this.syncStateLabel,
    this.manualInterventionMessage,
    this.mapboxPublicToken,
    this.onTripFinished,
    this.onEmergencyTap,
  });

  /// Active route display name.
  final String routeName;

  /// Name of the next scheduled stop. Null = all stops done.
  final String? nextStopName;

  /// Crow-fly distance to next stop in meters.
  final int? crowFlyDistanceMeters;

  /// Total remaining stops.
  final int? stopsRemaining;

  /// Passengers waiting at the next stop.
  final int? passengersAtNextStop;

  /// Current connection heartbeat state.
  final HeartbeatState heartbeatState;

  /// Human-readable time since last heartbeat, e.g. `5 sn`.
  final String? lastHeartbeatAgo;

  /// Simplified route line points rendered on the driver map shell.
  final List<ActiveTripMapPoint> routePathPoints;

  /// Current vehicle location point.
  final ActiveTripMapPoint? vehiclePoint;

  /// Next-stop marker location.
  final ActiveTripMapPoint? nextStopPoint;

  /// Optional sync-state label for optimistic actions (e.g. finishTrip pending).
  final String? syncStateLabel;

  /// Optional manual-intervention warning for permanent sync failures.
  final String? manualInterventionMessage;

  /// Public Mapbox token supplied via `--dart-define MAPBOX_PUBLIC_TOKEN=pk...`.
  final String? mapboxPublicToken;

  /// Fires when slide-to-finish confirms trip termination.
  final VoidCallback? onTripFinished;

  /// Fires when the emergency / SOS button is tapped.
  final VoidCallback? onEmergencyTap;

  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _alarmController;
  late Animation<double> _alarmOpacity;
  late final VoiceFeedbackSettingsService _voiceFeedbackSettingsService;
  late final DriverHeartbeatVoiceFeedbackService _voiceFeedbackService;
  Timer? _redAlarmHapticTimer;
  bool _isRedAlarmHapticBurstInFlight = false;

  @override
  void initState() {
    super.initState();
    _alarmController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _alarmOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _alarmController, curve: Curves.easeInOut),
    );
    _voiceFeedbackSettingsService = VoiceFeedbackSettingsService();
    _voiceFeedbackService = DriverHeartbeatVoiceFeedbackService(
      isEnabled: _voiceFeedbackSettingsService.isVoiceAlertEnabled,
    );

    if (widget.heartbeatState == HeartbeatState.red) {
      _startRedAlarmEffects();
    }
  }

  @override
  void didUpdateWidget(covariant ActiveTripScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.heartbeatState != oldWidget.heartbeatState) {
      _handleHeartbeatVoiceFeedback(
        oldState: oldWidget.heartbeatState,
        newState: widget.heartbeatState,
      );
    }
    if (widget.heartbeatState == HeartbeatState.red &&
        oldWidget.heartbeatState != HeartbeatState.red) {
      _startRedAlarmEffects();
    } else if (widget.heartbeatState != HeartbeatState.red &&
        oldWidget.heartbeatState == HeartbeatState.red) {
      _stopRedAlarmEffects();
      _showRecoveryFeedback(widget.heartbeatState);
    }
  }

  @override
  void dispose() {
    _redAlarmHapticTimer?.cancel();
    unawaited(_voiceFeedbackService.dispose());
    _alarmController.dispose();
    super.dispose();
  }

  void _handleHeartbeatVoiceFeedback({
    required HeartbeatState oldState,
    required HeartbeatState newState,
  }) {
    if (newState == HeartbeatState.red) {
      unawaited(
        _voiceFeedbackService.announce(
          DriverHeartbeatVoiceEvent.connectionLost,
        ),
      );
      return;
    }
    if (newState == HeartbeatState.green &&
        (oldState == HeartbeatState.red || oldState == HeartbeatState.yellow)) {
      unawaited(
        _voiceFeedbackService.announce(
          DriverHeartbeatVoiceEvent.connected,
        ),
      );
    }
  }

  void _startRedAlarmEffects() {
    _alarmController.repeat(reverse: true);
    _redAlarmHapticTimer?.cancel();
    unawaited(_triggerRedAlarmHapticBurst());
    _redAlarmHapticTimer = Timer.periodic(
      const Duration(seconds: 3),
      (_) => unawaited(_triggerRedAlarmHapticBurst()),
    );
  }

  void _stopRedAlarmEffects() {
    _redAlarmHapticTimer?.cancel();
    _redAlarmHapticTimer = null;
    _isRedAlarmHapticBurstInFlight = false;
    _alarmController
      ..stop()
      ..reset();
  }

  Future<void> _triggerRedAlarmHapticBurst() async {
    if (_isRedAlarmHapticBurstInFlight ||
        !mounted ||
        widget.heartbeatState != HeartbeatState.red) {
      return;
    }

    _isRedAlarmHapticBurstInFlight = true;
    try {
      await _invokeHaptic(HapticFeedback.heavyImpact);
      await Future<void>.delayed(const Duration(milliseconds: 180));
      if (!mounted || widget.heartbeatState != HeartbeatState.red) {
        return;
      }
      await _invokeHaptic(HapticFeedback.mediumImpact);
      await Future<void>.delayed(const Duration(milliseconds: 180));
      if (!mounted || widget.heartbeatState != HeartbeatState.red) {
        return;
      }
      await _invokeHaptic(HapticFeedback.heavyImpact);
    } finally {
      _isRedAlarmHapticBurstInFlight = false;
    }
  }

  Future<void> _invokeHaptic(Future<void> Function() hapticCall) async {
    try {
      await hapticCall();
    } on MissingPluginException {
      // Platform channel may be unavailable in tests.
    }
  }

  void _showRecoveryFeedback(HeartbeatState recoveredState) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      final tone = recoveredState == HeartbeatState.green
          ? AmberSnackbarTone.success
          : AmberSnackbarTone.warning;
      final message = recoveredState == HeartbeatState.green
          ? 'Baglanti geri geldi.'
          : 'Baglanti iyilesiyor.';
      AmberSnackbars.show(
        context,
        message: message,
        tone: tone,
      );
    });
  }

  void _handleTripFinishConfirmedWithFeedback() {
    unawaited(
      _voiceFeedbackService.announce(
        DriverHeartbeatVoiceEvent.tripEnded,
      ),
    );
    widget.onTripFinished?.call();
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final isCompactDevice = mediaQuery.size.height < 700;

    return Scaffold(
      body: Stack(
        children: <Widget>[
          // Layer 0: Map shell (full screen background)
          Positioned.fill(
            child: _MapShell(
              routeName: widget.routeName,
              nextStopName: widget.nextStopName,
              routePathPoints: widget.routePathPoints,
              vehiclePoint: widget.vehiclePoint,
              nextStopPoint: widget.nextStopPoint,
              mapboxPublicToken: widget.mapboxPublicToken,
            ),
          ),

          // Layer 1: Top safe-area status overlay
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _TopStatusOverlay(
              routeName: widget.routeName,
              stopsRemaining: widget.stopsRemaining,
              heartbeatState: widget.heartbeatState,
              onEmergencyTap: widget.onEmergencyTap,
            ),
          ),

          // Layer 2: Bottom panel (guidance + heartbeat + slide-to-finish)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _BottomControlPanel(
              heartbeatState: widget.heartbeatState,
              lastHeartbeatAgo: widget.lastHeartbeatAgo,
              nextStopName: widget.nextStopName,
              crowFlyDistanceMeters: widget.crowFlyDistanceMeters,
              passengersAtNextStop: widget.passengersAtNextStop,
              syncStateLabel: widget.syncStateLabel,
              manualInterventionMessage: widget.manualInterventionMessage,
              onTripFinished: widget.onTripFinished == null
                  ? null
                  : _handleTripFinishConfirmedWithFeedback,
              isCompactDevice: isCompactDevice,
            ),
          ),

          // Layer 3: Red alarm border (connection lost)
          if (widget.heartbeatState == HeartbeatState.red)
            Positioned.fill(
              child: IgnorePointer(
                child: AnimatedBuilder(
                  animation: _alarmOpacity,
                  builder: (context, _) {
                    return Container(
                      key: const Key('active_trip_red_alarm_border'),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AmberColorTokens.danger
                              .withAlpha((_alarmOpacity.value * 120).round()),
                          width: 4,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// --- Internal Widgets ---

mapbox.GesturesSettings buildDriverLockedGesturesSettings() {
  return mapbox.GesturesSettings(
    rotateEnabled: false,
    pinchToZoomEnabled: false,
    scrollEnabled: false,
    simultaneousRotateAndPinchToZoomEnabled: false,
    pitchEnabled: false,
    doubleTapToZoomInEnabled: false,
    doubleTouchToZoomOutEnabled: false,
    quickZoomEnabled: false,
    pinchPanEnabled: false,
    pinchToZoomDecelerationEnabled: false,
    rotateDecelerationEnabled: false,
    scrollDecelerationEnabled: false,
  );
}

/// Driver map shell. Uses Mapbox on supported mobile runtime with token,
/// and falls back to the placeholder shell in unsupported/missing-token cases.
class _MapShell extends StatefulWidget {
  const _MapShell({
    this.routeName,
    this.nextStopName,
    this.routePathPoints = const <ActiveTripMapPoint>[],
    this.vehiclePoint,
    this.nextStopPoint,
    this.mapboxPublicToken,
  });

  final String? routeName;
  final String? nextStopName;
  final List<ActiveTripMapPoint> routePathPoints;
  final ActiveTripMapPoint? vehiclePoint;
  final ActiveTripMapPoint? nextStopPoint;
  final String? mapboxPublicToken;

  @override
  State<_MapShell> createState() => _MapShellState();
}

class _MapShellState extends State<_MapShell> {
  mapbox.MapboxMap? _mapboxMap;
  mapbox.PolylineAnnotationManager? _routeLineManager;
  mapbox.CircleAnnotationManager? _markerManager;
  bool _syncInProgress = false;
  late final MapboxCacheValidationProbe _cacheValidationProbe;

  bool get _isMobilePlatform {
    return !kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS);
  }

  bool get _hasToken {
    final token = widget.mapboxPublicToken?.trim();
    return token != null && token.isNotEmpty;
  }

  @override
  void initState() {
    super.initState();
    _cacheValidationProbe = MapboxCacheValidationProbe(
      mapKey: 'driver_active_trip',
    );
  }

  @override
  void didUpdateWidget(covariant _MapShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_hasToken || !_isMobilePlatform) {
      return;
    }
    unawaited(_syncMapContentIfReady());
  }

  @override
  void dispose() {
    unawaited(_teardownAnnotationManagers());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isMobilePlatform) {
      return _DriverMapPlaceholderShell(
        routeName: widget.routeName,
        nextStopName: widget.nextStopName,
        routePathPoints: widget.routePathPoints,
        vehiclePoint: widget.vehiclePoint,
        nextStopPoint: widget.nextStopPoint,
        infoLabel: 'Mapbox yalnizca Android/iOS destekler.',
      );
    }
    if (!_hasToken) {
      return _DriverMapPlaceholderShell(
        routeName: widget.routeName,
        nextStopName: widget.nextStopName,
        routePathPoints: widget.routePathPoints,
        vehiclePoint: widget.vehiclePoint,
        nextStopPoint: widget.nextStopPoint,
        infoLabel: 'MAPBOX_PUBLIC_TOKEN tanimli degil.',
      );
    }

    return mapbox.MapWidget(
      styleUri: mapbox.MapboxStyles.STANDARD,
      cameraOptions: _initialCameraOptions(),
      onMapCreated: _onMapCreated,
      onMapLoadedListener: _onMapLoadedListener,
      onResourceRequestListener: _onResourceRequestListener,
    );
  }

  Future<void> _onMapCreated(mapbox.MapboxMap mapboxMap) async {
    _mapboxMap = mapboxMap;
    await _configureDriverMapMode(mapboxMap);
    await _ensureAnnotationManagers(mapboxMap);
    await _syncMapContentIfReady();
  }

  void _onMapLoadedListener(mapbox.MapLoadedEventData eventData) {
    _cacheValidationProbe.onMapboxMapLoaded(eventData);
  }

  void _onResourceRequestListener(mapbox.ResourceEventData eventData) {
    _cacheValidationProbe.onMapboxResourceEvent(eventData);
  }

  Future<void> _configureDriverMapMode(mapbox.MapboxMap mapboxMap) async {
    try {
      await mapboxMap.gestures
          .updateSettings(buildDriverLockedGesturesSettings());
      await mapboxMap.compass.updateSettings(
        mapbox.CompassSettings(
          enabled: false,
          visibility: false,
        ),
      );
      await mapboxMap.scaleBar.updateSettings(
        mapbox.ScaleBarSettings(enabled: false),
      );
    } catch (_) {
      debugPrint('Driver map mode configuration skipped.');
    }
  }

  Future<void> _ensureAnnotationManagers(mapbox.MapboxMap mapboxMap) async {
    _routeLineManager ??=
        await mapboxMap.annotations.createPolylineAnnotationManager();
    _markerManager ??=
        await mapboxMap.annotations.createCircleAnnotationManager();
  }

  Future<void> _syncMapContentIfReady() async {
    if (_syncInProgress) {
      return;
    }
    final mapboxMap = _mapboxMap;
    final routeLineManager = _routeLineManager;
    final markerManager = _markerManager;
    if (mapboxMap == null ||
        routeLineManager == null ||
        markerManager == null) {
      return;
    }

    _syncInProgress = true;
    try {
      await routeLineManager.deleteAll();
      await markerManager.deleteAll();

      final routeCoordinates = widget.routePathPoints
          .map((point) => mapbox.Position(point.lng, point.lat))
          .toList(growable: false);
      if (routeCoordinates.length >= 2) {
        await routeLineManager.create(
          mapbox.PolylineAnnotationOptions(
            geometry: mapbox.LineString(coordinates: routeCoordinates),
            lineColor: AmberColorTokens.amber500.toARGB32(),
            lineWidth: 4.0,
            lineOpacity: 0.9,
          ),
        );
      }

      if (widget.vehiclePoint != null) {
        await markerManager.create(
          mapbox.CircleAnnotationOptions(
            geometry: _toMapboxPoint(widget.vehiclePoint!),
            circleColor: AmberColorTokens.amber500.toARGB32(),
            circleRadius: 8.0,
            circleOpacity: 1.0,
            circleStrokeColor: AmberColorTokens.surface0.toARGB32(),
            circleStrokeWidth: 2.0,
          ),
        );
      }

      if (widget.nextStopPoint != null) {
        await markerManager.create(
          mapbox.CircleAnnotationOptions(
            geometry: _toMapboxPoint(widget.nextStopPoint!),
            circleColor: AmberColorTokens.success.toARGB32(),
            circleRadius: 6.0,
            circleOpacity: 1.0,
            circleStrokeColor: AmberColorTokens.surface0.toARGB32(),
            circleStrokeWidth: 2.0,
          ),
        );
      }

      await _syncCamera(mapboxMap);
    } catch (_) {
      debugPrint('Driver map annotations sync skipped.');
    } finally {
      _syncInProgress = false;
    }
  }

  Future<void> _syncCamera(mapbox.MapboxMap mapboxMap) async {
    final points = _collectMapboxPoints();
    if (points.isEmpty) {
      return;
    }

    if (points.length == 1) {
      await mapboxMap.setCamera(
        mapbox.CameraOptions(
          center: points.first,
          zoom: 15.5,
          pitch: 0,
          bearing: 0,
        ),
      );
      return;
    }

    final camera = await mapboxMap.cameraForCoordinatesPadding(
      points,
      mapbox.CameraOptions(
        pitch: 0,
        bearing: 0,
      ),
      mapbox.MbxEdgeInsets(
        top: 90,
        left: 56,
        bottom: 240,
        right: 56,
      ),
      16.0,
      null,
    );
    await mapboxMap.setCamera(camera);
  }

  mapbox.CameraOptions _initialCameraOptions() {
    final points = _collectMapboxPoints();
    if (points.isEmpty) {
      return mapbox.CameraOptions(
        center: mapbox.Point(
          coordinates: mapbox.Position(29.3739, 40.7731),
        ),
        zoom: 12.0,
        pitch: 0,
      );
    }

    final avgLng = points
            .map((point) => point.coordinates.lng)
            .reduce((left, right) => left + right) /
        points.length;
    final avgLat = points
            .map((point) => point.coordinates.lat)
            .reduce((left, right) => left + right) /
        points.length;
    return mapbox.CameraOptions(
      center: mapbox.Point(coordinates: mapbox.Position(avgLng, avgLat)),
      zoom: 14.5,
      pitch: 0,
      bearing: 0,
    );
  }

  List<mapbox.Point> _collectMapboxPoints() {
    final points = <mapbox.Point>[
      ...widget.routePathPoints.map(_toMapboxPoint),
      if (widget.vehiclePoint != null) _toMapboxPoint(widget.vehiclePoint!),
      if (widget.nextStopPoint != null) _toMapboxPoint(widget.nextStopPoint!),
    ];
    return points;
  }

  mapbox.Point _toMapboxPoint(ActiveTripMapPoint point) {
    return mapbox.Point(
      coordinates: mapbox.Position(point.lng, point.lat),
    );
  }

  Future<void> _teardownAnnotationManagers() async {
    final mapboxMap = _mapboxMap;
    final routeLineManager = _routeLineManager;
    final markerManager = _markerManager;
    _routeLineManager = null;
    _markerManager = null;
    if (mapboxMap == null) {
      return;
    }

    try {
      if (routeLineManager != null) {
        await mapboxMap.annotations.removeAnnotationManager(routeLineManager);
      }
      if (markerManager != null) {
        await mapboxMap.annotations.removeAnnotationManager(markerManager);
      }
    } catch (_) {
      debugPrint('Driver map annotation manager teardown skipped.');
    }
  }
}

class _DriverMapPlaceholderShell extends StatelessWidget {
  const _DriverMapPlaceholderShell({
    this.routeName,
    this.nextStopName,
    this.routePathPoints = const <ActiveTripMapPoint>[],
    this.vehiclePoint,
    this.nextStopPoint,
    this.infoLabel,
  });

  final String? routeName;
  final String? nextStopName;
  final List<ActiveTripMapPoint> routePathPoints;
  final ActiveTripMapPoint? vehiclePoint;
  final ActiveTripMapPoint? nextStopPoint;
  final String? infoLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[
            Color(0xFFE8EDE4),
            Color(0xFFF2F4EF),
            Color(0xFFE0E5DA),
          ],
        ),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final geometry = _projectToScreenGeometry(
            size: Size(constraints.maxWidth, constraints.maxHeight),
          );
          final content = geometry == null
              ? _buildFallbackShell(context)
              : Stack(
                  children: <Widget>[
                    ..._buildGridLines(),
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _DriverRoutePainter(
                          routeScreenPoints: geometry.routeScreenPoints,
                        ),
                      ),
                    ),
                    if (geometry.vehicleScreenPoint != null)
                      Positioned(
                        left: geometry.vehicleScreenPoint!.dx - 24,
                        top: geometry.vehicleScreenPoint!.dy - 24,
                        child: const _VehicleMarker(),
                      ),
                    if (geometry.nextStopScreenPoint != null)
                      Positioned(
                        left: geometry.nextStopScreenPoint!.dx - 16,
                        top: geometry.nextStopScreenPoint!.dy - 28,
                        child: _NextStopMarker(nextStopName: nextStopName),
                      ),
                  ],
                );

          if (infoLabel == null) {
            return content;
          }
          return Stack(
            children: <Widget>[
              Positioned.fill(child: content),
              Positioned(
                left: 16,
                right: 16,
                bottom: 220,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AmberColorTokens.ink900.withAlpha(185),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    infoLabel!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontFamily: AmberTypographyTokens.bodyFamily,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AmberColorTokens.surface0,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  _ProjectedDriverMapGeometry? _projectToScreenGeometry({required Size size}) {
    if (size.width <= 0 || size.height <= 0) {
      return null;
    }

    final sourcePoints = <ActiveTripMapPoint>[
      ...routePathPoints,
      if (vehiclePoint != null) vehiclePoint!,
      if (nextStopPoint != null) nextStopPoint!,
    ];
    if (sourcePoints.isEmpty) {
      return null;
    }

    var minLat = sourcePoints.first.lat;
    var maxLat = sourcePoints.first.lat;
    var minLng = sourcePoints.first.lng;
    var maxLng = sourcePoints.first.lng;
    for (final point in sourcePoints.skip(1)) {
      if (point.lat < minLat) {
        minLat = point.lat;
      }
      if (point.lat > maxLat) {
        maxLat = point.lat;
      }
      if (point.lng < minLng) {
        minLng = point.lng;
      }
      if (point.lng > maxLng) {
        maxLng = point.lng;
      }
    }

    const minSpan = 0.0008;
    var latSpan = maxLat - minLat;
    var lngSpan = maxLng - minLng;
    if (latSpan < minSpan) {
      final center = (minLat + maxLat) / 2;
      minLat = center - (minSpan / 2);
      maxLat = center + (minSpan / 2);
      latSpan = minSpan;
    }
    if (lngSpan < minSpan) {
      final center = (minLng + maxLng) / 2;
      minLng = center - (minSpan / 2);
      maxLng = center + (minSpan / 2);
      lngSpan = minSpan;
    }

    const padding = 28.0;
    final drawableWidth = (size.width - (padding * 2)).clamp(1.0, size.width);
    final drawableHeight =
        (size.height - (padding * 2)).clamp(1.0, size.height);

    Offset project(ActiveTripMapPoint point) {
      final xNorm = (point.lng - minLng) / lngSpan;
      final yNorm = (point.lat - minLat) / latSpan;
      final x = padding + (xNorm * drawableWidth);
      final y = size.height - padding - (yNorm * drawableHeight);
      return Offset(x, y);
    }

    final routeScreenPoints =
        routePathPoints.map(project).toList(growable: false);
    return _ProjectedDriverMapGeometry(
      routeScreenPoints: routeScreenPoints,
      vehicleScreenPoint: vehiclePoint == null ? null : project(vehiclePoint!),
      nextStopScreenPoint:
          nextStopPoint == null ? null : project(nextStopPoint!),
    );
  }

  Widget _buildFallbackShell(BuildContext context) {
    return Stack(
      children: <Widget>[
        ..._buildGridLines(),
        const Center(
          child: _VehicleMarker(),
        ),
        if (nextStopName != null)
          Positioned(
            top: MediaQuery.of(context).size.height * 0.25,
            right: MediaQuery.of(context).size.width * 0.18,
            child: _NextStopMarker(nextStopName: nextStopName),
          ),
      ],
    );
  }

  List<Widget> _buildGridLines() {
    return <Widget>[
      for (int i = 1; i <= 6; i++)
        Positioned(
          top: 0,
          bottom: 0,
          left: i * 60.0,
          child: Container(
            width: 0.5,
            color: const Color(0x18000000),
          ),
        ),
      for (int i = 1; i <= 12; i++)
        Positioned(
          left: 0,
          right: 0,
          top: i * 70.0,
          child: Container(
            height: 0.5,
            color: const Color(0x18000000),
          ),
        ),
    ];
  }
}

class _ProjectedDriverMapGeometry {
  const _ProjectedDriverMapGeometry({
    required this.routeScreenPoints,
    required this.vehicleScreenPoint,
    required this.nextStopScreenPoint,
  });

  final List<Offset> routeScreenPoints;
  final Offset? vehicleScreenPoint;
  final Offset? nextStopScreenPoint;
}

class _DriverRoutePainter extends CustomPainter {
  const _DriverRoutePainter({
    required this.routeScreenPoints,
  });

  final List<Offset> routeScreenPoints;

  @override
  void paint(Canvas canvas, Size size) {
    if (routeScreenPoints.length < 2) {
      return;
    }
    final routePaint = Paint()
      ..color = AmberColorTokens.amber500.withAlpha(180)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;
    final glowPaint = Paint()
      ..color = AmberColorTokens.amber400.withAlpha(120)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = 8
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(routeScreenPoints.first.dx, routeScreenPoints.first.dy);
    for (final point in routeScreenPoints.skip(1)) {
      path.lineTo(point.dx, point.dy);
    }
    canvas.drawPath(path, glowPaint);
    canvas.drawPath(path, routePaint);
  }

  @override
  bool shouldRepaint(covariant _DriverRoutePainter oldDelegate) {
    if (identical(oldDelegate.routeScreenPoints, routeScreenPoints)) {
      return false;
    }
    if (oldDelegate.routeScreenPoints.length != routeScreenPoints.length) {
      return true;
    }
    for (var i = 0; i < routeScreenPoints.length; i++) {
      if (oldDelegate.routeScreenPoints[i] != routeScreenPoints[i]) {
        return true;
      }
    }
    return false;
  }
}

class _VehicleMarker extends StatelessWidget {
  const _VehicleMarker();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AmberColorTokens.amber500,
            shape: BoxShape.circle,
            border: Border.all(
              color: AmberColorTokens.surface0,
              width: 3,
            ),
            boxShadow: const <BoxShadow>[
              BoxShadow(
                color: Color(0x40000000),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(
            AmberIconTokens.bus,
            color: AmberColorTokens.surface0,
            size: 24,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 3,
          ),
          decoration: BoxDecoration(
            color: AmberColorTokens.ink900.withAlpha(200),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Text(
            'Arac konumu',
            style: TextStyle(
              fontFamily: AmberTypographyTokens.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 10,
              color: AmberColorTokens.surface0,
            ),
          ),
        ),
      ],
    );
  }
}

class _NextStopMarker extends StatelessWidget {
  const _NextStopMarker({
    required this.nextStopName,
  });

  final String? nextStopName;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AmberColorTokens.success,
            shape: BoxShape.circle,
            border: Border.all(
              color: AmberColorTokens.surface0,
              width: 2,
            ),
          ),
          child: const Icon(
            AmberIconTokens.flag,
            color: AmberColorTokens.surface0,
            size: 16,
          ),
        ),
        if (nextStopName != null) ...<Widget>[
          const SizedBox(height: 2),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 6,
              vertical: 2,
            ),
            decoration: BoxDecoration(
              color: AmberColorTokens.ink900.withAlpha(180),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              nextStopName!,
              style: const TextStyle(
                fontFamily: AmberTypographyTokens.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 9,
                color: AmberColorTokens.surface0,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// Transparent overlay at top of screen with route info + emergency button.
class _TopStatusOverlay extends StatelessWidget {
  const _TopStatusOverlay({
    required this.routeName,
    this.stopsRemaining,
    required this.heartbeatState,
    this.onEmergencyTap,
  });

  final String routeName;
  final int? stopsRemaining;
  final HeartbeatState heartbeatState;
  final VoidCallback? onEmergencyTap;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Container(
      padding: EdgeInsets.only(
        top: topPadding + AmberSpacingTokens.space8,
        left: AmberSpacingTokens.space16,
        right: AmberSpacingTokens.space16,
        bottom: AmberSpacingTokens.space12,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[
            AmberColorTokens.surface0.withAlpha(230),
            AmberColorTokens.surface0.withAlpha(0),
          ],
        ),
      ),
      child: Row(
        children: <Widget>[
          // Route context
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  routeName,
                  style: const TextStyle(
                    fontFamily: AmberTypographyTokens.headingFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: AmberColorTokens.ink900,
                  ),
                ),
                if (stopsRemaining != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      '$stopsRemaining durak kaldi',
                      style: const TextStyle(
                        fontFamily: AmberTypographyTokens.bodyFamily,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                        color: AmberColorTokens.ink700,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Compact heartbeat status chip
          AmberStatusChip(
            label: _chipLabel(heartbeatState),
            tone: _chipTone(heartbeatState),
            compact: true,
          ),
        ],
      ),
    );
  }

  String _chipLabel(HeartbeatState state) {
    switch (state) {
      case HeartbeatState.green:
        return 'Canli';
      case HeartbeatState.yellow:
        return 'Dalgali';
      case HeartbeatState.red:
        return 'Baglanti yok';
    }
  }

  AmberStatusChipTone _chipTone(HeartbeatState state) {
    switch (state) {
      case HeartbeatState.green:
        return AmberStatusChipTone.green;
      case HeartbeatState.yellow:
        return AmberStatusChipTone.yellow;
      case HeartbeatState.red:
        return AmberStatusChipTone.red;
    }
  }
}

/// Bottom panel containing heartbeat, guidance, and slide-to-finish.
class _BottomControlPanel extends StatelessWidget {
  const _BottomControlPanel({
    required this.heartbeatState,
    this.lastHeartbeatAgo,
    this.nextStopName,
    this.crowFlyDistanceMeters,
    this.passengersAtNextStop,
    this.syncStateLabel,
    this.manualInterventionMessage,
    this.onTripFinished,
    required this.isCompactDevice,
  });

  final HeartbeatState heartbeatState;
  final String? lastHeartbeatAgo;
  final String? nextStopName;
  final int? crowFlyDistanceMeters;
  final int? passengersAtNextStop;
  final String? syncStateLabel;
  final String? manualInterventionMessage;
  final VoidCallback? onTripFinished;
  final bool isCompactDevice;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      padding: EdgeInsets.only(
        left: AmberSpacingTokens.space16,
        right: AmberSpacingTokens.space16,
        top: AmberSpacingTokens.space16,
        bottom: bottomPadding + AmberSpacingTokens.space16,
      ),
      decoration: const BoxDecoration(
        color: AmberColorTokens.surface0,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
        boxShadow: AmberElevationTokens.shadowLevel2,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // Drag handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AmberColorTokens.line200,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          SizedBox(height: isCompactDevice ? 12.0 : 16.0),

          // Heartbeat indicator (centered, prominent)
          AmberHeartbeatIndicator(
            state: heartbeatState,
            lastHeartbeatAgo: lastHeartbeatAgo,
          ),
          SizedBox(height: isCompactDevice ? 12.0 : 20.0),

          // Driver guidance bar
          AmberDriverGuidanceBar(
            nextStopName: nextStopName,
            crowFlyDistanceMeters: crowFlyDistanceMeters,
            passengersAtNextStop: passengersAtNextStop,
          ),
          if (syncStateLabel != null ||
              manualInterventionMessage != null) ...<Widget>[
            SizedBox(height: isCompactDevice ? 10.0 : 12.0),
            if (syncStateLabel != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: AmberSpacingTokens.space12,
                  vertical: AmberSpacingTokens.space8,
                ),
                decoration: BoxDecoration(
                  color: AmberColorTokens.amber100,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AmberColorTokens.amber400.withAlpha(70),
                  ),
                ),
                child: Text(
                  syncStateLabel!,
                  style: const TextStyle(
                    fontFamily: AmberTypographyTokens.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: AmberColorTokens.ink900,
                  ),
                ),
              ),
            if (manualInterventionMessage != null) ...<Widget>[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: AmberSpacingTokens.space12,
                  vertical: AmberSpacingTokens.space8,
                ),
                decoration: BoxDecoration(
                  color: AmberColorTokens.dangerStrong.withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AmberColorTokens.danger.withAlpha(80),
                  ),
                ),
                child: Text(
                  manualInterventionMessage!,
                  style: const TextStyle(
                    fontFamily: AmberTypographyTokens.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: AmberColorTokens.dangerStrong,
                  ),
                ),
              ),
            ],
          ],
          SizedBox(height: isCompactDevice ? 12.0 : 16.0),

          // Slide-to-finish (destructive action guard)
          AmberSlideToFinish(
            onConfirmed: onTripFinished ?? () {},
            isEnabled: onTripFinished != null,
          ),
        ],
      ),
    );
  }
}
