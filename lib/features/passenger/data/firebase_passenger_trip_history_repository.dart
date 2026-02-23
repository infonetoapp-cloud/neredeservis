import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/passenger_trip_history_repository.dart';

class FirebasePassengerTripHistoryRepository
    implements PassengerTripHistoryRepository {
  FirebasePassengerTripHistoryRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<PassengerTripHistoryRawData> loadRawData({
    required String passengerUid,
  }) async {
    final routeSnapshot = await _firestore
        .collection('routes')
        .where('memberIds', arrayContains: passengerUid)
        .limit(80)
        .get();
    if (routeSnapshot.docs.isEmpty) {
      return const PassengerTripHistoryRawData();
    }

    final candidateRoutesById = <String, Map<String, dynamic>>{};
    for (final doc in routeSnapshot.docs) {
      final data = doc.data();
      final ownerDriverId = _readTrimmedString(data['driverId']);
      if (ownerDriverId == passengerUid) {
        continue;
      }
      candidateRoutesById[doc.id] = data;
    }
    if (candidateRoutesById.isEmpty) {
      return const PassengerTripHistoryRawData();
    }

    final sortedRouteIds = candidateRoutesById.entries.toList()
      ..sort((left, right) {
        final leftUpdatedAt = _parseTripHistoryDate(left.value['updatedAt']);
        final rightUpdatedAt = _parseTripHistoryDate(right.value['updatedAt']);
        final leftTime =
            leftUpdatedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final rightTime =
            rightUpdatedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return rightTime.compareTo(leftTime);
      });
    final routeIds = sortedRouteIds
        .take(20)
        .map((entry) => entry.key)
        .toList(growable: false);

    final tripSnapshots =
        await Future.wait<QuerySnapshot<Map<String, dynamic>>>(
      routeIds
          .map(
            (routeId) => _firestore
                .collection('trips')
                .where('routeId', isEqualTo: routeId)
                .limit(80)
                .get(),
          )
          .toList(growable: false),
    );

    final tripRows = <PassengerTripHistoryRawTripRow>[];
    for (final snapshot in tripSnapshots) {
      for (final doc in snapshot.docs) {
        tripRows.add(
          PassengerTripHistoryRawTripRow(
            tripId: doc.id,
            tripData: doc.data(),
          ),
        );
      }
    }
    if (tripRows.isEmpty) {
      return PassengerTripHistoryRawData(
        candidateRoutesById: candidateRoutesById,
      );
    }

    final driverIds = <String>{};
    for (final row in tripRows) {
      final routeId = _readTrimmedString(row.tripData['routeId']);
      final routeData = routeId == null ? null : candidateRoutesById[routeId];
      final driverId = _readTrimmedString(row.tripData['driverId']) ??
          _readTrimmedString(routeData?['driverId']);
      if (driverId != null) {
        driverIds.add(driverId);
      }
    }

    var driversById = <String, Map<String, dynamic>>{};
    try {
      driversById = await _fetchCollectionDocumentsByIds(
        collectionPath: 'drivers',
        documentIds: driverIds,
      );
    } catch (_) {
      driversById = <String, Map<String, dynamic>>{};
    }

    return PassengerTripHistoryRawData(
      tripRows: tripRows,
      candidateRoutesById: candidateRoutesById,
      driversById: driversById,
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

DateTime? _parseTripHistoryDate(Object? raw) {
  if (raw is Timestamp) {
    return raw.toDate().toUtc();
  }
  if (raw is String) {
    final normalized = raw.trim();
    if (normalized.isEmpty) {
      return null;
    }
    return DateTime.tryParse(normalized)?.toUtc();
  }
  return null;
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
