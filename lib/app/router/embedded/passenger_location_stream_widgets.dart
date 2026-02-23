part of '../app_router.dart';

class _PassengerLocationSnapshot {
  const _PassengerLocationSnapshot({
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

class _PassengerLocationStreamBuilder extends StatefulWidget {
  const _PassengerLocationStreamBuilder({
    required this.routeId,
    required this.routeData,
    required this.passengerData,
    required this.fallbackEtaSourceLabel,
    required this.builder,
  });

  final String routeId;
  final Map<String, dynamic>? routeData;
  final Map<String, dynamic>? passengerData;
  final String fallbackEtaSourceLabel;
  final Widget Function(_PassengerLocationSnapshot snapshot) builder;

  @override
  State<_PassengerLocationStreamBuilder> createState() =>
      _PassengerLocationStreamBuilderState();
}

class _PassengerLocationStreamBuilderState
    extends State<_PassengerLocationStreamBuilder> {
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
    _realtimeConnectionSubscription =
        FirebaseDatabase.instance.ref('.info/connected').onValue.listen(
      (event) {
        _handleRealtimeConnectionChanged(event.snapshot.value == true);
      },
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
        ? 'BaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± geri geldi.'
        : 'BaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± geri geldi (${_formatConnectionDurationLabel(reconnectLatency)}).';
    _showInfo(context, reconnectLabel);
  }

  String? _resolvePassengerOfflineBannerLabel() {
    if (_isRealtimeConnected) {
      return null;
    }
    return 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°nternet baÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± kesildi. Son bilinen konum gÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¶steriliyor.';
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
    return 'Yeniden baÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± ${_formatConnectionDurationLabel(reconnectLatency)}';
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DatabaseEvent>(
      stream:
          FirebaseDatabase.instance.ref('locations/${widget.routeId}').onValue,
      builder: (context, snapshot) {
        final rawMap = _mapFromRtdbValue(snapshot.data?.snapshot.value);
        final timestampMs = parseLiveLocationTimestampMs(rawMap?['timestamp']);
        final rawLat = _parseFiniteDouble(rawMap?['lat']);
        final rawLng = _parseFiniteDouble(rawMap?['lng']);
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

        // 321B: raw GPS ve filtrelenmis marker konumunu ayri tut.
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
              _PassengerLocationSnapshot(
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
  final lat = _parseFiniteDouble(rawMap['lat']);
  final lng = _parseFiniteDouble(rawMap['lng']);
  if (lat == null || lng == null) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return PassengerEtaPoint(lat: lat, lng: lng);
}

Map<String, dynamic>? _mapFromRtdbValue(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is! Map<Object?, Object?>) {
    return null;
  }

  final output = <String, dynamic>{};
  for (final entry in value.entries) {
    output[entry.key.toString()] = entry.value;
  }
  return output;
}

double? _parseFiniteDouble(Object? value) {
  if (value is num) {
    final number = value.toDouble();
    return number.isFinite ? number : null;
  }
  if (value is String) {
    final parsed = double.tryParse(value.trim());
    if (parsed == null || !parsed.isFinite) {
      return null;
    }
    return parsed;
  }
  return null;
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
