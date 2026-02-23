import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_trip_history_repository.dart';

class FirebaseDriverTripHistoryRepository
    implements DriverTripHistoryRepository {
  FirebaseDriverTripHistoryRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<DriverTripHistoryRawData> loadRawData({
    required String driverUid,
  }) async {
    final tripsSnapshot = await _firestore
        .collection('trips')
        .where('driverId', isEqualTo: driverUid)
        .limit(180)
        .get();
    if (tripsSnapshot.docs.isEmpty) {
      return const DriverTripHistoryRawData();
    }

    final tripRows = tripsSnapshot.docs
        .map(
          (doc) => DriverTripHistoryRawTripRow(
            tripId: doc.id,
            tripData: doc.data(),
          ),
        )
        .toList(growable: false);

    final routeIds = <String>{};
    for (final row in tripRows) {
      final routeId = _readTrimmedString(row.tripData['routeId']);
      if (routeId != null) {
        routeIds.add(routeId);
      }
    }

    var routesById = <String, Map<String, dynamic>>{};
    try {
      routesById = await _fetchCollectionDocumentsByIds(
        collectionPath: 'routes',
        documentIds: routeIds,
      );
    } catch (_) {
      routesById = <String, Map<String, dynamic>>{};
    }

    return DriverTripHistoryRawData(
      tripRows: tripRows,
      routesById: routesById,
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

  String? _readTrimmedString(Object? raw) {
    if (raw is! String) {
      return null;
    }
    final value = raw.trim();
    return value.isEmpty ? null : value;
  }
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
