import 'location_freshness.dart';

enum ConnectionHeartbeatBand {
  green,
  yellow,
  red,
}

class DriverHeartbeatSnapshot {
  const DriverHeartbeatSnapshot({
    required this.band,
    required this.subtitle,
  });

  final ConnectionHeartbeatBand band;
  final String subtitle;
}

DriverHeartbeatSnapshot resolveDriverHeartbeatSnapshot({
  required LiveSignalFreshness freshness,
  required String? lastSeenAgo,
  required bool degradeModeEnabled,
}) {
  var band = switch (freshness) {
    LiveSignalFreshness.live => ConnectionHeartbeatBand.green,
    LiveSignalFreshness.mild => ConnectionHeartbeatBand.yellow,
    LiveSignalFreshness.stale => ConnectionHeartbeatBand.yellow,
    LiveSignalFreshness.lost => ConnectionHeartbeatBand.red,
  };

  final normalizedLastSeen = _normalizeOptionalText(lastSeenAgo);
  var subtitle = normalizedLastSeen ?? 'simdi';

  if (band == ConnectionHeartbeatBand.red) {
    subtitle = normalizedLastSeen ?? 'Veri yok';
  }

  if (degradeModeEnabled && band == ConnectionHeartbeatBand.green) {
    band = ConnectionHeartbeatBand.yellow;
    subtitle = normalizedLastSeen == null
        ? 'Pil riski var'
        : '$normalizedLastSeen | Pil riski var';
  }

  return DriverHeartbeatSnapshot(
    band: band,
    subtitle: subtitle,
  );
}

String? _normalizeOptionalText(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}
