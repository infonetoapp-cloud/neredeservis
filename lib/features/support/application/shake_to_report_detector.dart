import 'dart:math';

typedef ShakeNowProvider = DateTime Function();
typedef ShakeTriggerCallback = void Function();

class ShakeToReportDetector {
  ShakeToReportDetector({
    required ShakeTriggerCallback onShakeDetected,
    ShakeNowProvider? now,
    Duration? debounce,
    Duration? hitWindow,
    double? thresholdG,
    int? requiredHits,
  })  : _onShakeDetected = onShakeDetected,
        _now = now ?? DateTime.now,
        _debounce = debounce ?? const Duration(seconds: 8),
        _hitWindow = hitWindow ?? const Duration(milliseconds: 900),
        _thresholdG = thresholdG ?? 2.4,
        _requiredHits = requiredHits ?? 2;

  static const double _earthGravity = 9.80665;

  final ShakeTriggerCallback _onShakeDetected;
  final ShakeNowProvider _now;
  final Duration _debounce;
  final Duration _hitWindow;
  final double _thresholdG;
  final int _requiredHits;

  final List<DateTime> _candidateHits = <DateTime>[];
  DateTime? _lastTriggeredAt;

  void addSample({
    required double x,
    required double y,
    required double z,
  }) {
    final now = _now();
    final magnitudeG = sqrt((x * x) + (y * y) + (z * z)) / _earthGravity;
    if (magnitudeG < _thresholdG) {
      _dropExpiredHits(now);
      return;
    }

    _dropExpiredHits(now);
    _candidateHits.add(now);

    if (_candidateHits.length < _requiredHits) {
      return;
    }

    final lastTriggeredAt = _lastTriggeredAt;
    if (lastTriggeredAt != null &&
        now.difference(lastTriggeredAt) < _debounce) {
      _candidateHits.clear();
      return;
    }

    _lastTriggeredAt = now;
    _candidateHits.clear();
    _onShakeDetected();
  }

  void reset() {
    _candidateHits.clear();
    _lastTriggeredAt = null;
  }

  void _dropExpiredHits(DateTime now) {
    _candidateHits.removeWhere(
      (candidate) => now.difference(candidate) > _hitWindow,
    );
  }
}
