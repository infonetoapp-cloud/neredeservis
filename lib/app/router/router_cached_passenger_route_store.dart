import 'package:shared_preferences/shared_preferences.dart';

class RouterCachedPassengerRouteRecord {
  const RouterCachedPassengerRouteRecord({
    required this.routeId,
    required this.routeName,
  });

  final String routeId;
  final String? routeName;
}

class RouterCachedPassengerRouteStore {
  const RouterCachedPassengerRouteStore({
    this.routeIdPreferenceKey = _defaultRouteIdPreferenceKey,
    this.routeNamePreferenceKey = _defaultRouteNamePreferenceKey,
  });

  static const String _defaultRouteIdPreferenceKey =
      'session_cached_passenger_route_id';
  static const String _defaultRouteNamePreferenceKey =
      'session_cached_passenger_route_name';

  final String routeIdPreferenceKey;
  final String routeNamePreferenceKey;

  Future<void> persist({
    required String routeId,
    String? routeName,
  }) async {
    final normalizedRouteId = routeId.trim();
    if (normalizedRouteId.isEmpty) {
      return;
    }
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(routeIdPreferenceKey, normalizedRouteId);
      final normalizedRouteName = routeName?.trim();
      if (normalizedRouteName == null || normalizedRouteName.isEmpty) {
        await preferences.remove(routeNamePreferenceKey);
      } else {
        await preferences.setString(
            routeNamePreferenceKey, normalizedRouteName);
      }
    } catch (_) {
      // Best-effort cache only.
    }
  }

  Future<void> clear() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.remove(routeIdPreferenceKey);
      await preferences.remove(routeNamePreferenceKey);
    } catch (_) {
      // Best-effort cleanup only.
    }
  }

  Future<RouterCachedPassengerRouteRecord?> read() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final routeId = preferences.getString(routeIdPreferenceKey)?.trim();
      if (routeId == null || routeId.isEmpty) {
        return null;
      }
      final routeName = preferences.getString(routeNamePreferenceKey)?.trim();
      return RouterCachedPassengerRouteRecord(
        routeId: routeId,
        routeName: (routeName == null || routeName.isEmpty) ? null : routeName,
      );
    } catch (_) {
      return null;
    }
  }
}
