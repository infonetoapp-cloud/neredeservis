import 'dart:async';

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

import '../../features/location/application/kalman_location_smoother.dart';
import '../../features/location/application/location_freshness.dart';
import '../../features/location/application/passenger_eta_service.dart';
import '../../ui/components/sheets/passenger_map_sheet.dart';
import 'router_firebase_runtime_gateway.dart';
import 'router_realtime_connection_listener_helpers.dart';
import 'router_value_parsing_helpers.dart';

typedef RouterInfoMessageHandler = void Function(
  BuildContext context,
  String message,
);

class RouterPassengerLocationSnapshot {
  const RouterPassengerLocationSnapshot({
    required this.freshness,
    required this.lastSeenAgo,
    required this.estimatedMinutes,
    required this.etaSourceLabel,
    required this.lastEtaSourceLabel,
    required this.offlineBannerLabel,
    required this.latencyIndicatorLabel,
    this.rawLat,
    this.rawLng,
    this.filteredLat,
    this.filteredLng,
    this.sampledAtMs,
  });

  final LocationFreshness freshness;
  final String? lastSeenAgo;
  final int? estimatedMinutes;
  final String? etaSourceLabel;
  final String? lastEtaSourceLabel;
  final String? offlineBannerLabel;
  final String? latencyIndicatorLabel;
  final double? rawLat;
  final double? rawLng;
  final double? filteredLat;
  final double? filteredLng;
  final int? sampledAtMs;
}

class RouterPassengerLocationStreamBuilder extends StatefulWidget {
  const RouterPassengerLocationStreamBuilder({
    super.key,
    required this.routeId,
    required this.routeData,
    required this.passengerData,
    required this.fallbackEtaSourceLabel,
    required this.builder,
    this.onInfoMessage,
  });

  final String routeId;
  final Map<String, dynamic>? routeData;
  final Map<String, dynamic>? passengerData;
  final String fallbackEtaSourceLabel;
  final Widget Function(RouterPassengerLocationSnapshot snapshot) builder;
  final RouterInfoMessageHandler? onInfoMessage;

  @override
  State<RouterPassengerLocationStreamBuilder> createState() =>
      _RouterPassengerLocationStreamBuilderState();
}

