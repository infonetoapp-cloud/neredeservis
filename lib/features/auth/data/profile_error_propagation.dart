import '../../../core/errors/error_codes.dart';
import '../../../core/exceptions/app_exception.dart';
import 'profile_callable_exception.dart';

AppException propagateProfileCallableException({
  required String callableName,
  required Object error,
}) {
  if (error is ProfileCallableException) {
    return _toAppException(error, cause: error);
  }

  if (error is AppException) {
    return error;
  }

  final mapped = mapProfileCallableException(
    callableName: callableName,
    error: error,
  );
  return _toAppException(mapped, cause: error);
}

AppException _toAppException(
  ProfileCallableException exception, {
  required Object cause,
}) {
  final code = switch (exception.code) {
    ProfileCallableErrorCode.invalidArgument => ErrorCodes.invalidArgument,
    ProfileCallableErrorCode.permissionDenied => ErrorCodes.permissionDenied,
    ProfileCallableErrorCode.failedPrecondition =>
      ErrorCodes.failedPrecondition,
    ProfileCallableErrorCode.resourceExhausted => ErrorCodes.resourceExhausted,
    ProfileCallableErrorCode.unauthenticated => ErrorCodes.unauthenticated,
    ProfileCallableErrorCode.unavailable => ErrorCodes.unavailable,
    ProfileCallableErrorCode.unknown => ErrorCodes.unknown,
  };

  return AppException(
    code: code,
    message: exception.message,
    cause: cause,
  );
}
