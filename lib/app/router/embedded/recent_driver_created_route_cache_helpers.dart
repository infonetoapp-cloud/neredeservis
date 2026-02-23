part of '../app_router.dart';

List<_RecentDriverCreatedRouteStub> _readRecentDriverCreatedRoutes({
  required String uid,
}) {
  _pruneRecentDriverCreatedRoutesCache();
  return _recentDriverCreatedRouteStubsByRouteId.values
      .where((stub) => stub.uid == uid)
      .toList(growable: false)
    ..sort((a, b) => b.createdAtUtc.compareTo(a.createdAtUtc));
}

_RecentDriverCreatedRouteStub? _readRecentDriverCreatedRouteById({
  required String uid,
  required String routeId,
}) {
  _pruneRecentDriverCreatedRoutesCache();
  final stub = _recentDriverCreatedRouteStubsByRouteId[routeId];
  if (stub == null || stub.uid != uid) {
    return null;
  }
  return stub;
}

void _pruneRecentDriverCreatedRoutesCache() {
  final nowUtc = DateTime.now().toUtc();
  final expiredIds = <String>[];
  for (final entry in _recentDriverCreatedRouteStubsByRouteId.entries) {
    final age = nowUtc.difference(entry.value.createdAtUtc);
    if (age > const Duration(hours: 12)) {
      expiredIds.add(entry.key);
    }
  }
  for (final routeId in expiredIds) {
    _recentDriverCreatedRouteStubsByRouteId.remove(routeId);
  }
  if (_recentDriverCreatedRouteStubsByRouteId.length <= 80) {
    return;
  }
  final sortedKeys = _recentDriverCreatedRouteStubsByRouteId.entries.toList()
    ..sort((a, b) => b.value.createdAtUtc.compareTo(a.value.createdAtUtc));
  for (final overflow in sortedKeys.skip(80)) {
    _recentDriverCreatedRouteStubsByRouteId.remove(overflow.key);
  }
}

Future<void> _hydrateRecentDriverCreatedRoutesForUid({
  required String uid,
}) async {
  final normalizedUid = uid.trim();
  if (normalizedUid.isEmpty) {
    return;
  }
  if (_recentDriverCreatedRouteStubsHydratedUids.contains(normalizedUid)) {
    return;
  }
  _recentDriverCreatedRouteStubsHydratedUids.add(normalizedUid);
  try {
    final rawItems = await _recentDriverCreatedRouteStore.loadRawItemsForUid(
      uid: normalizedUid,
    );
    for (final raw in rawItems) {
      final stub = _recentDriverCreatedRouteStubFromPersistedMap(
        uid: normalizedUid,
        raw: raw,
      );
      if (stub == null) {
        continue;
      }
      final existing = _recentDriverCreatedRouteStubsByRouteId[stub.routeId];
      if (existing == null ||
          existing.createdAtUtc.isBefore(stub.createdAtUtc)) {
        _recentDriverCreatedRouteStubsByRouteId[stub.routeId] = stub;
      }
    }
    _pruneRecentDriverCreatedRoutesCache();
  } catch (_) {
    // Best-effort local hydration only.
  }
}

Future<void> _persistRecentDriverCreatedRoutesForUid({
  required String uid,
}) async {
  final normalizedUid = uid.trim();
  if (normalizedUid.isEmpty) {
    return;
  }
  try {
    _pruneRecentDriverCreatedRoutesCache();
    final encodedItems = _recentDriverCreatedRouteStubsByRouteId.values
        .where((stub) => stub.uid == normalizedUid)
        .toList(growable: false)
      ..sort((a, b) => b.createdAtUtc.compareTo(a.createdAtUtc));
    final payload = encodedItems
        .take(80)
        .map(_recentDriverCreatedRouteStubToPersistedMap)
        .toList(growable: false);
    await _recentDriverCreatedRouteStore.saveRawItemsForUid(
      uid: normalizedUid,
      items: payload,
    );
  } catch (_) {
    // Best-effort local persistence only.
  }
}
