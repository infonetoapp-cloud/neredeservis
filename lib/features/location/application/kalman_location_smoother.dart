class KalmanSmootherConfig {
  const KalmanSmootherConfig({
    this.processNoise = 0.01,
    this.measurementNoise = 3.0,
    this.updateIntervalMs = 1000,
  });

  final double processNoise;
  final double measurementNoise;
  final int updateIntervalMs;
}

class SmoothedLocationPoint {
  const SmoothedLocationPoint({
    required this.rawLat,
    required this.rawLng,
    required this.filteredLat,
    required this.filteredLng,
    required this.sampledAtMs,
  });

  final double rawLat;
  final double rawLng;
  final double filteredLat;
  final double filteredLng;
  final int sampledAtMs;
}

class KalmanLocationSmoother {
  KalmanLocationSmoother({
    this.config = const KalmanSmootherConfig(),
  })  : _latFilter = _ScalarKalmanFilter(config),
        _lngFilter = _ScalarKalmanFilter(config);

  final KalmanSmootherConfig config;
  final _ScalarKalmanFilter _latFilter;
  final _ScalarKalmanFilter _lngFilter;

  SmoothedLocationPoint update({
    required double lat,
    required double lng,
    required int sampledAtMs,
  }) {
    final filteredLat = _latFilter.update(lat, sampledAtMs);
    final filteredLng = _lngFilter.update(lng, sampledAtMs);
    return SmoothedLocationPoint(
      rawLat: lat,
      rawLng: lng,
      filteredLat: filteredLat,
      filteredLng: filteredLng,
      sampledAtMs: sampledAtMs,
    );
  }

  void reset() {
    _latFilter.reset();
    _lngFilter.reset();
  }
}

class _ScalarKalmanFilter {
  _ScalarKalmanFilter(this._config);

  final KalmanSmootherConfig _config;

  double? _estimate;
  double _errorCovariance = 1;
  int? _lastTimestampMs;

  double update(double measurement, int timestampMs) {
    if (_estimate == null) {
      _estimate = measurement;
      _errorCovariance = 1;
      _lastTimestampMs = timestampMs;
      return measurement;
    }

    final deltaMs =
        _lastTimestampMs == null ? 0 : timestampMs - _lastTimestampMs!;
    final normalizedDelta =
        deltaMs <= 0 ? 1 : deltaMs / _config.updateIntervalMs.clamp(1, 60000);

    final processNoise = _config.processNoise * normalizedDelta;
    final measurementNoise = _config.measurementNoise;

    _errorCovariance += processNoise;
    final kalmanGain = _errorCovariance / (_errorCovariance + measurementNoise);
    _estimate = _estimate! + kalmanGain * (measurement - _estimate!);
    _errorCovariance = (1 - kalmanGain) * _errorCovariance;
    _lastTimestampMs = timestampMs;

    return _estimate!;
  }

  void reset() {
    _estimate = null;
    _errorCovariance = 1;
    _lastTimestampMs = null;
  }
}
