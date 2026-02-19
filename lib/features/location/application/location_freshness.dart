enum LiveSignalFreshness {
  live,
  mild,
  stale,
  lost,
}

LiveSignalFreshness resolveLiveSignalFreshness({
  required DateTime nowUtc,
  required int? timestampMs,
  bool treatMissingAsLive = true,
}) {
  if (timestampMs == null || timestampMs <= 0) {
    return treatMissingAsLive
        ? LiveSignalFreshness.live
        : LiveSignalFreshness.lost;
  }

  final nowMs = nowUtc.millisecondsSinceEpoch;
  final ageMs = nowMs - timestampMs;
  if (ageMs <= 30000) {
    return LiveSignalFreshness.live;
  }
  if (ageMs <= 120000) {
    return LiveSignalFreshness.mild;
  }
  if (ageMs <= 300000) {
    return LiveSignalFreshness.stale;
  }
  return LiveSignalFreshness.lost;
}

String? formatLastSeenAgo({
  required DateTime nowUtc,
  required int? timestampMs,
}) {
  if (timestampMs == null || timestampMs <= 0) {
    return null;
  }

  final nowMs = nowUtc.millisecondsSinceEpoch;
  final ageSeconds = ((nowMs - timestampMs) / 1000).floor();
  final safeAgeSeconds = ageSeconds < 0 ? 0 : ageSeconds;

  if (safeAgeSeconds < 5) {
    return 'simdi';
  }
  if (safeAgeSeconds < 60) {
    return '$safeAgeSeconds sn once';
  }

  final minutes = safeAgeSeconds ~/ 60;
  if (minutes < 60) {
    return '$minutes dk once';
  }

  final hours = minutes ~/ 60;
  return '$hours sa once';
}

int? parseLiveLocationTimestampMs(Object? rawValue) {
  if (rawValue is num) {
    return rawValue.toInt();
  }
  if (rawValue is! String) {
    return null;
  }

  final trimmed = rawValue.trim();
  if (trimmed.isEmpty) {
    return null;
  }

  final asInt = int.tryParse(trimmed);
  if (asInt != null) {
    return asInt;
  }

  final asDate = DateTime.tryParse(trimmed)?.toUtc();
  return asDate?.millisecondsSinceEpoch;
}
