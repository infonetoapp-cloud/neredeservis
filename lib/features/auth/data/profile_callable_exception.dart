import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_core/firebase_core.dart';

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

  return ProfileCallableException(
    callableName: callableName,
    code: ProfileCallableErrorCode.unknown,
    message: error.toString(),
    details: null,
  );
}

ProfileCallableErrorCode _mapCode(String? rawCode) {
  switch ((rawCode ?? '').toLowerCase()) {
    case 'invalid-argument':
    case 'invalid_argument':
      return ProfileCallableErrorCode.invalidArgument;
    case 'permission-denied':
    case 'permission_denied':
      return ProfileCallableErrorCode.permissionDenied;
    case 'failed-precondition':
    case 'failed_precondition':
      return ProfileCallableErrorCode.failedPrecondition;
    case 'resource-exhausted':
    case 'resource_exhausted':
      return ProfileCallableErrorCode.resourceExhausted;
    case 'unauthenticated':
      return ProfileCallableErrorCode.unauthenticated;
    case 'unavailable':
      return ProfileCallableErrorCode.unavailable;
    default:
      return ProfileCallableErrorCode.unknown;
  }
}
