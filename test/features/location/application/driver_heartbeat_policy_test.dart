import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/application/driver_heartbeat_policy.dart';
import 'package:neredeservis/features/location/application/location_freshness.dart';

void main() {
  test('live freshness maps to green heartbeat by default', () {
    final snapshot = resolveDriverHeartbeatSnapshot(
      freshness: LiveSignalFreshness.live,
      lastSeenAgo: 'simdi',
      degradeModeEnabled: false,
    );

    expect(snapshot.band, ConnectionHeartbeatBand.green);
    expect(snapshot.subtitle, 'simdi');
  });

  test('live freshness is downgraded to yellow in degrade mode', () {
    final snapshot = resolveDriverHeartbeatSnapshot(
      freshness: LiveSignalFreshness.live,
      lastSeenAgo: '5 sn once',
      degradeModeEnabled: true,
    );

    expect(snapshot.band, ConnectionHeartbeatBand.yellow);
    expect(snapshot.subtitle, '5 sn once | Pil riski var');
  });

  test('mild and stale freshness both map to yellow', () {
    final mild = resolveDriverHeartbeatSnapshot(
      freshness: LiveSignalFreshness.mild,
      lastSeenAgo: '40 sn once',
      degradeModeEnabled: false,
    );
    final stale = resolveDriverHeartbeatSnapshot(
      freshness: LiveSignalFreshness.stale,
      lastSeenAgo: '3 dk once',
      degradeModeEnabled: false,
    );

    expect(mild.band, ConnectionHeartbeatBand.yellow);
    expect(stale.band, ConnectionHeartbeatBand.yellow);
  });

  test('lost freshness maps to red with fallback subtitle', () {
    final snapshot = resolveDriverHeartbeatSnapshot(
      freshness: LiveSignalFreshness.lost,
      lastSeenAgo: null,
      degradeModeEnabled: false,
    );

    expect(snapshot.band, ConnectionHeartbeatBand.red);
    expect(snapshot.subtitle, 'Veri yok');
  });
}
