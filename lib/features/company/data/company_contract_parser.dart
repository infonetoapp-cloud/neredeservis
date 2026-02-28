class CompanyCallableContractException implements Exception {
  const CompanyCallableContractException({
    required this.callable,
    required this.message,
  });

  final String callable;
  final String message;

  @override
  String toString() =>
      'CompanyCallableContractException(callable: $callable, message: $message)';
}

Map<String, dynamic> parseCallableMap(
  Object? raw, {
  required String callable,
}) {
  if (raw is Map<String, dynamic>) {
    return raw;
  }
  if (raw is Map<Object?, Object?>) {
    return Map<String, dynamic>.from(raw);
  }
  throw CompanyCallableContractException(
    callable: callable,
    message: 'Callable response map degil.',
  );
}

List<dynamic> parseRequiredList(
  Map<String, dynamic> payload,
  String key, {
  required String callable,
}) {
  final value = payload[key];
  if (value is List<dynamic>) {
    return value;
  }
  throw CompanyCallableContractException(
    callable: callable,
    message: 'Liste bekleniyordu: $key',
  );
}

String parseRequiredString(
  Map<String, dynamic> payload,
  String key, {
  required String callable,
}) {
  final value = payload[key];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw CompanyCallableContractException(
    callable: callable,
    message: 'String bekleniyordu: $key',
  );
}

String? parseOptionalString(
  Map<String, dynamic> payload,
  String key,
) {
  final value = payload[key];
  if (value is! String) {
    return null;
  }
  final normalized = value.trim();
  return normalized.isEmpty ? null : normalized;
}

bool parseRequiredBool(
  Map<String, dynamic> payload,
  String key, {
  required String callable,
}) {
  final value = payload[key];
  if (value is bool) {
    return value;
  }
  throw CompanyCallableContractException(
    callable: callable,
    message: 'Bool bekleniyordu: $key',
  );
}

int parseOptionalInt(
  Map<String, dynamic> payload,
  String key,
) {
  final value = payload[key];
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return 0;
}

double? parseOptionalDouble(
  Map<String, dynamic> payload,
  String key,
) {
  final value = payload[key];
  if (value is num) {
    return value.toDouble();
  }
  return null;
}
