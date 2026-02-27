Map<String, dynamic>? mapFromRouterDynamicValue(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is! Map<Object?, Object?>) {
    return null;
  }

  final output = <String, dynamic>{};
  for (final entry in value.entries) {
    output[entry.key.toString()] = entry.value;
  }
  return output;
}

double? parseFiniteRouterDouble(Object? value) {
  if (value is num) {
    final number = value.toDouble();
    return number.isFinite ? number : null;
  }
  if (value is String) {
    final parsed = double.tryParse(value.trim());
    if (parsed == null || !parsed.isFinite) {
      return null;
    }
    return parsed;
  }
  return null;
}
