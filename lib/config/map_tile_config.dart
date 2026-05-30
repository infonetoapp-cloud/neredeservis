class MapTileConfig {
  const MapTileConfig._();

  static const String _defaultUrlTemplate =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const String _defaultAttribution = 'OpenStreetMap contributors';
  static const int _defaultMaxZoom = 19;

  static String get urlTemplate {
    const raw = String.fromEnvironment(
      'MAP_TILE_URL',
      defaultValue: _defaultUrlTemplate,
    );
    final trimmed = raw.trim();
    return trimmed.isEmpty ? _defaultUrlTemplate : trimmed;
  }

  static String get attribution {
    const raw = String.fromEnvironment(
      'MAP_TILE_ATTRIBUTION',
      defaultValue: _defaultAttribution,
    );
    final trimmed = raw.trim();
    return trimmed.isEmpty ? _defaultAttribution : trimmed;
  }

  static int get maxZoom {
    const raw = int.fromEnvironment(
      'MAP_TILE_MAX_ZOOM',
      defaultValue: _defaultMaxZoom,
    );
    return raw <= 0 ? _defaultMaxZoom : raw;
  }

  static List<String> get subdomains {
    const raw = String.fromEnvironment(
      'MAP_TILE_SUBDOMAINS',
      defaultValue: '',
    );
    final normalized = raw
        .split(',')
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
    return normalized;
  }

  static bool get usesSubdomains => urlTemplate.contains('{s}');

  static String get userAgentPackageName => 'app.neredeservis.mobile';
}
