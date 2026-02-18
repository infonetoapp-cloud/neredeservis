class PhoneMaskingHelper {
  const PhoneMaskingHelper._();

  static String mask(
    String? phone, {
    int prefixVisibleDigits = 3,
    int suffixVisibleDigits = 2,
    String replacement = '*',
  }) {
    if (phone == null || phone.trim().isEmpty) {
      return '';
    }
    final chars = phone.split('');
    final digitIndexes = <int>[];
    for (var i = 0; i < chars.length; i++) {
      if (_isDigit(chars[i])) {
        digitIndexes.add(i);
      }
    }
    if (digitIndexes.isEmpty) {
      return '';
    }

    var prefix = prefixVisibleDigits < 0 ? 0 : prefixVisibleDigits;
    var suffix = suffixVisibleDigits < 0 ? 0 : suffixVisibleDigits;

    if (prefix + suffix >= digitIndexes.length) {
      if (digitIndexes.length <= 2) {
        prefix = 1;
        suffix = 0;
      } else {
        prefix = 1;
        suffix = 1;
      }
    }

    final reveal = <int>{};
    reveal.addAll(digitIndexes.take(prefix));
    reveal.addAll(digitIndexes.skip(digitIndexes.length - suffix));

    for (final index in digitIndexes) {
      if (!reveal.contains(index)) {
        chars[index] = replacement;
      }
    }

    return chars.join();
  }

  static bool _isDigit(String value) {
    final code = value.codeUnitAt(0);
    return code >= 48 && code <= 57;
  }
}
