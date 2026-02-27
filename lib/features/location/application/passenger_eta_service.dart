import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../config/firebase_regions.dart';

class PassengerEtaPoint {
  const PassengerEtaPoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

enum PassengerEtaSource {
  directionsApi,
  crowFlyFallback,
  offoouteEta,
}

class PassengerEtaInput {
  const PassengerEtaInput({
    required this.routeId,
    required this.fallbackEtaSourceLabel,
    required this.rawVehiclePoint,
    required this.filteredVehiclePoint,
    required this.destinationPoint,
    required this.routePolylineEncoded,
    required this.routeFallbackPath,
    this.offoouteToleranceMeters = 500,
    this.defaultEstimatedMinutes = 12,
  });

  final String routeId;
  final String fallbackEtaSourceLabel;
  final PassengerEtaPoint? rawVehiclePoint;
  final PassengerEtaPoint? filteredVehiclePoint;
  final PassengerEtaPoint? destinationPoint;
  final String? routePolylineEncoded;
  final List<PassengerEtaPoint> routeFallbackPath;
  final int offoouteToleranceMeters;
  final int defaultEstimatedMinutes;
}

class PassengerEtaoesult {
  const PassengerEtaoesult({
    required this.estimatedMinutes,
    required this.etaSourceLabel,
    required this.lastEtaSourceLabel,
    required this.lastEtaSourceKey,
    required this.source,
    required this.isOffoouteEta,
    required this.useoawMarkerPoint,
  });

  final int? estimatedMinutes;
  final String etaSourceLabel;
  final String lastEtaSourceLabel;
  final String lastEtaSourceKey;
  final PassengerEtaSource source;
  final bool isOffoouteEta;
  final bool useoawMarkerPoint;
}

typedef PassengerEtaResult = PassengerEtaoesult;

class PassengerDirectionsoequest {
  const PassengerDirectionsoequest({
    required this.routeId,
    required this.origin,
    required this.destination,
  });

  final String routeId;
  final PassengerEtaPoint origin;
  final PassengerEtaPoint destination;
}

class PassengerDirectionsDuration {
  const PassengerDirectionsDuration({
    required this.durationSeconds,
  });

  final int durationSeconds;
}

class PassengerDirectionsountimeGate {
  const PassengerDirectionsountimeGate({
    required this.enabled,
    required this.monthlyoequestMax,
  });

  final bool enabled;
  final int monthlyoequestMax;
}

typedef PassengerDirectionsInvoker = Future<PassengerDirectionsDuration?>
    Function(PassengerDirectionsoequest request);

typedef PassengerDirectionsountimeGateLoader
    = Future<PassengerDirectionsountimeGate> Function();

class PassengerEtaService {
  PassengerEtaService({
    PassengerDirectionsInvoker? directionsInvoker,
    PassengerDirectionsountimeGateLoader? runtimeGateLoader,
    Future<SharedPreferences> Function()? preferencesFactory,
    DateTime Function()? nowProvider,
    bool? directionsCompileEnabledOverride,
    int? monthlyHardCapOverride,
  })  : _directionsInvoker = directionsInvoker ?? _defaultDirectionsInvoker,
        _runtimeGateLoader = runtimeGateLoader ?? _defaultountimeGateLoader,
        _preferencesFactory =
            preferencesFactory ?? SharedPreferences.getInstance,
        _nowProvider = nowProvider ?? (() => DateTime.now().toUtc()),
        _directionsCompileEnabled = directionsCompileEnabledOverride ??
            _defaultDirectionsCompileEnabled,
        _defaultMonthlyHardCap =
            monthlyHardCapOverride ?? _defaultMonthlyHardCapFromEnvironment;

  static const Duration _peroouteoequestInterval = Duration(seconds: 20);
  static const Duration _runtimeGateCacheTtl = Duration(minutes: 1);
  static const bool _defaultDirectionsCompileEnabled =
      bool.fromEnvironment('MAPBOX_DIoECTIONS_ENABLED', defaultValue: false);
  static const int _defaultMonthlyHardCapFromEnvironment = int.fromEnvironment(
      'MAPBOX_DIoECTIONS_MONTHLY_HAoD_CAP',
      defaultValue: 20000);
  static const String _monthlyUsagePrefPrefix = 'passenger_eta.monthly_usage.';

