import '../../domain/data/date_time_validator.dart';

/// Product default delay threshold used for late-departure inference.
const Duration lateDepartureThreshold = Duration(minutes: 10);

/// Returns true when passenger UI should show "Olasi Gecikme" label.
///
/// Rule (runbook 328A):
/// - show only if there is no active trip
/// - and current time is strictly greater than `scheduledTime + 10 dk`
bool shouldShowLateDepartureBanner({
  required DateTime nowUtc,
  required String? scheduledTime,
  required bool hasActiveTrip,
  Duration threshold = lateDepartureThreshold,
}) {
  if (hasActiveTrip) {
    return false;
  }

  final normalizedTime = scheduledTime?.trim();
  if (normalizedTime == null || normalizedTime.isEmpty) {
    return false;
  }

  final scheduledUtc = resolveScheduledDepartureUtcForToday(
    nowUtc: nowUtc,
    scheduledTime: normalizedTime,
  );
  if (scheduledUtc == null) {
    return false;
  }

  return nowUtc.isAfter(scheduledUtc.add(threshold));
}

/// Resolves today's Istanbul scheduled departure (`HH:mm`) into UTC.
DateTime? resolveScheduledDepartureUtcForToday({
  required DateTime nowUtc,
  required String scheduledTime,
}) {
  final normalizedTime = scheduledTime.trim();
  if (!DateTimeValidator.isValidTime(normalizedTime)) {
    return null;
  }

  final istanbulNow = nowUtc.toUtc().add(DateTimeValidator.istanbulUtcOffset);
  final year = istanbulNow.year.toString().padLeft(4, '0');
  final month = istanbulNow.month.toString().padLeft(2, '0');
  final day = istanbulNow.day.toString().padLeft(2, '0');
  final dateKey = '$year-$month-$day';

  return DateTimeValidator.parseIstanbulDateTimeToUtc(
    date: dateKey,
    time: normalizedTime,
  );
}
