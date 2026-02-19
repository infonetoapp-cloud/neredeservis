import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

enum IosWhileInUsePermissionResult {
  notApplicable,
  granted,
  denied,
}

enum IosBackgroundLocationPermissionResult {
  notApplicable,
  granted,
  foregroundOnly,
}

typedef PermissionStatusReader = Future<PermissionStatus> Function(
  Permission permission,
);
typedef PermissionStatusRequester = Future<PermissionStatus> Function(
  Permission permission,
);

class IosLocationPermissionOrchestrator {
  IosLocationPermissionOrchestrator({
    PermissionStatusReader? readStatus,
    PermissionStatusRequester? requestStatus,
    bool Function()? isIosSupported,
  })  : _readStatus = readStatus ?? _defaultReadStatus,
        _requestStatus = requestStatus ?? _defaultRequestStatus,
        _isIosSupported = isIosSupported ?? _defaultIsIosSupported;

  final PermissionStatusReader _readStatus;
  final PermissionStatusRequester _requestStatus;
  final bool Function() _isIosSupported;

  Future<IosWhileInUsePermissionResult> ensureWhileInUseAtValueMoment() async {
    if (!_isIosSupported()) {
      return IosWhileInUsePermissionResult.notApplicable;
    }

    final current = await _readStatus(Permission.locationWhenInUse);
    if (_isGranted(current)) {
      return IosWhileInUsePermissionResult.granted;
    }

    final requested = await _requestStatus(Permission.locationWhenInUse);
    if (_isGranted(requested)) {
      return IosWhileInUsePermissionResult.granted;
    }

    return IosWhileInUsePermissionResult.denied;
  }

  Future<IosBackgroundLocationPermissionResult>
      ensureAlwaysAtActiveTripCommit() async {
    if (!_isIosSupported()) {
      return IosBackgroundLocationPermissionResult.notApplicable;
    }

    final whenInUseStatus = await _readStatus(Permission.locationWhenInUse);
    if (!_isGranted(whenInUseStatus)) {
      return IosBackgroundLocationPermissionResult.foregroundOnly;
    }

    final alwaysStatus = await _readStatus(Permission.locationAlways);
    if (_isGranted(alwaysStatus)) {
      return IosBackgroundLocationPermissionResult.granted;
    }

    final requestedAlwaysStatus =
        await _requestStatus(Permission.locationAlways);
    if (_isGranted(requestedAlwaysStatus)) {
      return IosBackgroundLocationPermissionResult.granted;
    }

    return IosBackgroundLocationPermissionResult.foregroundOnly;
  }

  static bool _isGranted(PermissionStatus status) {
    return status.isGranted || status.isLimited;
  }

  static bool _defaultIsIosSupported() {
    return !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
  }

  static Future<PermissionStatus> _defaultReadStatus(
    Permission permission,
  ) async {
    return permission.status;
  }

  static Future<PermissionStatus> _defaultRequestStatus(
    Permission permission,
  ) async {
    return permission.request();
  }
}