class _RouterPassengerLocationStreamBuilderState
    extends State<RouterPassengerLocationStreamBuilder> {
  static final PassengerEtaService _passengerEtaService = PassengerEtaService();

  final KalmanLocationSmoother _smoother = KalmanLocationSmoother(
    config: const KalmanSmootherConfig(
      processNoise: 0.01,
      measurementNoise: 3.0,
      updateIntervalMs: 1000,
    ),
  );
  StreamSubscription<DatabaseEvent>? _realtimeConnectionSubscription;
  bool _isRealtimeConnected = true;
  DateTime? _disconnectedAtUtc;
  DateTime? _lastReconnectAtUtc;
  Duration? _lastReconnectLatency;

  @override
  void initState() {
    super.initState();
    _startRealtimeConnectionListener();
  }

  @override
  void dispose() {
    _realtimeConnectionSubscription?.cancel();
    super.dispose();
  }

  void _startRealtimeConnectionListener() {
    _realtimeConnectionSubscription?.cancel();
    _realtimeConnectionSubscription = startRouterRealtimeConnectionListener(
      onConnectionChanged: _handleRealtimeConnectionChanged,
      onError: (_) {
        debugPrint('Passenger realtime connection listener failed.');
      },
    );
  }

  void _handleRealtimeConnectionChanged(bool connected) {
    if (!mounted || connected == _isRealtimeConnected) {
      return;
    }
    if (!connected) {
      setState(() {
        _isRealtimeConnected = false;
        _disconnectedAtUtc = DateTime.now().toUtc();
      });
      return;
    }
    final nowUtc = DateTime.now().toUtc();
    final disconnectedAt = _disconnectedAtUtc;
    final reconnectLatency =
        disconnectedAt == null ? null : nowUtc.difference(disconnectedAt);
    setState(() {
      _isRealtimeConnected = true;
      _disconnectedAtUtc = null;
      _lastReconnectLatency = reconnectLatency;
      _lastReconnectAtUtc = nowUtc;
    });
    final reconnectLabel = reconnectLatency == null
        ? 'Baglanti geri geldi.'
        : 'Baglanti geri geldi (${_formatConnectionDurationLabel(reconnectLatency)}).';
    widget.onInfoMessage?.call(context, reconnectLabel);
  }

  String? _resolvePassengerOfflineBannerLabel() {
    if (_isRealtimeConnected) {
      return null;
    }
    return 'Internet baglantisi kesildi. Son bilinen konum gosteriliyor.';
  }

  String? _resolvePassengerLatencyIndicatorLabel() {
    if (!_isRealtimeConnected) {
      return 'Kesinti';
    }
    final reconnectAt = _lastReconnectAtUtc;
    final reconnectLatency = _lastReconnectLatency;
    if (reconnectAt == null || reconnectLatency == null) {
      return null;
    }
    final elapsed = DateTime.now().toUtc().difference(reconnectAt);
    if (elapsed > const Duration(minutes: 2)) {
      return null;
    }
    return 'Yeniden baglanti ${_formatConnectionDurationLabel(reconnectLatency)}';
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DatabaseEvent>(
      stream: routerFirebaseRuntimeGateway.watchRouteLocationValue(
        widget.routeId,
      ),
      builder: (context, snapshot) {
        final rawMap = mapFromRouterDynamicValue(snapshot.data?.snapshot.value);
        final timestampMs = parseLiveLocationTimestampMs(rawMap?['timestamp']);
        final rawLat = parseFiniteRouterDouble(rawMap?['lat']);
        final rawLng = parseFiniteRouterDouble(rawMap?['lng']);
        final nowUtc = DateTime.now().toUtc();
        final freshness = _toPassengerLocationFreshness(
          resolveLiveSignalFreshness(
            nowUtc: nowUtc,
            timestampMs: timestampMs,
            treatMissingAsLive: true,
          ),
        );
        final lastSeenAgo = formatLastSeenAgo(
          nowUtc: nowUtc,
          timestampMs: timestampMs,
        );

        SmoothedLocationPoint? smoothedPoint;
        if (timestampMs != null && rawLat != null && rawLng != null) {
          smoothedPoint = _smoother.update(
            lat: rawLat,
            lng: rawLng,
            sampledAtMs: timestampMs,
          );
        }

        final rawVehiclePoint = (rawLat == null || rawLng == null)
            ? null
            : PassengerEtaPoint(lat: rawLat, lng: rawLng);
        final filteredLat = smoothedPoint?.filteredLat;
        final filteredLng = smoothedPoint?.filteredLng;
        final filteredVehiclePoint =
            (filteredLat == null || filteredLng == null)
                ? null
                : PassengerEtaPoint(
                    lat: filteredLat,
                    lng: filteredLng,
                  );

        final destinationPoint = _resolvePassengerEtaDestinationPoint(
          routeData: widget.routeData,
          passengerData: widget.passengerData,
        );
        final fallbackPath = _buildPassengerRouteFallbackPath(widget.routeData);
        final routePolylineRaw = widget.routeData?['routePolyline'];
        final routePolylineEncoded =
            routePolylineRaw is String ? routePolylineRaw : null;

        final etaInput = PassengerEtaInput(
          routeId: widget.routeId,
          fallbackEtaSourceLabel: widget.fallbackEtaSourceLabel,
          rawVehiclePoint: rawVehiclePoint,
          filteredVehiclePoint: filteredVehiclePoint,
          destinationPoint: destinationPoint,
          routePolylineEncoded: routePolylineEncoded,
          routeFallbackPath: fallbackPath,
        );
        final fallbackEta = _passengerEtaService.buildFallback(input: etaInput);

        return FutureBuilder<PassengerEtaResult>(
          future: _passengerEtaService.resolve(input: etaInput),
          initialData: fallbackEta,
          builder: (context, etaSnapshot) {
            final eta = etaSnapshot.data ?? fallbackEta;
            return widget.builder(
              RouterPassengerLocationSnapshot(
                freshness: freshness,
                lastSeenAgo: lastSeenAgo,
                estimatedMinutes: eta.estimatedMinutes,
                etaSourceLabel: eta.etaSourceLabel,
                lastEtaSourceLabel: eta.lastEtaSourceLabel,
                offlineBannerLabel: _resolvePassengerOfflineBannerLabel(),
                latencyIndicatorLabel: _resolvePassengerLatencyIndicatorLabel(),
                rawLat: rawLat,
                rawLng: rawLng,
                filteredLat: smoothedPoint?.filteredLat,
                filteredLng: smoothedPoint?.filteredLng,
                sampledAtMs: timestampMs,
              ),
            );
          },
        );
      },
    );
  }
}

