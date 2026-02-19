import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

enum AndroidBatteryOptimizationOutcome {
  granted,
  denied,
  notApplicable,
  error,
}

class AndroidBatteryOptimizationOrchestrator {
  AndroidBatteryOptimizationOrchestrator({
    Future<PermissionStatus> Function()? readStatus,
    Future<PermissionStatus> Function()? requestPermission,
    bool Function()? isAndroidSupported,
  })  : _readStatus =
            readStatus ?? (() => Permission.ignoreBatteryOptimizations.status),
        _requestPermission = requestPermission ??
            (() => Permission.ignoreBatteryOptimizations.request()),
        _isAndroidSupported = isAndroidSupported ??
            (() => !kIsWeb && defaultTargetPlatform == TargetPlatform.android);

  final Future<PermissionStatus> Function() _readStatus;
  final Future<PermissionStatus> Function() _requestPermission;
  final bool Function() _isAndroidSupported;

  bool get isSupported => _isAndroidSupported();

  Future<bool> isBypassEnabled() async {
    if (!isSupported) {
      return false;
    }
    try {
      final status = await _readStatus();
      return _isGrantedStatus(status);
    } catch (_) {
      return false;
    }
  }

  Future<AndroidBatteryOptimizationOutcome> requestBypassAtNeedMoment() async {
    if (!isSupported) {
      return AndroidBatteryOptimizationOutcome.notApplicable;
    }
    try {
      var status = await _readStatus();
      if (_isGrantedStatus(status)) {
        return AndroidBatteryOptimizationOutcome.granted;
      }

      status = await _requestPermission();
      if (_isGrantedStatus(status)) {
        return AndroidBatteryOptimizationOutcome.granted;
      }
      return AndroidBatteryOptimizationOutcome.denied;
    } catch (_) {
      return AndroidBatteryOptimizationOutcome.error;
    }
  }

  bool _isGrantedStatus(PermissionStatus status) {
    return status.isGranted || status.isLimited;
  }
}
