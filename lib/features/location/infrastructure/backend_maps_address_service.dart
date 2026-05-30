import '../../backend/data/mobile_backend_api_client.dart';
import 'google_places_address_service.dart';

class BackendMapsAddressService implements AddressAutocompleteGateway {
  BackendMapsAddressService({
    MobileBackendApiClient? apiClient,
  })  : _apiClient = apiClient ?? MobileBackendApiClient(),
        _ownsApiClient = apiClient == null;

  final MobileBackendApiClient _apiClient;
  final bool _ownsApiClient;
  final Map<String, AddressPlaceDetails> _detailsByPlaceId =
      <String, AddressPlaceDetails>{};

  @override
  Future<List<AddressAutocompleteSuggestion>> suggest({
    required String query,
    required String sessionToken,
    String languageCode = 'tr',
    String regionCode = 'TR',
  }) async {
    final normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return const <AddressAutocompleteSuggestion>[];
    }

    try {
      final payload = await _apiClient.getJson(
        '/api/maps/search',
        queryParameters: <String, dynamic>{
          'q': normalizedQuery,
          'limit': 6,
        },
      );

      final rawItems = payload['items'];
      if (rawItems is! List) {
        return const <AddressAutocompleteSuggestion>[];
      }

      final suggestions = <AddressAutocompleteSuggestion>[];
      for (final rawItem in rawItems) {
        if (rawItem is! Map) {
          continue;
        }

        final item = Map<String, dynamic>.from(rawItem);
        final placeId = _asNonEmptyString(item['id']);
        final title = _asNonEmptyString(item['shortName']) ??
            _asNonEmptyString(item['label']) ??
            _asNonEmptyString(item['displayName']);
        final address = _asNonEmptyString(item['displayName']) ??
            _asNonEmptyString(item['label']) ??
            title;
        final lat = _asDouble(item['lat']);
        final lng = _asDouble(item['lng']);

        if (placeId == null ||
            title == null ||
            address == null ||
            lat == null ||
            lng == null) {
          continue;
        }

        final details = AddressPlaceDetails(
          placeId: placeId,
          title: title,
          address: address,
          lat: lat,
          lng: lng,
        );
        _detailsByPlaceId[placeId] = details;
        suggestions.add(
          AddressAutocompleteSuggestion(
            placeId: placeId,
            title: title,
            address: address,
            lat: lat,
            lng: lng,
            hasPreciseLocation: true,
          ),
        );
      }

      return suggestions;
    } catch (_) {
      return const <AddressAutocompleteSuggestion>[];
    }
  }

  @override
  Future<AddressPlaceDetails?> getPlaceDetails({
    required String placeId,
    required String sessionToken,
    String languageCode = 'tr',
    String regionCode = 'TR',
  }) async {
    final normalizedPlaceId = placeId.trim();
    if (normalizedPlaceId.isEmpty) {
      return null;
    }
    return _detailsByPlaceId[normalizedPlaceId];
  }

  @override
  void dispose() {
    if (_ownsApiClient) {
      _apiClient.dispose();
    }
  }

  static String? _asNonEmptyString(Object? value) {
    if (value is! String) {
      return null;
    }
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  static double? _asDouble(Object? value) {
    if (value is num) {
      final normalized = value.toDouble();
      return normalized.isFinite ? normalized : null;
    }
    if (value is String) {
      final normalized = double.tryParse(value.trim());
      return normalized != null && normalized.isFinite ? normalized : null;
    }
    return null;
  }
}
