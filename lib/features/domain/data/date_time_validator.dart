class DateTimeValidator {
  const DateTimeValidator._();

  static final RegExp _timeRegex = RegExp(r'^\d{2}:\d{2}$');
  static final RegExp _dateRegex = RegExp(r'^\d{4}-\d{2}-\d{2}$');

  // Product contract: scheduledTime is interpreted in Europe/Istanbul (UTC+3).
  static const Duration istanbulUtcOffset = Duration(hours: 3);

  static bool isValidTime(String value) {
    if (!_timeRegex.hasMatch(value)) {
      return false;
    }
    final parts = value.split(':');
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) {
      return false;
    }
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }

  static bool isValidDate(String value) {
    if (!_dateRegex.hasMatch(value)) {
      return false;
    }
    final parts = value.split('-');
    final year = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final day = int.tryParse(parts[2]);
    if (year == null || month == null || day == null) {
      return false;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    final parsed = DateTime.utc(year, month, day);
    return parsed.year == year && parsed.month == month && parsed.day == day;
  }

  static DateTime? parseIstanbulDateTimeToUtc({
    required String date,
    required String time,
  }) {
    if (!isValidDate(date) || !isValidTime(time)) {
      return null;
    }

    final dateParts = date.split('-');
    final timeParts = time.split(':');
    final year = int.parse(dateParts[0]);
    final month = int.parse(dateParts[1]);
    final day = int.parse(dateParts[2]);
    final hour = int.parse(timeParts[0]);
    final minute = int.parse(timeParts[1]);

    final istanbulAsUtcClock = DateTime.utc(year, month, day, hour, minute);
    return istanbulAsUtcClock.subtract(istanbulUtcOffset);
  }

  static DateTime normalizeToUtc(DateTime value) {
    return value.toUtc();
  }

  static DateTime? parseUtcTimestamp(String value) {
    try {
      return DateTime.parse(value).toUtc();
    } catch (_) {
      return null;
    }
  }
}
