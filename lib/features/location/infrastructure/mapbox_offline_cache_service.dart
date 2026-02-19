import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class MapboxCachePoint {
  const MapboxCachePoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class MapboxOfflineCacheConfig {
  const MapboxOfflineCacheConfig({
    this.tileCacheMb = 256,
    this.stylePreloadEnabled = true,
    this.styleUri = MapboxStyles.STANDARD,
    this.tileRegionId = 'neredeservis-frequent-corridor-v1',
    this.minZoom = 8,
    this.maxZoom = 16,
    this.corridorPaddingKm = 1.8,
  })  : assert(tileCacheMb > 0),
        assert(minZoom >= 0),
        assert(maxZoom >= minZoom),
        assert(corridorPaddingKm > 0);

  final int tileCacheMb;
  final bool stylePreloadEnabled;
  final String styleUri;
  final String tileRegionId;
  final int minZoom;
  final int maxZoom;
  final double corridorPaddingKm;
}

abstract class MapboxOfflineCacheBackend {
  Future<void> setTileStoreUsageModeReadAndUpdate();

  Future<void> setDiskQuotaBytes(int bytes);

  Future<void> preloadStylePack({
    required String styleUri,
    required bool acceptExpired,
    required Map<String, Object?> metadata,
  });

  Future<void> preloadTileRegion({
    required String regionId,
    required Map<String, Object?> geometry,
    required String styleUri,
    required int minZoom,
    required int maxZoom,
    required bool acceptExpired,
    required Map<String, Object?> metadata,
  });
}

class MapboxSdkOfflineCacheBackend implements MapboxOfflineCacheBackend {
  OfflineManager? _offlineManager;
  TileStore? _tileStore;
  Future<void>? _setupFuture;

  Future<void> _ensureSetup() async {
    _setupFuture ??= _setup();
    await _setupFuture;
  }

  Future<void> _setup() async {
    _offlineManager = await OfflineManager.create();
    _tileStore = await TileStore.createDefault();
  }

  @override
  Future<void> setTileStoreUsageModeReadAndUpdate() async {
    MapboxMapsOptions.setTileStoreUsageMode(TileStoreUsageMode.READ_AND_UPDATE);
  }

  @override
  Future<void> setDiskQuotaBytes(int bytes) async {
    await _ensureSetup();
    _tileStore?.setDiskQuota(bytes);
  }

  @override
  Future<void> preloadStylePack({
    required String styleUri,
    required bool acceptExpired,
    required Map<String, Object?> metadata,
  }) async {
    await _ensureSetup();
    final loadOptions = StylePackLoadOptions(
      glyphsRasterizationMode:
          GlyphsRasterizationMode.IDEOGRAPHS_RASTERIZED_LOCALLY,
      metadata: metadata,
      acceptExpired: acceptExpired,
    );
    await _offlineManager?.loadStylePack(styleUri, loadOptions, null);
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
    await _ensureSetup();
    final loadOptions = TileRegionLoadOptions(
      geometry: geometry,
      descriptorsOptions: <TilesetDescriptorOptions?>[
        TilesetDescriptorOptions(
          styleURI: styleUri,
          minZoom: minZoom,
          maxZoom: maxZoom,
          stylePackOptions: StylePackLoadOptions(
            glyphsRasterizationMode:
                GlyphsRasterizationMode.IDEOGRAPHS_RASTERIZED_LOCALLY,
            acceptExpired: acceptExpired,
          ),
        ),
      ],
      metadata: metadata,
      acceptExpired: acceptExpired,
      networkRestriction: NetworkRestriction.NONE,
    );
    await _tileStore?.loadTileRegion(regionId, loadOptions, null);
  }
}

class MapboxOfflineCacheService {
  MapboxOfflineCacheService({
    MapboxOfflineCacheBackend? backend,
    MapboxOfflineCacheConfig config = const MapboxOfflineCacheConfig(),
    bool Function()? isMobilePlatform,
  })  : _backend = backend ?? MapboxSdkOfflineCacheBackend(),
        _config = config,
        _isMobilePlatform = isMobilePlatform ?? _defaultIsMobilePlatform;

  static const List<MapboxCachePoint> defaultFrequentRoutePoints =
      <MapboxCachePoint>[
    MapboxCachePoint(lat: 40.7700, lng: 29.3700),
    MapboxCachePoint(lat: 40.7800, lng: 29.4450),
  ];

  static bool _defaultIsMobilePlatform() {
    return !kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS);
  }

  final MapboxOfflineCacheBackend _backend;
  final MapboxOfflineCacheConfig _config;
  final bool Function() _isMobilePlatform;

  Future<void>? _warmupFuture;
  bool _coreSettingsApplied = false;

  Future<void> warmUp({
    required String? mapboxPublicToken,
    List<MapboxCachePoint>? frequentRoutePoints,
  }) async {
    final token = mapboxPublicToken?.trim();
    if (token == null || token.isEmpty || !_isMobilePlatform()) {
      return;
    }
    _warmupFuture ??= _runWarmup(
      frequentRoutePoints: frequentRoutePoints ?? defaultFrequentRoutePoints,
    );
    await _warmupFuture;
  }

  Future<void> _runWarmup({
    required List<MapboxCachePoint> frequentRoutePoints,
  }) async {
    try {
      await _applyCoreSettings();
    } catch (error, stackTrace) {
      _log('Core cache settings failed.', error, stackTrace);
      return;
    }

    if (_config.stylePreloadEnabled) {
      try {
        await _backend.preloadStylePack(
          styleUri: _config.styleUri,
          acceptExpired: true,
          metadata: _buildMetadata(source: 'bootstrap_style_pack'),
        );
      } catch (error, stackTrace) {
        _log('Style pack preload failed.', error, stackTrace);
      }
    }

    final geometry = buildRouteCorridorGeoJson(
      points: frequentRoutePoints,
      paddingKm: _config.corridorPaddingKm,
    );
    if (geometry == null) {
      return;
    }

    try {
      await _backend.preloadTileRegion(
        regionId: _config.tileRegionId,
        geometry: geometry,
        styleUri: _config.styleUri,
        minZoom: _config.minZoom,
        maxZoom: _config.maxZoom,
        acceptExpired: true,
        metadata: _buildMetadata(source: 'bootstrap_frequent_corridor'),
      );
    } catch (error, stackTrace) {
      _log('Tile region preload failed.', error, stackTrace);
    }
  }

  Future<void> _applyCoreSettings() async {
    if (_coreSettingsApplied) {
      return;
    }
    await _backend.setTileStoreUsageModeReadAndUpdate();
    await _backend.setDiskQuotaBytes(_config.tileCacheMb * 1024 * 1024);
    _coreSettingsApplied = true;
  }

  Map<String, Object?> _buildMetadata({required String source}) {
    return <String, Object?>{
      'tag': 'neredeservis-map-cache',
      'source': source,
      'generatedAtMs': DateTime.now().toUtc().millisecondsSinceEpoch,
    };
  }

  @visibleForTesting
  static Map<String, Object?>? buildRouteCorridorGeoJson({
    required List<MapboxCachePoint> points,
    required double paddingKm,
  }) {
    if (points.isEmpty || paddingKm <= 0) {
      return null;
    }

    var minLat = points.first.lat;
    var maxLat = points.first.lat;
    var minLng = points.first.lng;
    var maxLng = points.first.lng;
    for (final point in points.skip(1)) {
      if (point.lat < minLat) {
        minLat = point.lat;
      }
      if (point.lat > maxLat) {
        maxLat = point.lat;
      }
      if (point.lng < minLng) {
        minLng = point.lng;
      }
      if (point.lng > maxLng) {
        maxLng = point.lng;
      }
    }

    final midLat = (minLat + maxLat) / 2;
    final latPadding = paddingKm / 110.574;
    final longitudeKmAtMidLat =
        (111.320 * math.cos(midLat * (math.pi / 180))).abs();
    final lngPadding = paddingKm / math.max(longitudeKmAtMidLat, 1e-6);

    final paddedMinLat = minLat - latPadding;
    final paddedMaxLat = maxLat + latPadding;
    final paddedMinLng = minLng - lngPadding;
    final paddedMaxLng = maxLng + lngPadding;

    final ring = <List<double>>[
      <double>[paddedMinLng, paddedMinLat],
      <double>[paddedMaxLng, paddedMinLat],
      <double>[paddedMaxLng, paddedMaxLat],
      <double>[paddedMinLng, paddedMaxLat],
      <double>[paddedMinLng, paddedMinLat],
    ];

    return <String, Object?>{
      'type': 'Polygon',
      'coordinates': <List<List<double>>>[ring],
    };
  }

  void _log(String message, Object error, StackTrace stackTrace) {
    debugPrint('MapboxOfflineCacheService: $message $error');
    debugPrintStack(stackTrace: stackTrace);
  }
}
