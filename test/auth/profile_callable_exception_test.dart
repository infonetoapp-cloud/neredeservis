import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/errors/error_codes.dart';
import 'package:neredeservis/core/exceptions/app_exception.dart';
import 'package:neredeservis/features/auth/data/profile_callable_exception.dart';

void main() {
  group('mapProfileCallableException', () {
    test('maps AppException invalid argument codes', () {
      const exception = AppException(
        code: ErrorCodes.invalidArgument,
        message: 'invalid display name',
      );

      final mapped = mapProfileCallableException(
        callableName: 'bootstrapUserProfile',
        error: exception,
      );

      expect(mapped.callableName, 'bootstrapUserProfile');
      expect(mapped.code, ProfileCallableErrorCode.invalidArgument);
      expect(mapped.message, 'invalid display name');
      expect(mapped.details, isNull);
    });

    test('maps AppException permission codes', () {
      const exception = AppException(
        code: ErrorCodes.permissionDenied,
        message: 'not authorized',
      );

      final mapped = mapProfileCallableException(
        callableName: 'updateUserProfile',
        error: exception,
      );

      expect(mapped.code, ProfileCallableErrorCode.permissionDenied);
      expect(mapped.message, 'not authorized');
    });

    test('maps StateError to failedPrecondition', () {
      final mapped = mapProfileCallableException(
        callableName: 'bootstrapUserProfile',
        error: StateError('boom'),
      );

      expect(mapped.code, ProfileCallableErrorCode.failedPrecondition);
      expect(mapped.message, contains('boom'));
    });

    test('maps AppException code to profile code', () {
      final mapped = mapProfileCallableException(
        callableName: 'updateUserProfile',
        error: const AppException(
          code: ErrorCodes.permissionDenied,
          message: 'denied',
        ),
      );

      expect(mapped.code, ProfileCallableErrorCode.permissionDenied);
      expect(mapped.message, 'denied');
    });

    test('maps truly unknown errors to unknown code', () {
      final mapped = mapProfileCallableException(
        callableName: 'bootstrapUserProfile',
        error: Object(),
      );

      expect(mapped.code, ProfileCallableErrorCode.unknown);
    });
  });
}
