import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/data/profile_callable_exception.dart';

void main() {
  group('mapProfileCallableException', () {
    test('maps FirebaseFunctionsException codes to domain codes', () {
      final exception = TestFirebaseFunctionsException(
        message: 'invalid display name',
        code: 'invalid-argument',
        details: const {'field': 'displayName'},
      );

      final mapped = mapProfileCallableException(
        callableName: 'bootstrapUserProfile',
        error: exception,
      );

      expect(mapped.callableName, 'bootstrapUserProfile');
      expect(mapped.code, ProfileCallableErrorCode.invalidArgument);
      expect(mapped.message, 'invalid display name');
      expect(mapped.details, {'field': 'displayName'});
    });

    test('maps firebase_functions plugin FirebaseException codes', () {
      final exception = FirebaseException(
        plugin: 'firebase_functions',
        code: 'permission-denied',
        message: 'not authorized',
      );

      final mapped = mapProfileCallableException(
        callableName: 'updateUserProfile',
        error: exception,
      );

      expect(mapped.code, ProfileCallableErrorCode.permissionDenied);
      expect(mapped.message, 'not authorized');
    });

    test('maps unknown errors to unknown code', () {
      final mapped = mapProfileCallableException(
        callableName: 'bootstrapUserProfile',
        error: StateError('boom'),
      );

      expect(mapped.code, ProfileCallableErrorCode.unknown);
      expect(mapped.message, contains('boom'));
    });
  });
}

class TestFirebaseFunctionsException extends FirebaseFunctionsException {
  TestFirebaseFunctionsException({
    required super.message,
    required super.code,
    super.details,
  });
}
