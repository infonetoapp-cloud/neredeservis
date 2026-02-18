class PiiRedactor {
  const PiiRedactor._();

  static final RegExp _emailRegex =
      RegExp(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+\b');
  static final RegExp _phoneRegex =
      RegExp(r'(?<!\w)(?:\+?\d[\d\s\-\(\)]{8,}\d)');
  static final RegExp _srvCodeRegex =
      RegExp(r'\b[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}\b');
  static final RegExp _idempotencyKeyRegex = RegExp(
    r'\b[a-z0-9_]+-[a-z0-9_]+-[a-z0-9]+-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}\b',
  );
  static final RegExp _sensitiveKeyRegex = RegExp(
    r'(phone|email|token|password|idempotency|uid)',
    caseSensitive: false,
  );
  static final RegExp _sensitiveAssignmentRegex = RegExp(
    r'(token|password|uid|owneruid|email|phone|idempotencykey)\s*[:=]\s*([^\s,;|]+)',
    caseSensitive: false,
  );

  static String redactText(String input) {
    var output = input;
    output = output.replaceAllMapped(
      _sensitiveAssignmentRegex,
      (Match match) => '${match.group(1)}=[REDACTED]',
    );
    output = output.replaceAll(_emailRegex, '[EMAIL]');
    output = output.replaceAll(_phoneRegex, '[PHONE]');
    output = output.replaceAll(_idempotencyKeyRegex, '[IDEMPOTENCY_KEY]');
    output = output.replaceAll(_srvCodeRegex, '[SRV_CODE]');
    return output;
  }

  static Map<String, dynamic> redactMap(Map<String, dynamic> source) {
    final output = <String, dynamic>{};
    source.forEach((String key, dynamic value) {
      if (_sensitiveKeyRegex.hasMatch(key)) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = redactDynamic(value);
      }
    });
    return output;
  }

  static dynamic redactDynamic(dynamic value) {
    if (value is String) {
      return redactText(value);
    }
    if (value is Map<String, dynamic>) {
      return redactMap(value);
    }
    if (value is Iterable) {
      return value.map(redactDynamic).toList(growable: false);
    }
    return value;
  }
}
