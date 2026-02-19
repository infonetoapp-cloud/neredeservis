import 'package:flutter/foundation.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

enum MapboxCacheRequestSource {
  network,
  local,
}

class MapboxCacheLoadSnapshot {
  const MapboxCacheLoadSnapshot({
    required this.mapKey,
    required this.loadDurationMs,
    required this.networkRequestCount,
    required this.localRequestCount,
  });

  final String mapKey;
  final int loadDurationMs;
  final int networkRequestCount;
  final int localRequestCount;

  int get totalRequestCount => networkRequestCount + localRequestCount;
}

abstract class MapboxCacheProbeSink {
  MapboxCacheLoadSnapshot? record(MapboxCacheLoadSnapshot snapshot);
}

class InMemoryMapboxCacheProbeSink implements MapboxCacheProbeSink {
  final Map<String, MapboxCacheLoadSnapshot> _latestByMapKey =
      <String, MapboxCacheLoadSnapshot>{};

  @override
  MapboxCacheLoadSnapshot? record(MapboxCacheLoadSnapshot snapshot) {
    final previous = _latestByMapKey[snapshot.mapKey];
    _latestByMapKey[snapshot.mapKey] = snapshot;
    return previous;
  }

  @visibleForTesting
  void clear() {
    _latestByMapKey.clear();
  }
}

class MapboxCacheValidationProbe {
  MapboxCacheValidationProbe({
    required this.mapKey,
    MapboxCacheProbeSink? sink,
    void Function(String message)? logger,
  })  : _sink = sink ?? _sharedProbeSink,
        _logger = logger ?? debugPrint;

  static final InMemoryMapboxCacheProbeSink _sharedProbeSink =
      InMemoryMapboxCacheProbeSink();

  final String mapKey;
  final MapboxCacheProbeSink _sink;
  final void Function(String message) _logger;

  int _networkRequestCount = 0;
  int _localRequestCount = 0;
  bool _completed = false;

  void onRequestSource(MapboxCacheRequestSource source) {
    if (_completed) {
      return;
    }
    if (source == MapboxCacheRequestSource.network) {
      _networkRequestCount++;
    } else {
      _localRequestCount++;
    }
  }

  void onMapboxResourceEvent(mapbox.ResourceEventData eventData) {
    final source = eventData.dataSource == mapbox.DataSourceType.NETWORK
        ? MapboxCacheRequestSource.network
        : MapboxCacheRequestSource.local;
    onRequestSource(source);
  }

  void onMapboxMapLoaded(mapbox.MapLoadedEventData eventData) {
    final loadDurationMs = eventData.timeInterval.end
        .difference(eventData.timeInterval.begin)
        .inMilliseconds;
    onMapLoaded(loadDurationMs: loadDurationMs);
  }

  void onMapLoaded({required int loadDurationMs}) {
    if (_completed) {
      return;
    }
    _completed = true;

    final snapshot = MapboxCacheLoadSnapshot(
      mapKey: mapKey,
      loadDurationMs: loadDurationMs,
      networkRequestCount: _networkRequestCount,
      localRequestCount: _localRequestCount,
    );
    final previous = _sink.record(snapshot);
    if (previous == null) {
      _logger(
        'MapboxCacheProbe[$mapKey] baseline '
        'loadMs=${snapshot.loadDurationMs} '
        'requests(total=${snapshot.totalRequestCount}, '
        'network=${snapshot.networkRequestCount}, '
        'local=${snapshot.localRequestCount})',
      );
      return;
    }

    final loadDeltaMs = snapshot.loadDurationMs - previous.loadDurationMs;
    final networkDelta =
        snapshot.networkRequestCount - previous.networkRequestCount;
    final localDelta = snapshot.localRequestCount - previous.localRequestCount;
    final improved = snapshot.loadDurationMs <= previous.loadDurationMs &&
        snapshot.networkRequestCount <= previous.networkRequestCount;

    _logger(
      'MapboxCacheProbe[$mapKey] repeat '
      'loadMs=${snapshot.loadDurationMs} '
      'requests(total=${snapshot.totalRequestCount}, '
      'network=${snapshot.networkRequestCount}, '
      'local=${snapshot.localRequestCount}) '
      'delta(loadMs=$loadDeltaMs, network=$networkDelta, local=$localDelta, '
      'improved=$improved)',
    );
  }
}
