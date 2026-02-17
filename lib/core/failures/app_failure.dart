import '../exceptions/app_exception.dart';

class AppFailure {
  const AppFailure({
    required this.code,
    required this.message,
    this.retriable = false,
  });

  final String code;
  final String message;
  final bool retriable;
}

class NetworkFailure extends AppFailure {
  const NetworkFailure({
    required super.message,
  }) : super(code: 'network_error', retriable: true);
}

class PermissionFailure extends AppFailure {
  const PermissionFailure({
    required super.message,
  }) : super(code: 'permission_denied', retriable: false);
}

class ValidationFailure extends AppFailure {
  const ValidationFailure({
    required super.message,
  }) : super(code: 'validation_error', retriable: false);
}

class ConflictFailure extends AppFailure {
  const ConflictFailure({
    required super.message,
  }) : super(code: 'conflict', retriable: true);
}

AppFailure mapExceptionToFailure(AppException exception) {
  if (exception is NetworkException) {
    return NetworkFailure(message: exception.message);
  }
  if (exception is PermissionException) {
    return PermissionFailure(message: exception.message);
  }
  if (exception is ValidationException) {
    return ValidationFailure(message: exception.message);
  }
  if (exception is ConflictException) {
    return ConflictFailure(message: exception.message);
  }
  return AppFailure(
    code: exception.code,
    message: exception.message,
    retriable: false,
  );
}
