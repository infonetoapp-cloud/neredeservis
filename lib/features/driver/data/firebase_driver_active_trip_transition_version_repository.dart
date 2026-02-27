import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_active_trip_transition_version_repository.dart';

class FirebaseDriverActiveTripTransitionVersionRepository
    implements DriverActiveTripTransitionVersionRepository {
  FirebaseDriverActiveTripTransitionVersionRepository({
    required FirebaseFirestore firestore,
  }) : _firestore = firestore;

  final FirebaseFirestore _firestore;

  @override
  Future<int> readCurrentTransitionVersion(String routeId) async {
    final normalizedRouteId = routeId.trim();
    if (normalizedRouteId.isEmpty) {
      return 0;
    }

    final snapshot = await _firestore
        .collection('trips')
        .where('routeId', isEqualTo: normalizedRouteId)
        .where('status', isEqualTo: 'active')
        .limit(1)
        .get();
    final data = snapshot.docs.isEmpty ? null : snapshot.docs.first.data();
    final rawVersion = data?['transitionVersion'];
    if (rawVersion is num) {
      return rawVersion.toInt();
    }
    return 0;
  }
}
