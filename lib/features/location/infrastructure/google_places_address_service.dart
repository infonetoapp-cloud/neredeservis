import 'dart:convert';

import 'package:http/http.dart' as http;

class AddressAutocompleteSuggestion {
  const AddressAutocompleteSuggestion({
    required this.placeId,
    required this.title,
    required this.address,
  });

  final String placeId;
  final String title;
  final String address;
}

class AddressPlaceDetails {
  const AddressPlaceDetails({
    required this.placeId,
    required this.title,
    required this.address,
    required this.lat,
    required this.lng,
  });

  final String placeId;
  final String title;
  final String address;
  final double lat;
  final double lng;
}

abstract class AddressAutocompleteGateway {
  Future<List<AddressAutocompleteSuggestion>> suggest({
    required String query,
    required String sessionToken,
    String languageCode = 'tr',
    String regionCode = 'TR',
  });

  Future<AddressPlaceDetails?> getPlaceDetails({
    required String placeId,
    required String sessionToken,
    String languageCode = 'tr',
    String regionCode = 'TR',
  });

  void dispose() {}
}

class GooglePlacesAddressService implements AddressAutocompleteGateway {
  GooglePlacesAddressService({
    required String apiKey,
    http.Client? client,
  })  : _apiKey = apiKey.trim(),
        _client = client ?? http.Client(),
        _ownsClient = client == null;

  static final Uri _autocompleteUri =
      Uri.parse('https://places.googleapis.com/v1/places:autocomplete');

  final String _apiKey;
  final http.Client _client;
  final bool _ownsClient;

  bool get isConfigured => _apiKey.isNotEmpty;

  @override
  Future<List<AddressAutocompleteSuggestion>> suggest({
    required String query,
    required String sessionToken,
    String languageCode = 'tr',
    String regionCode = 'TR',
  }) async {
    if (!isConfigured || query.trim().isEmpty) {
      return const <AddressAutocompleteSuggestion>[];
    }

    final response = await _client.post(
      _autocompleteUri,
      headers: <String, String>{
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': _apiKey,
        'X-Goog-FieldMask':
            'suggestions.placePrediction.place,'
            'suggestions.placePrediction.placeId,'
            'suggestions.placePrediction.text.text,'
            'suggestions.placePrediction.structuredFormat.mainText.text,'
            'suggestions.placePrediction.structuredFormat.secondaryText.text',
      },
      body: jsonEncode(
        <String, Object?>{
          'input': query.trim(),
          'sessionToken': sessionToken,
          'languageCode': languageCode,
          'regionCode': regionCode,
          'includedRegionCodes': const <String>['tr'],
          'includeQueryPredictions': false,
        },
      ),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return const <AddressAutocompleteSuggestion>[];
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      return const <AddressAutocompleteSuggestion>[];
    }

    final rawSuggestions = decoded['suggestions'];
    if (rawSuggestions is! List) {
      return const <AddressAutocompleteSuggestion>[];
    }

    final suggestions = <AddressAutocompleteSuggestion>[];
    for (final rawItem in rawSuggestions) {
      if (rawItem is! Map) {
        continue;
      }
      final item = Map<String, dynamic>.from(rawItem);
      final rawPrediction = item['placePrediction'];
      if (rawPrediction is! Map) {
        continue;
      }
      final prediction = Map<String, dynamic>.from(rawPrediction);
      final placeId = _asNonEmptyString(prediction['placeId']) ??
          _extractPlaceIdFromResourceName(prediction['place']);
      if (placeId == null) {
        continue;
      }
      final structured = prediction['structuredFormat'];
      final mainText = structured is Map
          ? _asNonEmptyString(
              (structured['mainText'] as Map?)?['text'],
            )
          : null;
      final secondaryText = structured is Map
          ? _asNonEmptyString(
              (structured['secondaryText'] as Map?)?['text'],
            )
          : null;
      final fullText = _asNonEmptyString((prediction['text'] as Map?)?['text']);
      final title = (mainText ?? fullText ?? '').trim();
      final address = (secondaryText ?? fullText ?? title).trim();
      if (title.isEmpty || address.isEmpty) {
        continue;
      }
      suggestions.add(
        AddressAutocompleteSuggestion(
          placeId: placeId,
          title: title,
          address: address,
        ),
      );
    }
    return suggestions;
  }

  @override
  Future<AddressPlaceDetails?> getPlaceDetails({
    required String placeId,
    required String sessionToken,
    String languageCode = 'tr',
    String regionCode = 'TR',
  }) async {
    if (!isConfigured || placeId.trim().isEmpty) {
      return null;
    }

    final uri = Uri.https(
      'places.googleapis.com',
      '/v1/places/${placeId.trim()}',
      <String, String>{
        'languageCode': languageCode,
        'regionCode': regionCode,
        if (sessionToken.trim().isNotEmpty) 'sessionToken': sessionToken.trim(),
      },
    );
    final response = await _client.get(
      uri,
      headers: <String, String>{
        'X-Goog-Api-Key': _apiKey,
        'X-Goog-FieldMask': 'id,displayName.text,formattedAddress,location',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return null;
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      return null;
    }
    final id = _asNonEmptyString(decoded['id']) ?? placeId.trim();
    final displayName = _asNonEmptyString((decoded['displayName'] as Map?)?['text']);
    final formattedAddress = _asNonEmptyString(decoded['formattedAddress']);
    final location = decoded['location'];
    if (location is! Map) {
      return null;
    }
    final lat = _asDouble(location['latitude']);
    final lng = _asDouble(location['longitude']);
    if (lat == null || lng == null) {
      return null;
    }
    return AddressPlaceDetails(
      placeId: id,
      title: (displayName ?? formattedAddress ?? 'Adres').trim(),
      address: (formattedAddress ?? displayName ?? 'Adres').trim(),
      lat: lat,
      lng: lng,
    );
  }

  @override
  void dispose() {
    if (_ownsClient) {
      _client.close();
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
      final asDouble = value.toDouble();
      if (asDouble.isFinite) {
        return asDouble;
      }
      return null;
    }
    return null;
  }

  static String? _extractPlaceIdFromResourceName(Object? resourceName) {
    final value = _asNonEmptyString(resourceName);
    if (value == null) {
      return null;
    }
    final segments = value.split('/');
    final candidate = segments.isEmpty ? value : segments.last;
    final trimmed = candidate.trim();
    return trimmed.isEmpty ? null : trimmed;
  }
}
