import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class RouterRecentDriverCreatedRouteStore {
  const RouterRecentDriverCreatedRouteStore({
    this.preferenceKeyPrefix = _defaultPreferenceKeyPrefix,
  });

  static const String _defaultPreferenceKeyPrefix =
      'driver_recent_route_stubs_v1_';

  final String preferenceKeyPrefix;

  Future<List<Map<String, dynamic>>> loadRawItemsForUid({
    required String uid,
  }) async {
    final normalizedUid = uid.trim();
    if (normalizedUid.isEmpty) {
      return const <Map<String, dynamic>>[];
    }

    try {
      final preferences = await SharedPreferences.getInstance();
      final encodedItems = preferences.getStringList(
            '$preferenceKeyPrefix$normalizedUid',
          ) ??
          const <String>[];

      final decodedItems = <Map<String, dynamic>>[];
      for (final encoded in encodedItems) {
        if (encoded.trim().isEmpty) {
          continue;
        }
        final decoded = jsonDecode(encoded);
        if (decoded is! Map) {
          continue;
        }
        decodedItems.add(Map<String, dynamic>.from(decoded));
      }
      return decodedItems;
    } catch (_) {
      return const <Map<String, dynamic>>[];
    }
  }

  Future<void> saveRawItemsForUid({
    required String uid,
    required List<Map<String, dynamic>> items,
  }) async {
    final normalizedUid = uid.trim();
    if (normalizedUid.isEmpty) {
      return;
    }

    try {
      final preferences = await SharedPreferences.getInstance();
      final payload =
          items.map((item) => jsonEncode(item)).toList(growable: false);
      await preferences.setStringList(
        '$preferenceKeyPrefix$normalizedUid',
        payload,
      );
    } catch (_) {
      // Best-effort local persistence only.
    }
  }
}
