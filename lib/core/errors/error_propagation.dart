import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';

import '../exceptions/app_exception.dart';
import 'error_codes.dart';

String normalizeErrorCode(String? rawCode) {
  final normalized = (rawCode ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'invalid-argument':
    case 'invalid_argument':
      return ErrorCodes.invalidArgument;
    case 'permission-denied':
    case 'permission_denied':
      return ErrorCodes.permissionDenied;
    case 'failed-precondition':
    case 'failed_precondition':
    case 'operation-not-allowed':
    case 'operation_not_allowed':
      return ErrorCodes.failedPrecondition;
    case 'resource-exhausted':
    case 'resource_exhausted':
    case 'too-many-requests':
    case 'too_many_requests':
      return ErrorCodes.resourceExhausted;
    case 'unauthenticated':
      return ErrorCodes.unauthenticated;
    case 'unavailable':
    case 'network-request-failed':
    case 'network_request_failed':
      return ErrorCodes.unavailable;
    default:
      return ErrorCodes.unknown;
  }
}

AppException propagateAppException({
  required Object error,
  required String fallbackCode,
  required String fallbackMessage,
}) {
  if (error is AppException) {
    return error;
  }

  if (error is FirebaseException) {
    final code = normalizeErrorCode(error.code);
    return AppException(
      code: code == ErrorCodes.unknown ? fallbackCode : code,
      message: error.message ?? fallbackMessage,
      cause: error,
    );
  }

  if (error is TimeoutException || error is SocketException) {
    return AppException(
      code: ErrorCodes.unavailable,
      message: fallbackMessage,
      cause: error,
    );
  }

  if (error is FormatException) {
    return AppException(
      code: ErrorCodes.invalidArgument,
      message: error.message,
      cause: error,
    );
  }

  if (error is StateError || error is UnsupportedError) {
    return AppException(
      code: ErrorCodes.failedPrecondition,
      message: error.toString(),
      cause: error,
    );
  }

  return AppException(
    code: fallbackCode,
    message: fallbackMessage,
    cause: error,
  );
}