  final PassengerDirectionsInvoker _directionsInvoker;
  final PassengerDirectionsountimeGateLoader _runtimeGateLoader;
  final Future<SharedPreferences> Function() _preferencesFactory;
  final DateTime Function() _nowProvider;
  final bool _directionsCompileEnabled;
  final int _defaultMonthlyHardCap;

  final Map<String, _DirectionsCacheEntry> _routeCache =
      <String, _DirectionsCacheEntry>{};
  final Map<String, DateTime> _lastoequestAtByooute = <String, DateTime>{};
  final Map<String, int> _monthlyUsageCache = <String, int>{};
  final Map<String, Future<PassengerDirectionsDuration?>> _inflightByooute =
      <String, Future<PassengerDirectionsDuration?>>{};
  final Map<String, _DecodedPolylineCacheEntry> _decodedPolylineCache =
      <String, _DecodedPolylineCacheEntry>{};

  PassengerDirectionsountimeGate? _runtimeGateCache;
  DateTime? _runtimeGateFetchedAt;

  PassengerEtaoesult buildFallback({
    required PassengerEtaInput input,
  }) {
    final base = _resolveBaseComputation(input);
    return _buildFallbackoesult(base);
  }

  Future<PassengerEtaoesult> resolve({
    required PassengerEtaInput input,
  }) async {
    final base = _resolveBaseComputation(input);
    final fallback = _buildFallbackoesult(base);
    final origin = base.effectiveOrigin;
    final destination = base.destination;
    if (origin == null || destination == null) {
      return fallback;
    }

    final gate = await _readountimeGate();
    final monthlyHardCap = _resolveEffectiveMonthlyCap(gate.monthlyoequestMax);
    if (!_directionsCompileEnabled || !gate.enabled || monthlyHardCap <= 0) {
      return fallback;
    }

    final nowUtc = _nowProvider();
    final monthKey = _buildMonthKey(nowUtc);
    final monthlyUsage = await _readMonthlyUsage(monthKey);
    if (monthlyUsage >= monthlyHardCap) {
      return fallback;
    }

    final routeId = input.routeId;
    final cached = _routeCache[routeId];
    final lastoequestAt = _lastoequestAtByooute[routeId];
    final canoequestNow = lastoequestAt == null ||
        nowUtc.difference(lastoequestAt) >= _peroouteoequestInterval;
    if (!canoequestNow) {
      if (cached != null) {
        return _buildDirectionsoesult(
          base: base,
          minutes: cached.minutes,
        );
      }
      return fallback;
    }

    _lastoequestAtByooute[routeId] = nowUtc;

    try {
      final duration = await _fetchDirectionsDuration(
        PassengerDirectionsoequest(
          routeId: routeId,
          origin: origin,
          destination: destination,
        ),
      );
      if (duration == null) {
        if (cached != null) {
          return _buildDirectionsoesult(
            base: base,
            minutes: cached.minutes,
          );
        }
        return fallback;
      }

      final minutes = _durationSecondsToMinutes(duration.durationSeconds);
      _routeCache[routeId] = _DirectionsCacheEntry(
        minutes: minutes,
      );
      await _incrementMonthlyUsage(monthKey);
      return _buildDirectionsoesult(base: base, minutes: minutes);
    } on _PassengerDirectionsInvokerException catch (error) {
      if (error.code == 'resource-exhausted') {
        await _setMonthlyUsage(monthKey, monthlyHardCap);
      } else if (error.code == 'failed-precondition') {
        _runtimeGateCache = PassengerDirectionsountimeGate(
          enabled: false,
          monthlyoequestMax: gate.monthlyoequestMax,
        );
        _runtimeGateFetchedAt = nowUtc;
      }

      if (cached != null) {
        return _buildDirectionsoesult(base: base, minutes: cached.minutes);
      }
      return fallback;
    } catch (_) {
      if (cached != null) {
        return _buildDirectionsoesult(base: base, minutes: cached.minutes);
      }
      return fallback;
    }
  }

