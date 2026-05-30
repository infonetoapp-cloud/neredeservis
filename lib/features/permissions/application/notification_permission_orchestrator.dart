import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

enum NotificationPermissionTrigger {
  passengerJoin,
  driverAnnouncement,
}

enum NotificationPermissionOutcome {
  skipped,
  alreadyGranted,
  granted,
  denied,
}

typedef NotificationAuthorizationStatusReader = Future<PermissionStatus>
    Function();
typedef NotificationAuthorizationStatusRequester = Future<PermissionStatus>
    Function();

class NotificationPermissionOrchestrator {
  NotificationPermissionOrchestrator({
    NotificationAuthorizationStatusReader? readStatus,
    NotificationAuthorizationStatusRequester? requestStatus,
    bool Function()? isPromptSupported,
  })  : _readStatus = readStatus ?? _defaultReadStatus,
        _requestStatus = requestStatus ?? _defaultRequestStatus,
        _isPromptSupported = isPromptSupported ?? _defaultIsPromptSupported;

  final NotificationAuthorizationStatusReader _readStatus;
  final NotificationAuthorizationStatusRequester _requestStatus;
  final bool Function() _isPromptSupported;

  Future<NotificationPermissionOutcome> requestAtValueMoment(
    NotificationPermissionTrigger trigger,
  ) async {
    if (!_isPromptSupported()) {
      return NotificationPermissionOutcome.skipped;
    }

    final status = await _readStatus();
    if (_isGranted(status)) {
      return NotificationPermissionOutcome.alreadyGranted;
    }

    final requestedStatus = await _requestStatus();
    if (_isGranted(requestedStatus)) {
      return NotificationPermissionOutcome.granted;
    }
    return NotificationPermissionOutcome.denied;
  }

  static bool _isGranted(PermissionStatus status) {
    return status.isGranted || status.isLimited || status.isProvisional;
  }

  static bool _defaultIsPromptSupported() {
    if (kIsWeb) {
      return false;
    }
    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  static Future<PermissionStatus> _defaultReadStatus() {
    return Permission.notification.status;
  }

  static Future<PermissionStatus> _defaultRequestStatus() {
    return Permission.notification.request();
  }
}
