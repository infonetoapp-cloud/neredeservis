import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/domain/user_role.dart';

class RouterSessionRolePreferenceStore {
  const RouterSessionRolePreferenceStore({
    this.preferenceKey = _defaultPreferenceKey,
  });

  static const String _defaultPreferenceKey = 'session_preferred_role';

  final String preferenceKey;

  Future<UserRole> loadPreferredRole() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final stored = preferences.getString(preferenceKey);
      return _mapStoredRoleToUserRole(stored);
    } catch (_) {
      return UserRole.unknown;
    }
  }

  Future<void> persistPreferredRole(UserRole role) async {
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(
          preferenceKey, _mapUserRoleToStoredRole(role));
    } catch (_) {
      // Best-effort persistence only.
    }
  }

  Future<void> clearPreferredRole() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.remove(preferenceKey);
    } catch (_) {
      // Best-effort cleanup only.
    }
  }
}

String _mapUserRoleToStoredRole(UserRole role) {
  return switch (role) {
    UserRole.driver => 'driver',
    UserRole.passenger => 'passenger',
    UserRole.guest => 'guest',
    UserRole.unknown => 'unknown',
  };
}

UserRole _mapStoredRoleToUserRole(String? raw) {
  switch (raw?.trim().toLowerCase()) {
    case 'driver':
      return UserRole.driver;
    case 'passenger':
      return UserRole.passenger;
    case 'guest':
      return UserRole.guest;
    default:
      return UserRole.unknown;
  }
}
