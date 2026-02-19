import 'package:shared_preferences/shared_preferences.dart';

import 'notification_permission_orchestrator.dart';

class NotificationPermissionFallbackService {
  NotificationPermissionFallbackService({
    SharedPreferences? preferences,
    DateTime Function()? nowUtc,
    Duration cooldown = const Duration(hours: 24),
  })  : _preferencesFuture = preferences == null
            ? SharedPreferences.getInstance()
            : Future<SharedPreferences>.value(preferences),
        _nowUtc = nowUtc ?? (() => DateTime.now().toUtc()),
        _cooldown = cooldown;

  final Future<SharedPreferences> _preferencesFuture;
  final DateTime Function() _nowUtc;
  final Duration _cooldown;

  Future<bool> shouldShowDeniedBanner(
    NotificationPermissionTrigger trigger,
  ) async {
    final preferences = await _preferencesFuture;
    final lastShownMs = preferences.getInt(_keyFor(trigger));
    if (lastShownMs == null) {
      return true;
    }
    final lastShownAt =
        DateTime.fromMillisecondsSinceEpoch(lastShownMs, isUtc: true);
    return _nowUtc().difference(lastShownAt) >= _cooldown;
  }

  Future<void> markDeniedBannerShown(
    NotificationPermissionTrigger trigger,
  ) async {
    final preferences = await _preferencesFuture;
    await preferences.setInt(
      _keyFor(trigger),
      _nowUtc().millisecondsSinceEpoch,
    );
  }

  static String _keyFor(NotificationPermissionTrigger trigger) {
    return 'notification_permission_denied_banner_${trigger.name}';
  }
}
