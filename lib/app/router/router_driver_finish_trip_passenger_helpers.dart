import 'package:cloud_firestore/cloud_firestore.dart';

import '../../ui/screens/active_trip_screen.dart';

Set<String> resolveDriverFinishTripSkipTodayPassengerIds(
  QuerySnapshot<Map<String, dynamic>>? snapshot,
) {
  if (snapshot == null || snapshot.docs.isEmpty) {
    return const <String>{};
  }
  final ids = <String>{};
  for (final doc in snapshot.docs) {
    final data = doc.data();
    final passengerId = (data['passengerId'] as String?)?.trim();
    if (passengerId != null && passengerId.isNotEmpty) {
      ids.add(passengerId);
      continue;
    }
    final rawId = doc.id.trim();
    final separatorIndex = rawId.indexOf('_');
    if (separatorIndex > 0) {
      ids.add(rawId.substring(0, separatorIndex));
    }
  }
  return ids;
}

List<ActiveTripPassengerEntry> resolveDriverFinishTripPassengerEntries({
  required QuerySnapshot<Map<String, dynamic>>? passengersSnapshot,
  required Set<String> skipTodayPassengerIds,
  required QuerySnapshot<Map<String, dynamic>>? guestSessionsSnapshot,
}) {
  final entries = <ActiveTripPassengerEntry>[];

  if (passengersSnapshot != null) {
    for (final doc in passengersSnapshot.docs) {
      final data = doc.data();
      final rawName = (data['name'] as String?)?.trim();
      final displayName =
          (rawName == null || rawName.isEmpty) ? 'Yolcu' : rawName;
      entries.add(
        ActiveTripPassengerEntry(
          passengerUid: doc.id,
          name: displayName,
          isSkipToday: skipTodayPassengerIds.contains(doc.id),
          isGuest: false,
        ),
      );
    }
  }

  final existingUids = entries
      .map((entry) => entry.passengerUid)
      .where((uid) => uid.isNotEmpty)
      .toSet();
  final nowUtc = DateTime.now().toUtc();
  if (guestSessionsSnapshot != null) {
    for (final doc in guestSessionsSnapshot.docs) {
      final data = doc.data();
      final guestUid = _nullableToken(data['guestUid'] as String?);
      if (guestUid == null || existingUids.contains(guestUid)) {
        continue;
      }

      final expiresAtRaw = _nullableToken(data['expiresAt'] as String?);
      final expiresAt = expiresAtRaw == null
          ? null
          : DateTime.tryParse(expiresAtRaw)?.toUtc();
      if (expiresAt == null || !expiresAt.isAfter(nowUtc)) {
        continue;
      }

      final rawName = _nullableToken(data['guestDisplayName'] as String?) ??
          _nullableToken(data['name'] as String?);
      final displayName =
          (rawName == null || rawName.isEmpty) ? 'Misafir' : rawName;
      entries.add(
        ActiveTripPassengerEntry(
          passengerUid: guestUid,
          name: displayName,
          isSkipToday: false,
          isGuest: true,
        ),
      );
      existingUids.add(guestUid);
    }
  }

  if (entries.isEmpty) {
    return const <ActiveTripPassengerEntry>[];
  }

  entries.sort((left, right) {
    if (left.isSkipToday != right.isSkipToday) {
      return left.isSkipToday ? 1 : -1;
    }
    if (left.isGuest != right.isGuest) {
      return left.isGuest ? 1 : -1;
    }
    return left.name.toLowerCase().compareTo(right.name.toLowerCase());
  });
  return entries;
}

int? resolveDriverFinishTripPassengersAtNextStop(
  List<ActiveTripPassengerEntry> entries,
) {
  if (entries.isEmpty) {
    return null;
  }
  return entries.where((entry) => !entry.isSkipToday && !entry.isGuest).length;
}

String? _nullableToken(String? value) {
  final token = value?.trim();
  if (token == null || token.isEmpty) {
    return null;
  }
  return token;
}