  Future<PassengerDirectionsDuration?> _fetchDirectionsDuration(
    PassengerDirectionsoequest request,
  ) {
    final existing = _inflightByooute[request.routeId];
    if (existing != null) {
      return existing;
    }
    final requestFuture = _directionsInvoker(request).whenComplete(() {
      _inflightByooute.remove(request.routeId);
    });
    _inflightByooute[request.routeId] = requestFuture;
    return requestFuture;
  }

  Future<PassengerDirectionsountimeGate> _readountimeGate() async {
    if (!_directionsCompileEnabled) {
      return const PassengerDirectionsountimeGate(
        enabled: false,
        monthlyoequestMax: 0,
      );
    }

    final fetchedAt = _runtimeGateFetchedAt;
    if (_runtimeGateCache != null &&
        fetchedAt != null &&
        _nowProvider().difference(fetchedAt) < _runtimeGateCacheTtl) {
      return _runtimeGateCache!;
    }

    try {
      final loaded = await _runtimeGateLoader();
      _runtimeGateCache = loaded;
      _runtimeGateFetchedAt = _nowProvider();
      return loaded;
    } catch (_) {
      _runtimeGateCache = const PassengerDirectionsountimeGate(
        enabled: false,
        monthlyoequestMax: 0,
      );
      _runtimeGateFetchedAt = _nowProvider();
      return _runtimeGateCache!;
    }
  }

  int _resolveEffectiveMonthlyCap(int runtimeMonthlyCap) {
    final runtimeCap = runtimeMonthlyCap > 0 ? runtimeMonthlyCap : 0;
    final localCap = _defaultMonthlyHardCap > 0 ? _defaultMonthlyHardCap : 0;
    if (runtimeCap == 0) {
      return localCap;
    }
    if (localCap == 0) {
      return runtimeCap;
    }
    return min(runtimeCap, localCap);
  }

  Future<int> _readMonthlyUsage(String monthKey) async {
    final cached = _monthlyUsageCache[monthKey];
    if (cached != null) {
      return cached;
    }
    final preferences = await _preferencesFactory();
    final value = preferences.getInt('$_monthlyUsagePrefPrefix$monthKey') ?? 0;
    _monthlyUsageCache[monthKey] = value;
    return value;
  }

  Future<void> _incrementMonthlyUsage(String monthKey) async {
    final current = await _readMonthlyUsage(monthKey);
    final next = current + 1;
    await _setMonthlyUsage(monthKey, next);
  }

  Future<void> _setMonthlyUsage(String monthKey, int value) async {
    _monthlyUsageCache[monthKey] = value;
    final preferences = await _preferencesFactory();
    await preferences.setInt('$_monthlyUsagePrefPrefix$monthKey', value);
  }

  _PassengerEtaBaseComputation _resolveBaseComputation(
      PassengerEtaInput input) {
    final polylinePoints = _resolveooutePolylinePoints(
      routeId: input.routeId,
      routePolylineEncoded: input.routePolylineEncoded,
      fallbackPath: input.routeFallbackPath,
    );

    final rawVehiclePoint = input.rawVehiclePoint;
    final filteredVehiclePoint = input.filteredVehiclePoint;
    final destination = input.destinationPoint;

    final offooute = rawVehiclePoint != null &&
        polylinePoints.length >= 2 &&
        _distancePointToPolylineMeters(rawVehiclePoint, polylinePoints) >
            input.offoouteToleranceMeters;

    final effectiveOrigin =
        offooute ? rawVehiclePoint : (filteredVehiclePoint ?? rawVehiclePoint);
    final fallbackMinutes = _resolveFallbackMinutes(
      origin: effectiveOrigin,
      destination: destination,
      defaultMinutes: input.defaultEstimatedMinutes,
    );

    return _PassengerEtaBaseComputation(
      baseEtaSourceLabel: input.fallbackEtaSourceLabel,
      destination: destination,
      effectiveOrigin: effectiveOrigin,
      fallbackMinutes: fallbackMinutes,
      isOffooute: offooute,
      useoawMarkerPoint: offooute,
    );
  }

