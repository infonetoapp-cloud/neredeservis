import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/infrastructure/mapbox_offline_cache_service.dart';

void main() {
  group('MapboxOfflineCacheService', () {
    test('warmUp skips when token is missing', () async {
      final backend = _FakeMapboxOfflineCacheBackend();
      final service = MapboxOfflineCacheService(
        backend: backend,
        isMobilePlatform: () => true,
      );

      await service.warmUp(mapboxPublicToken: '   ');

      expect(backend.setTileStoreUsageModeCalls, 0);
      expect(backend.setDiskQuotaBytesCalls, 0);
      expect(backend.preloadStylePackCalls, 0);
      expect(backend.preloadTileRegionCalls, 0);
    });

    test('warmUp applies quota, style preload and tile region preload',
        () async {
      final backend = _FakeMapboxOfflineCacheBackend();
      final service = MapboxOfflineCacheService(
        backend: backend,
        isMobilePlatform: () => true,
        config: const MapboxOfflineCacheConfig(
          tileCacheMb: 128,
          stylePreloadEnabled: true,
          tileRegionId: 'test-region',
        ),
      );

      await service.warmUp(mapboxPublicToken: 'pk.test-token');

      expect(backend.setTileStoreUsageModeCalls, 1);
      expect(backend.setDiskQuotaBytesCalls, 1);
      expect(backend.lastDiskQuotaBytes, 128 * 1024 * 1024);
      expect(backend.preloadStylePackCalls, 1);
      expect(backend.preloadTileRegionCalls, 1);
      expect(backend.lastTileRegionId, 'test-region');

      final geometry = backend.lastTileGeometry;
      expect(geometry, isNotNull);
      expect(geometry!['type'], 'Polygon');

      final coordinates = geometry['coordinates'] as List<List<List<double>>>;
      expect(coordinates.length, 1);
      expect(coordinates.first.length, 5);
      expect(coordinates.first.first.first, coordinates.first.last.first);
      expect(coordinates.first.first.last, coordinates.first.last.last);
    });

    test('warmUp is idempotent after first successful run', () async {
      final backend = _FakeMapboxOfflineCacheBackend();
      final service = MapboxOfflineCacheService(
        backend: backend,
        isMobilePlatform: () => true,
      );

      await service.warmUp(mapboxPublicToken: 'pk.first');
      await service.warmUp(mapboxPublicToken: 'pk.second');

      expect(backend.setTileStoreUsageModeCalls, 1);
      expect(backend.setDiskQuotaBytesCalls, 1);
      expect(backend.preloadStylePackCalls, 1);
      expect(backend.preloadTileRegionCalls, 1);
    });

    test('style preload can be disabled', () async {
      final backend = _FakeMapboxOfflineCacheBackend();
      final service = MapboxOfflineCacheService(
        backend: backend,
        isMobilePlatform: () => true,
        config: const MapboxOfflineCacheConfig(
          stylePreloadEnabled: false,
        ),
      );

      await service.warmUp(mapboxPublicToken: 'pk.test');

      expect(backend.preloadStylePackCalls, 0);
      expect(backend.preloadTileRegionCalls, 1);
    });

    test('route corridor geojson expands around route points', () {
      const rawPoints = <MapboxCachePoint>[
        MapboxCachePoint(lat: 40.7700, lng: 29.3700),
        MapboxCachePoint(lat: 40.7800, lng: 29.4450),
      ];

      final geoJson = MapboxOfflineCacheService.buildRouteCorridorGeoJson(
        points: rawPoints,
        paddingKm: 1.0,
      );

      expect(geoJson, isNotNull);
      final ring = (geoJson!['coordinates'] as List<List<List<double>>>).first;
      final latValues = ring.map((point) => point[1]).toList(growable: false);
      final lngValues = ring.map((point) => point[0]).toList(growable: false);

      expect(latValues.reduce(math.min), lessThan(40.7700));
      expect(latValues.reduce(math.max), greaterThan(40.7800));
      expect(lngValues.reduce(math.min), lessThan(29.3700));
      expect(lngValues.reduce(math.max), greaterThan(29.4450));
    });
  });
}

class _FakeMapboxOfflineCacheBackend implements MapboxOfflineCacheBackend {
  int setTileStoreUsageModeCalls = 0;
  int setDiskQuotaBytesCalls = 0;
  int preloadStylePackCalls = 0;
  int preloadTileRegionCalls = 0;

  int? lastDiskQuotaBytes;
  String? lastStyleUri;
  String? lastTileRegionId;
  Map<String, Object?>? lastTileGeometry;

  @override
  Future<void> preloadStylePack({
    required String styleUri,
    required bool acceptExpired,
    required Map<String, Object?> metadata,
  }) async {
    preloadStylePackCalls++;
    lastStyleUri = styleUri;
  }

  @override
  Future<void> preloadTileRegion({
    required String regionId,
    required Map<String, Object?> geometry,
    required String styleUri,
    required int minZoom,
    required int maxZoom,
    required bool acceptExpired,
    required Map<String, Object?> metadata,
  }) async {
    preloadTileRegionCalls++;
    lastTileRegionId = regionId;
    lastTileGeometry = geometry;
  }

  @override
  Future<void> setDiskQuotaBytes(int bytes) async {
    setDiskQuotaBytesCalls++;
    lastDiskQuotaBytes = bytes;
  }

  @override
  Future<void> setTileStoreUsageModeReadAndUpdate() async {
    setTileStoreUsageModeCalls++;
  }
}
