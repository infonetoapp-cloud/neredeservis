class AppException implements Exception {
  const AppException({
    required this.code,
    required this.message,
    this.cause,
  });

  final String code;
  final String message;
  final Object? cause;

  @override
  String toString() => 'AppException(code: $code, message: $message)';
}

class NetworkException extends AppException {
  const NetworkException({
    required super.message,
    super.cause,
  }) : super(code: 'network_error');
}

class PermissionException extends AppException {
  const PermissionException({
    required super.message,
    super.cause,
  }) : super(code: 'permission_denied');
}

class ValidationException extends AppException {
  const ValidationException({
    required super.message,
    super.cause,
  }) : super(code: 'validation_error');
}

class ConflictException extends AppException {
  const ConflictException({
    required super.message,
    super.cause,
  }) : super(code: 'conflict');
}