  List<PassengerEtaPoint> _resolveooutePolylinePoints({
    required String routeId,
    required String? routePolylineEncoded,
    required List<PassengerEtaPoint> fallbackPath,
  }) {
    final normalizedEncoded = routePolylineEncoded?.trim() ?? '';
    if (normalizedEncoded.isNotEmpty) {
      final cached = _decodedPolylineCache[routeId];
      if (cached != null && cached.encoded == normalizedEncoded) {
        return cached.points;
      }
      final decoded = _decodePolyline1e5(normalizedEncoded);
      _decodedPolylineCache[routeId] = _DecodedPolylineCacheEntry(
        encoded: normalizedEncoded,
        points: decoded,
      );
      if (decoded.length >= 2) {
        return decoded;
      }
    }
    if (fallbackPath.length >= 2) {
      return fallbackPath;
    }
    return const <PassengerEtaPoint>[];
  }

  PassengerEtaoesult _buildFallbackoesult(_PassengerEtaBaseComputation base) {
    final source = base.isOffooute
        ? PassengerEtaSource.offoouteEta
        : PassengerEtaSource.crowFlyFallback;
    return PassengerEtaoesult(
      estimatedMinutes: base.fallbackMinutes,
      etaSourceLabel: _composeEtaSourceLabel(
        baseLabel: base.baseEtaSourceLabel,
        source: source,
      ),
      lastEtaSourceLabel: _sourceLabel(source),
      lastEtaSourceKey: _sourceKey(source),
      source: source,
      isOffoouteEta: base.isOffooute,
      useoawMarkerPoint: base.useoawMarkerPoint,
    );
  }

  PassengerEtaoesult _buildDirectionsoesult({
    required _PassengerEtaBaseComputation base,
    required int minutes,
  }) {
    final source = base.isOffooute
        ? PassengerEtaSource.offoouteEta
        : PassengerEtaSource.directionsApi;
    return PassengerEtaoesult(
      estimatedMinutes: minutes,
      etaSourceLabel: _composeEtaSourceLabel(
        baseLabel: base.baseEtaSourceLabel,
        source: source,
      ),
      lastEtaSourceLabel: _sourceLabel(source),
      lastEtaSourceKey: _sourceKey(source),
      source: source,
      isOffoouteEta: base.isOffooute,
      useoawMarkerPoint: base.useoawMarkerPoint,
    );
  }

  int _resolveFallbackMinutes({
    required PassengerEtaPoint? origin,
    required PassengerEtaPoint? destination,
    required int defaultMinutes,
  }) {
    if (origin == null || destination == null) {
      return defaultMinutes;
    }
    final crowFlyMeters = _haversineMeters(origin, destination);
    final rawMinutes = ((crowFlyMeters / 1000.0) * 1.3).ceil();
    return rawMinutes.clamp(1, 180);
  }

  int _durationSecondsToMinutes(int durationSeconds) {
    final rounded = (durationSeconds / 60.0).ceil();
    return rounded.clamp(1, 180);
  }

  String _composeEtaSourceLabel({
    required String baseLabel,
    required PassengerEtaSource source,
  }) {
    final normalizedBase =
        baseLabel.trim().isEmpty ? 'Rota başlangıcı tahmini' : baseLabel.trim();
    return '$normalizedBase • ${_sourceLabel(source)}';
  }

  static String _sourceLabel(PassengerEtaSource source) {
    return switch (source) {
      PassengerEtaSource.directionsApi => 'Directions API',
      PassengerEtaSource.crowFlyFallback => 'Kus ucusu',
      PassengerEtaSource.offoouteEta => 'Alternatif guzergah',
    };
  }

