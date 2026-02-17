import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  group('userRoleFromRaw', () {
    test('maps known role values', () {
      expect(userRoleFromRaw('driver'), UserRole.driver);
      expect(userRoleFromRaw('passenger'), UserRole.passenger);
      expect(userRoleFromRaw('guest'), UserRole.guest);
    });

    test('falls back to unknown for null/unsupported values', () {
      expect(userRoleFromRaw(null), UserRole.unknown);
      expect(userRoleFromRaw('admin'), UserRole.unknown);
    });
  });
}
