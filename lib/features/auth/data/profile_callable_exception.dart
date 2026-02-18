import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_core/firebase_core.dart';

import '../../../core/errors/error_propagation.dart';
import '../../../core/exceptions/app_exception.dart';

enum ProfileCallableErrorCode {
  invalidArgument,
  permissionDenied,
  failedPrecondition,
  resourceExhausted,
  unauthenticated,
  unavailable,
  unknown,
}

class ProfileCallableException implements Exception {
  const ProfileCallableException({
    required this.callableName,
    required this.code,
    required this.message,
    this.details,
  });

  final String callableName;
  final ProfileCallableErrorCode code;
  final String message;
  final dynamic details;

  @override
  String toString() {
    return 'ProfileCallableException(callable: $callableName, code: $code, '
        'message: $message)';
  }
}

ProfileCallableException mapProfileCallableException({
  required String callableName,
  required Object error,
}) {
  if (error is FirebaseFunctionsException) {
    return ProfileCallableException(
      callableName: callableName,
      code: _mapCode(error.code),
      message: error.message ?? 'Callable failed.',
      details: error.details,
    );
  }

  if (error is FirebaseException && error.plugin == 'firebase_functions') {
    return ProfileCallableException(
      callableName: callableName,
      code: _mapCode(error.code),
      message: error.message ?? 'Callable failed.',
      details: null,
    );
  }

  if (error is AppException) {
    return ProfileCallableException(
      callableName: callableName,
      code: _mapCode(error.code),
      message: error.message,
      details: null,
    );
  }

  if (error is StateError) {
    return ProfileCallableException(
      callableName: callableName,
      code: ProfileCallableErrorCode.failedPrecondition,
      message: error.toString(),
      details: null,
    );
  }

  if (error is FormatException) {
    return ProfileCallableException(
      callableName: callableName,
      code: ProfileCallableErrorCode.invalidArgument,
      message: error.message,
      details: null,
    );
  }

  return ProfileCallableException(
    callableName: callableName,
    code: ProfileCallableErrorCode.unknown,
    message: error.toString(),
    details: null,
  );
}

ProfileCallableErrorCode _mapCode(String? rawCode) {
  switch (normalizeErrorCode(rawCode)) {
    case 'INVALID_ARGUMENT':
      return ProfileCallableErrorCode.invalidArgument;
    case 'PERMISSION_DENIED':
      return ProfileCallableErrorCode.permissionDenied;
    case 'FAILED_PRECONDITION':
      return ProfileCallableErrorCode.failedPrecondition;
    case 'RESOURCE_EXHAUSTED':
      return ProfileCallableErrorCode.resourceExhausted;
    case 'UNAUTHENTICATED':
      return ProfileCallableErrorCode.unauthenticated;
    case 'UNAVAILABLE':
      return ProfileCallableErrorCode.unavailable;
    default:
      return ProfileCallableErrorCode.unknown;
  }
}