LocationFreshness _toPassengerLocationFreshness(
  LiveSignalFreshness freshness,
) {
  return switch (freshness) {
    LiveSignalFreshness.live => LocationFreshness.live,
    LiveSignalFreshness.mild => LocationFreshness.mild,
    LiveSignalFreshness.stale => LocationFreshness.stale,
    LiveSignalFreshness.lost => LocationFreshness.lost,
  };
}

PassengerEtaPoint? _resolvePassengerEtaDestinationPoint({
  required Map<String, dynamic>? routeData,
  required Map<String, dynamic>? passengerData,
}) {
  final virtualStopPoint = _parsePassengerEtaPointFromRaw(
    passengerData?['virtualStop'],
  );
  if (virtualStopPoint != null) {
    return virtualStopPoint;
  }
  final startPoint = _parsePassengerEtaPointFromRaw(routeData?['startPoint']);
  if (startPoint != null) {
    return startPoint;
  }
  return _parsePassengerEtaPointFromRaw(routeData?['endPoint']);
}

List<PassengerEtaPoint> _buildPassengerRouteFallbackPath(
  Map<String, dynamic>? routeData,
) {
  final startPoint = _parsePassengerEtaPointFromRaw(routeData?['startPoint']);
  final endPoint = _parsePassengerEtaPointFromRaw(routeData?['endPoint']);
  if (startPoint == null || endPoint == null) {
    return const <PassengerEtaPoint>[];
  }
  if ((startPoint.lat - endPoint.lat).abs() < 0.0000001 &&
      (startPoint.lng - endPoint.lng).abs() < 0.0000001) {
    return <PassengerEtaPoint>[startPoint];
  }
  return <PassengerEtaPoint>[startPoint, endPoint];
}

PassengerEtaPoint? _parsePassengerEtaPointFromRaw(Object? rawValue) {
  if (rawValue is! Map<Object?, Object?> && rawValue is! Map<String, dynamic>) {
    return null;
  }
  final rawMap = rawValue is Map<String, dynamic>
      ? rawValue
      : Map<String, dynamic>.from(rawValue as Map<Object?, Object?>);
  final lat = parseFiniteRouterDouble(rawMap['lat']);
  final lng = parseFiniteRouterDouble(rawMap['lng']);
  if (lat == null || lng == null) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return PassengerEtaPoint(lat: lat, lng: lng);
}

String _formatConnectionDurationLabel(Duration duration) {
  final totalSeconds = duration.inSeconds;
  if (totalSeconds < 1) {
    return '<1 sn';
  }
  if (totalSeconds < 60) {
    return '$totalSeconds sn';
  }
  final minutes = duration.inMinutes;
  final remainingSeconds = totalSeconds % 60;
  if (minutes < 60) {
    return '$minutes dk ${remainingSeconds.toString().padLeft(2, '0')} sn';
  }
  final hours = duration.inHours;
  final remainingMinutes = minutes % 60;
  return '$hours sa ${remainingMinutes.toString().padLeft(2, '0')} dk';
}
