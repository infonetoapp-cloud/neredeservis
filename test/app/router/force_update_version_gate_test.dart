import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/force_update_version_gate.dart';

void main() {
  group('compareSemanticVersions', () {
    test('returns 0 when versions are equal', () {
      expect(compareSemanticVersions('1.2.3', '1.2.3'), 0);
    });

    test('returns -1 when left is lower', () {
      expect(compareSemanticVersions('1.2.2', '1.2.3'), -1);
    });

    test('returns 1 when left is higher', () {
      expect(compareSemanticVersions('2.0.0', '1.9.9'), 1);
    });

    test('ignores build and prerelease suffixes', () {
      expect(compareSemanticVersions('1.2.3+15', '1.2.3'), 0);
      expect(compareSemanticVersions('1.2.3-beta', '1.2.3'), 0);
    });
  });

  group('shouldForceUpdateVersion', () {
    test('returns false when min version is empty', () {
      expect(
        shouldForceUpdateVersion(currentVersion: '1.0.0', minVersion: ''),
        isFalse,
      );
    });

    test('returns true when current version is below min version', () {
      expect(
        shouldForceUpdateVersion(currentVersion: '1.3.0', minVersion: '1.4.0'),
        isTrue,
      );
    });

    test('returns false when current version meets min version', () {
      expect(
        shouldForceUpdateVersion(currentVersion: '1.4.0', minVersion: '1.4.0'),
        isFalse,
      );
      expect(
        shouldForceUpdateVersion(currentVersion: '1.4.1', minVersion: '1.4.0'),
        isFalse,
      );
    });
  });
}
