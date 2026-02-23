import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/router_session_role_preference_store.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('RouterSessionRolePreferenceStore', () {
    late RouterSessionRolePreferenceStore store;

    setUp(() {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      store = const RouterSessionRolePreferenceStore();
    });

    test('loads unknown when no value exists', () async {
      final role = await store.loadPreferredRole();
      expect(role, UserRole.unknown);
    });

    test('persists and loads mapped role values', () async {
      await store.persistPreferredRole(UserRole.driver);
      expect(await store.loadPreferredRole(), UserRole.driver);

      await store.persistPreferredRole(UserRole.passenger);
      expect(await store.loadPreferredRole(), UserRole.passenger);

      await store.persistPreferredRole(UserRole.guest);
      expect(await store.loadPreferredRole(), UserRole.guest);
    });

    test('returns unknown for invalid stored values', () async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        'session_preferred_role': 'not-a-role',
      });
      final freshStore = const RouterSessionRolePreferenceStore();

      expect(await freshStore.loadPreferredRole(), UserRole.unknown);
    });

    test('clear removes stored value', () async {
      await store.persistPreferredRole(UserRole.driver);
      await store.clearPreferredRole();

      expect(await store.loadPreferredRole(), UserRole.unknown);
    });
  });
}
