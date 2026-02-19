import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

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

typedef NotificationAuthorizationStatusReader = Future<AuthorizationStatus>
    Function();
typedef NotificationAuthorizationStatusRequester = Future<AuthorizationStatus>
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

  static bool _isGranted(AuthorizationStatus status) {
    return status == AuthorizationStatus.authorized ||
        status == AuthorizationStatus.provisional;
  }

  static bool _defaultIsPromptSupported() {
    if (kIsWeb) {
      return false;
    }
    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  static Future<AuthorizationStatus> _defaultReadStatus() async {
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus;
  }

  static Future<AuthorizationStatus> _defaultRequestStatus() async {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
    );
    return settings.authorizationStatus;
  }
}
