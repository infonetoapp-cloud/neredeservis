import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class IosWatchdogSnapshot {
  const IosWatchdogSnapshot({
    required this.enabled,
    this.tripId,
    this.lastHeartbeatMs,
    this.lastWakeMs,
    this.lastMovingSignal,
  });

  final bool enabled;
  final String? tripId;
  final int? lastHeartbeatMs;
  final int? lastWakeMs;
  final bool? lastMovingSignal;

  factory IosWatchdogSnapshot.empty() {
    return const IosWatchdogSnapshot(enabled: false);
  }

  factory IosWatchdogSnapshot.fromMap(Map<Object?, Object?> rawMap) {
    int? toNullableInt(Object? value) {
      if (value is num) {
        return value.toInt();
      }
      if (value is String) {
        return int.tryParse(value.trim());
      }
      return null;
    }

    bool? toNullableBool(Object? value) {
      if (value is bool) {
        return value;
      }
      if (value is num) {
        return value != 0;
      }
      if (value is String) {
        final normalized = value.trim().toLowerCase();
        if (normalized == 'true' || normalized == '1') {
          return true;
        }
        if (normalized == 'false' || normalized == '0') {
          return false;
        }
      }
      return null;
    }

    final enabled = toNullableBool(rawMap['enabled']) ?? false;
    final tripIdRaw = (rawMap['tripId'] as String?)?.trim();
    final tripId = (tripIdRaw == null || tripIdRaw.isEmpty) ? null : tripIdRaw;
    return IosWatchdogSnapshot(
      enabled: enabled,
      tripId: tripId,
      lastHeartbeatMs: toNullableInt(rawMap['lastHeartbeatMs']),
      lastWakeMs: toNullableInt(rawMap['lastWakeMs']),
      lastMovingSignal: toNullableBool(rawMap['lastMovingSignal']),
    );
  }
}

class IosSilentKillMitigationService {
  IosSilentKillMitigationService({
    MethodChannel? channel,
    bool Function()? isIosSupported,
    DateTime Function()? nowUtc,
  })  : _channel = channel ?? const MethodChannel(_channelName),
        _isIosSupported = isIosSupported ??
            (() => !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS),
        _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());

  static const String _channelName = 'neredeservis/ios_background_watchdog';
  static const String _registerMethod = 'registerWatchdog';
  static const String _unregisterMethod = 'unregisterWatchdog';
  static const String _recordHeartbeatMethod = 'recordHeartbeat';
  static const String _readSnapshotMethod = 'readWatchdogSnapshot';

  final MethodChannel _channel;
  final bool Function() _isIosSupported;
  final DateTime Function() _nowUtc;

  Future<bool> startWatchdog({
    required String tripId,
  }) async {
    if (!_isIosSupported()) {
      return false;
    }
    final normalizedTripId = tripId.trim();
    if (normalizedTripId.isEmpty) {
      return false;
    }
    try {
      final result = await _channel.invokeMethod<bool>(
        _registerMethod,
        <String, dynamic>{'tripId': normalizedTripId},
      );
      return result == true;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  Future<bool> stopWatchdog() async {
    if (!_isIosSupported()) {
      return false;
    }
    try {
      final result = await _channel.invokeMethod<bool>(_unregisterMethod);
      return result == true;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  Future<bool> recordHeartbeat({
    required bool movingSignal,
    int? heartbeatMs,
  }) async {
    if (!_isIosSupported()) {
      return false;
    }
    try {
      final result = await _channel.invokeMethod<bool>(
        _recordHeartbeatMethod,
        <String, dynamic>{
          'heartbeatMs': heartbeatMs ?? _nowUtc().millisecondsSinceEpoch,
          'movingSignal': movingSignal,
        },
      );
      return result == true;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  Future<IosWatchdogSnapshot> readSnapshot() async {
    if (!_isIosSupported()) {
      return IosWatchdogSnapshot.empty();
    }
    try {
      final raw = await _channel.invokeMethod<Map<Object?, Object?>>(
        _readSnapshotMethod,
      );
      if (raw == null) {
        return IosWatchdogSnapshot.empty();
      }
      return IosWatchdogSnapshot.fromMap(raw);
    } on PlatformException {
      return IosWatchdogSnapshot.empty();
    } on MissingPluginException {
      return IosWatchdogSnapshot.empty();
    }
  }

  Future<bool> shouldRecoverAfterResume({
    int staleThresholdSeconds = 120,
  }) async {
    if (!_isIosSupported()) {
      return false;
    }
    final snapshot = await readSnapshot();
    if (!snapshot.enabled) {
      return false;
    }
    final movingSignal = snapshot.lastMovingSignal;
    final lastWakeMs = snapshot.lastWakeMs;
    final lastHeartbeatMs = snapshot.lastHeartbeatMs;

    if (lastWakeMs != null &&
        lastHeartbeatMs != null &&
        lastWakeMs > lastHeartbeatMs) {
      return movingSignal ?? true;
    }
    if (lastHeartbeatMs == null) {
      return false;
    }

    final thresholdMs = staleThresholdSeconds * 1000;
    final ageMs = _nowUtc().millisecondsSinceEpoch - lastHeartbeatMs;
    if (ageMs <= thresholdMs) {
      return false;
    }
    return movingSignal ?? true;
  }
}
