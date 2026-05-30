import '../../ui/screens/active_trip_screen.dart';

Set<String> resolveDriverFinishTripSkipTodayPassengerIds(
  List<String> passengerIds,
) {
  if (passengerIds.isEmpty) {
    return const <String>{};
  }
  return passengerIds
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toSet();
}

List<ActiveTripPassengerEntry> resolveDriverFinishTripPassengerEntries({
  required List<Map<String, dynamic>> passengerRows,
  required Set<String> skipTodayPassengerIds,
  required List<Map<String, dynamic>> guestSessions,
}) {
  final entries = <ActiveTripPassengerEntry>[];

  for (final row in passengerRows) {
    final passengerId = _nullableToken(row['passengerId'] as String?) ?? '';
    final rawPassengerData = row['passengerData'];
    final passengerData = rawPassengerData is Map<Object?, Object?>
        ? Map<String, dynamic>.from(rawPassengerData)
        : (rawPassengerData is Map<String, dynamic>
            ? rawPassengerData
            : const <String, dynamic>{});
    final rawName = _nullableToken(passengerData['name'] as String?);
    final displayName = rawName ?? 'Yolcu';
    entries.add(
      ActiveTripPassengerEntry(
        passengerUid: passengerId,
        name: displayName,
        isSkipToday: passengerId.isNotEmpty &&
            skipTodayPassengerIds.contains(passengerId),
        isGuest: false,
      ),
    );
  }

  final existingUids = entries
      .map((entry) => entry.passengerUid)
      .where((uid) => uid.isNotEmpty)
      .toSet();
  final nowUtc = DateTime.now().toUtc();
  for (final data in guestSessions) {
    final guestUid = _nullableToken(data['guestUid'] as String?);
    if (guestUid == null || existingUids.contains(guestUid)) {
      continue;
    }

    final expiresAtRaw = _nullableToken(data['expiresAt'] as String?);
    final expiresAt =
        expiresAtRaw == null ? null : DateTime.tryParse(expiresAtRaw)?.toUtc();
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
