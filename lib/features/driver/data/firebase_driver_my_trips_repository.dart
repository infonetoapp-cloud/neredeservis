import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_my_trips_repository.dart';

class FirebaseDriverMyTripsRepository implements DriverMyTripsRepository {
  FirebaseDriverMyTripsRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<DriverMyTripsRawData> loadRawData({
    required String driverUid,
  }) async {
    final routesCollection = _firestore.collection('routes');
    final routeSnapshots = <QuerySnapshot<Map<String, dynamic>>>[];
    final ownedRoutesFuture = routesCollection
        .where('driverId', isEqualTo: driverUid)
        .limit(80)
        .get();
    final sharedRoutesFuture = routesCollection
        .where('authorizedDriverIds', arrayContains: driverUid)
        .limit(80)
        .get();
    try {
      routeSnapshots.add(await ownedRoutesFuture);
    } catch (_) {
      // Best-effort: keep loading from other sources.
    }
    try {
      routeSnapshots.add(await sharedRoutesFuture);
    } catch (_) {
      // Some environments may temporarily block authorizedDriverIds query.
    }

    final managedRouteDocs = <String, Map<String, dynamic>>{};
    for (final snapshot in routeSnapshots) {
      for (final doc in snapshot.docs) {
        final data = doc.data();
        if (data['isArchived'] == true) {
          continue;
        }
        managedRouteDocs[doc.id] = data;
      }
    }

    QuerySnapshot<Map<String, dynamic>>? tripsSnapshot;
    try {
      tripsSnapshot = await _firestore
          .collection('trips')
          .where('driverId', isEqualTo: driverUid)
          .limit(220)
          .get();
    } catch (_) {
      tripsSnapshot = null;
    }

    final tripRows = <DriverMyTripsRawTripRow>[];
    final routeIdsFromTrips = <String>{};
    for (final doc in tripsSnapshot?.docs ??
        const <QueryDocumentSnapshot<Map<String, dynamic>>>[]) {
      final tripData = doc.data();
      tripRows.add(DriverMyTripsRawTripRow(tripId: doc.id, tripData: tripData));
      final routeId = _readTrimmedString(tripData['routeId']);
      if (routeId != null) {
        routeIdsFromTrips.add(routeId);
      }
    }

    final missingRouteIds = routeIdsFromTrips
        .where((routeId) => !managedRouteDocs.containsKey(routeId))
        .toSet();
    if (missingRouteIds.isNotEmpty) {
      try {
        final fetched = await _fetchCollectionDocumentsByIds(
          collectionPath: 'routes',
          documentIds: missingRouteIds,
        );
        managedRouteDocs.addAll(fetched);
      } catch (_) {
        // Best-effort; history cards can still render fallback route names.
      }
    }

    return DriverMyTripsRawData(
      managedRouteDocs: managedRouteDocs,
      tripRows: tripRows,
    );
  }

  Future<Map<String, Map<String, dynamic>>> _fetchCollectionDocumentsByIds({
    required String collectionPath,
    required Set<String> documentIds,
  }) async {
    if (documentIds.isEmpty) {
      return const <String, Map<String, dynamic>>{};
    }

    final ids = documentIds.toList(growable: false);
    final snapshots = await Future.wait<QuerySnapshot<Map<String, dynamic>>>(
      _chunkList(ids, 10)
          .map(
            (chunk) => _firestore
                .collection(collectionPath)
                .where(FieldPath.documentId, whereIn: chunk)
                .get(),
          )
          .toList(growable: false),
    );

    final results = <String, Map<String, dynamic>>{};
    for (final snapshot in snapshots) {
      for (final doc in snapshot.docs) {
        results[doc.id] = doc.data();
      }
    }
    return results;
  }
}

String? _readTrimmedString(Object? raw) {
  if (raw is! String) {
    return null;
  }
  final normalized = raw.trim();
  return normalized.isEmpty ? null : normalized;
}

Iterable<List<T>> _chunkList<T>(List<T> values, int size) sync* {
  if (size <= 0) {
    yield values;
    return;
  }
  for (var index = 0; index < values.length; index += size) {
    final end = (index + size < values.length) ? index + size : values.length;
    yield values.sublist(index, end);
  }
}
