class SrvCodeValidator {
  const SrvCodeValidator._();

  static const String alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  static const int length = 6;
  static final RegExp _regex =
      RegExp(r'^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$');

  static bool isValid(String code) {
    return _regex.hasMatch(code);
  }

  static String normalize(String code) {
    return code.trim().toUpperCase();
  }

  static bool isNormalizedAndValid(String code) {
    final normalized = normalize(code);
    return normalized == code && isValid(code);
  }

  static void assertValid(String code) {
    if (!isValid(code)) {
      throw const FormatException(
        'Invalid SRV code. Expected 6 chars from A-Z2-9 without I,O,1,0.',
      );
    }
  }
}