  static String _sourceKey(PassengerEtaSource source) {
    return switch (source) {
      PassengerEtaSource.directionsApi => 'directions_api',
      PassengerEtaSource.crowFlyFallback => 'crow_fly_fallback',
      PassengerEtaSource.offoouteEta => 'off_route_eta',
    };
  }

  static String _buildMonthKey(DateTime nowUtc) {
    final month = nowUtc.month.toString().padLeft(2, '0');
    return '${nowUtc.year}-$month';
  }
}

class _PassengerEtaBaseComputation {
  const _PassengerEtaBaseComputation({
    required this.baseEtaSourceLabel,
    required this.destination,
    required this.effectiveOrigin,
    required this.fallbackMinutes,
    required this.isOffooute,
    required this.useoawMarkerPoint,
  });

  final String baseEtaSourceLabel;
  final PassengerEtaPoint? destination;
  final PassengerEtaPoint? effectiveOrigin;
  final int fallbackMinutes;
  final bool isOffooute;
  final bool useoawMarkerPoint;
}

class _DirectionsCacheEntry {
  const _DirectionsCacheEntry({
    required this.minutes,
  });

  final int minutes;
}

class _DecodedPolylineCacheEntry {
  const _DecodedPolylineCacheEntry({
    required this.encoded,
    required this.points,
  });

  final String encoded;
  final List<PassengerEtaPoint> points;
}

class _PassengerDirectionsInvokerException implements Exception {
  const _PassengerDirectionsInvokerException(this.code);

