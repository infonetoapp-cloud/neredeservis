import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_finish_trip_stream_repository.dart';

class FirebaseDriverFinishTripStreamRepository
    implements DriverFinishTripStreamRepository {
  FirebaseDriverFinishTripStreamRepository({
    required FirebaseFirestore firestore,
  }) : _firestore = firestore;

  final FirebaseFirestore _firestore;

  @override
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchRouteDocument(
    String routeId,
  ) {
    final normalizedRouteId = routeId.trim();
    return _firestore.collection('routes').doc(normalizedRouteId).snapshots();
  }

  @override
  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteStops(String routeId) {
    final normalizedRouteId = routeId.trim();
    return _firestore
        .collection('routes')
        .doc(normalizedRouteId)
        .collection('stops')
        .orderBy('order')
        .snapshots();
  }

  @override
  Stream<QuerySnapshot<Map<String, dynamic>>> watchRoutePassengers(
    String routeId,
  ) {
    final normalizedRouteId = routeId.trim();
    return _firestore
        .collection('routes')
        .doc(normalizedRouteId)
        .collection('passengers')
        .snapshots();
  }

  @override
  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteSkipRequestsByDate({
    required String routeId,
    required String dateKey,
  }) {
    final normalizedRouteId = routeId.trim();
    final normalizedDateKey = dateKey.trim();
    return _firestore
        .collection('routes')
        .doc(normalizedRouteId)
        .collection('skip_requests')
        .where('dateKey', isEqualTo: normalizedDateKey)
        .snapshots();
  }

  @override
  Stream<QuerySnapshot<Map<String, dynamic>>> watchActiveGuestSessionsByRoute(
    String routeId,
  ) {
    final normalizedRouteId = routeId.trim();
    return _firestore
        .collection('guest_sessions')
        .where('routeId', isEqualTo: normalizedRouteId)
        .where('status', isEqualTo: 'active')
        .snapshots();
  }
}
