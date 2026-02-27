import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_auth_user_display_name_use_case.dart';

void main() {
  group('ResolveAuthUserDisplayNameUseCase', () {
    const useCase = ResolveAuthUserDisplayNameUseCase();

    test('prefers trimmed display name when long enough', () {
      final result = useCase.execute(
        const ResolveAuthUserDisplayNameCommand(
          displayName: '  Ahmet Kaya  ',
          email: 'ahmet@example.com',
          isAnonymous: false,
        ),
      );

      expect(result, 'Ahmet Kaya');
    });

    test('falls back to email prefix when display name is missing', () {
      final result = useCase.execute(
        const ResolveAuthUserDisplayNameCommand(
          displayName: null,
          email: '  sinan.user@example.com  ',
          isAnonymous: false,
        ),
      );

      expect(result, 'sinan.user');
    });

    test('returns anonymous label when no valid name and user is anonymous',
        () {
      final result = useCase.execute(
        const ResolveAuthUserDisplayNameCommand(
          displayName: 'x',
          email: 'a@b.com',
          isAnonymous: true,
        ),
      );

      expect(result, 'Misafir');
    });

    test('returns default label when no valid name and user is not anonymous',
        () {
      final result = useCase.execute(
        const ResolveAuthUserDisplayNameCommand(
          displayName: '',
          email: null,
          isAnonymous: false,
        ),
      );

      expect(result, 'Kullanici');
    });
  });
}