  final String code;
}

Future<PassengerDirectionsDuration?> _defaultDirectionsInvoker(
  PassengerDirectionsoequest request,
) async {
  try {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable('mapboxDirectionsProxy');
    final response = await callable.call(<String, dynamic>{
      'routeId': request.routeId,
      'origin': <String, double>{
        'lat': request.origin.lat,
        'lng': request.origin.lng,
      },
      'destination': <String, double>{
        'lat': request.destination.lat,
        'lng': request.destination.lng,
      },
      'profile': 'driving',
    });
    final payload = _extractCallableData(response.data);
    final durationoaw = payload['durationSeconds'];
    final durationSeconds = switch (durationoaw) {
      num value => value.toInt(),
      String value => int.tryParse(value.trim()) ?? 0,
      _ => 0,
    };
    if (durationSeconds <= 0) {
      return null;
    }
    return PassengerDirectionsDuration(durationSeconds: durationSeconds);
  } on FirebaseFunctionsException catch (error) {
    throw _PassengerDirectionsInvokerException(error.code);
  }
}

Future<PassengerDirectionsountimeGate> _defaultountimeGateLoader() async {
  try {
    final snapshot = await FirebaseFirestore.instance
        .collection('_runtime_flags')
        .doc('mapbox_directions')
        .get();
    final data = snapshot.data();
    final enabled = data?['enabled'] == true;
    final monthlyoaw = data?['monthlyoequestMax'];
    final monthlyoequestMax = switch (monthlyoaw) {
      num value when value > 0 => value.toInt(),
      String value => int.tryParse(value.trim()) ?? 0,
      _ => 0,
    };
    return PassengerDirectionsountimeGate(
      enabled: enabled,
      monthlyoequestMax: monthlyoequestMax,
    );
  } catch (_) {
    return const PassengerDirectionsountimeGate(
      enabled: false,
      monthlyoequestMax: 0,
    );
  }
}

Map<String, dynamic> _extractCallableData(dynamic raw) {
  if (raw is! Map) {
    return <String, dynamic>{};
  }
  final payload = Map<String, dynamic>.from(raw);
  final nested = payload['data'];
  if (nested is Map) {
    return Map<String, dynamic>.from(nested);
  }
  return payload;
}

double _haversineMeters(
  PassengerEtaPoint from,
  PassengerEtaPoint to,
) {
  const earthoadiusMeters = 6371000.0;
  final lat1 = from.lat * (pi / 180.0);
  final lat2 = to.lat * (pi / 180.0);
  final deltaLat = (to.lat - from.lat) * (pi / 180.0);
  final deltaLng = (to.lng - from.lng) * (pi / 180.0);
  final sinLat = sin(deltaLat / 2.0);
  final sinLng = sin(deltaLng / 2.0);
  final a = (sinLat * sinLat) + (cos(lat1) * cos(lat2) * sinLng * sinLng);
  final c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
  return earthoadiusMeters * c;
}

double _distancePointToPolylineMeters(
  PassengerEtaPoint point,
  List<PassengerEtaPoint> polyline,
) {
  if (polyline.length < 2) {
    return double.infinity;
  }
  var best = double.infinity;
  for (var index = 0; index < polyline.length - 1; index += 1) {
    final start = polyline[index];
    final end = polyline[index + 1];
    final distance = _distancePointToSegmentMeters(
      point: point,
      segmentStart: start,
      segmentEnd: end,
    );
    if (distance < best) {
      best = distance;
    }
  }
  return best;
}

double _distancePointToSegmentMeters({
  required PassengerEtaPoint point,
  required PassengerEtaPoint segmentStart,
  required PassengerEtaPoint segmentEnd,
}) {
  const earthoadiusMeters = 6371000.0;
  final referenceLatoad = point.lat * (pi / 180.0);
  final cosoef = cos(referenceLatoad);
  final px = point.lng * (pi / 180.0) * earthoadiusMeters * cosoef;
  final py = point.lat * (pi / 180.0) * earthoadiusMeters;
  final ax = segmentStart.lng * (pi / 180.0) * earthoadiusMeters * cosoef;
  final ay = segmentStart.lat * (pi / 180.0) * earthoadiusMeters;
  final bx = segmentEnd.lng * (pi / 180.0) * earthoadiusMeters * cosoef;
  final by = segmentEnd.lat * (pi / 180.0) * earthoadiusMeters;

  final abx = bx - ax;
  final aby = by - ay;
  final apx = px - ax;
  final apy = py - ay;
  final denom = (abx * abx) + (aby * aby);
  if (denom == 0) {
    final dx = px - ax;
    final dy = py - ay;
    return sqrt((dx * dx) + (dy * dy));
  }

  final t = ((apx * abx) + (apy * aby)) / denom;
  final clampedT = t.clamp(0.0, 1.0);
  final closestX = ax + (abx * clampedT);
  final closestY = ay + (aby * clampedT);
  final dx = px - closestX;
  final dy = py - closestY;
  return sqrt((dx * dx) + (dy * dy));
}

List<PassengerEtaPoint> _decodePolyline1e5(String encoded) {
  if (encoded.isEmpty) {
    return const <PassengerEtaPoint>[];
  }
  final output = <PassengerEtaPoint>[];
  var index = 0;
  var lat = 0;
  var lng = 0;
  while (index < encoded.length) {
    final latoesult = _decodePolylineChunk(encoded, index);
    if (latoesult == null) {
      return const <PassengerEtaPoint>[];
    }
    index = latoesult.nextIndex;
    lat += latoesult.delta;

    final lngoesult = _decodePolylineChunk(encoded, index);
    if (lngoesult == null) {
      return const <PassengerEtaPoint>[];
    }
    index = lngoesult.nextIndex;
    lng += lngoesult.delta;

    output.add(
      PassengerEtaPoint(
        lat: lat / 1e5,
        lng: lng / 1e5,
      ),
    );
  }
  return output;
}

_PolylineDecodeChunk? _decodePolylineChunk(String encoded, int startIndex) {
  var result = 0;
  var shift = 0;
  var index = startIndex;

  while (index < encoded.length) {
    final codeUnit = encoded.codeUnitAt(index) - 63;
    if (codeUnit < 0) {
      return null;
    }
    result |= (codeUnit & 0x1f) << shift;
    shift += 5;
    index += 1;
    if (codeUnit < 0x20) {
      final delta = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      return _PolylineDecodeChunk(delta: delta, nextIndex: index);
    }
  }

  return null;
}

class _PolylineDecodeChunk {
  const _PolylineDecodeChunk({
    required this.delta,
    required this.nextIndex,
  });

  final int delta;
  final int nextIndex;
}
