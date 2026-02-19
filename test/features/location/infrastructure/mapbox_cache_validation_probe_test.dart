import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/infrastructure/mapbox_cache_validation_probe.dart';

void main() {
  group('MapboxCacheValidationProbe', () {
    test('records baseline and repeat deltas for same map key', () {
      final logs = <String>[];
      final sink = InMemoryMapboxCacheProbeSink();

      final first = MapboxCacheValidationProbe(
        mapKey: 'driver_active_trip',
        sink: sink,
        logger: logs.add,
      );
      first.onRequestSource(MapboxCacheRequestSource.network);
      first.onRequestSource(MapboxCacheRequestSource.local);
      first.onMapLoaded(loadDurationMs: 900);

      expect(logs, hasLength(1));
      expect(logs.single, contains('baseline'));
      expect(logs.single, contains('network=1'));

      logs.clear();

      final second = MapboxCacheValidationProbe(
        mapKey: 'driver_active_trip',
        sink: sink,
        logger: logs.add,
      );
      second.onRequestSource(MapboxCacheRequestSource.local);
      second.onMapLoaded(loadDurationMs: 650);

      expect(logs, hasLength(1));
      expect(logs.single, contains('repeat'));
      expect(logs.single, contains('delta('));
      expect(logs.single, contains('improved=true'));
    });

    test('ignores events after map loaded is finalized', () {
      final logs = <String>[];
      final sink = InMemoryMapboxCacheProbeSink();
      final probe = MapboxCacheValidationProbe(
        mapKey: 'passenger_tracking',
        sink: sink,
        logger: logs.add,
      );

      probe.onRequestSource(MapboxCacheRequestSource.network);
      probe.onMapLoaded(loadDurationMs: 800);
      probe.onRequestSource(MapboxCacheRequestSource.local);
      probe.onMapLoaded(loadDurationMs: 500);

      expect(logs, hasLength(1));
      expect(logs.single, contains('network=1'));
      expect(logs.single, contains('local=0'));
    });
  });
}
