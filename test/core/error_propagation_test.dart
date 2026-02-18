import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/errors/error_codes.dart';
import 'package:neredeservis/core/errors/error_propagation.dart';
import 'package:neredeservis/core/exceptions/app_exception.dart';

void main() {
  group('normalizeErrorCode', () {
    test('normalizes firebase style codes to canonical contract codes', () {
      expect(
          normalizeErrorCode('invalid-argument'), ErrorCodes.invalidArgument);
      expect(
        normalizeErrorCode('permission_denied'),
        ErrorCodes.permissionDenied,
      );
      expect(
        normalizeErrorCode('FAILED_PRECONDITION'),
        ErrorCodes.failedPrecondition,
      );
      expect(normalizeErrorCode('resource-exhausted'),
          ErrorCodes.resourceExhausted);
      expect(
          normalizeErrorCode('network-request-failed'), ErrorCodes.unavailable);
      expect(normalizeErrorCode('something-new'), ErrorCodes.unknown);
    });
  });

  group('propagateAppException', () {
    test('keeps AppException instance as-is', () {
      const original = AppException(
        code: ErrorCodes.invalidArgument,
        message: 'bad input',
      );

      final propagated = propagateAppException(
        error: original,
        fallbackCode: ErrorCodes.unknown,
        fallbackMessage: 'fallback',
      );

      expect(identical(propagated, original), isTrue);
    });

    test('maps FirebaseException to canonical code', () {
      final propagated = propagateAppException(
        error: FirebaseException(
          plugin: 'firebase_functions',
          code: 'permission-denied',
          message: 'not allowed',
        ),
        fallbackCode: ErrorCodes.unknown,
        fallbackMessage: 'fallback',
      );

      expect(propagated.code, ErrorCodes.permissionDenied);
      expect(propagated.message, 'not allowed');
    });

    test('maps TimeoutException to UNAVAILABLE', () {
      final propagated = propagateAppException(
        error: TimeoutException('timed out'),
        fallbackCode: ErrorCodes.unknown,
        fallbackMessage: 'network unavailable',
      );

      expect(propagated.code, ErrorCodes.unavailable);
      expect(propagated.message, 'network unavailable');
    });

    test('maps StateError to FAILED_PRECONDITION', () {
      final propagated = propagateAppException(
        error: StateError('missing session'),
        fallbackCode: ErrorCodes.unknown,
        fallbackMessage: 'fallback',
      );

      expect(propagated.code, ErrorCodes.failedPrecondition);
      expect(propagated.message, contains('missing session'));
    });

    test('uses fallback values for unknown error type', () {
      final propagated = propagateAppException(
        error: Object(),
        fallbackCode: ErrorCodes.unknown,
        fallbackMessage: 'unexpected error',
      );

      expect(propagated.code, ErrorCodes.unknown);
      expect(propagated.message, 'unexpected error');
    });
  });
}
