import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/passenger_tracking_stream_repository.dart';

class FirebasePassengerTrackingStreamRepository
    implements PassengerTrackingStreamRepository {
  FirebasePassengerTrackingStreamRepository({
    required FirebaseFirestore firestore,
  }) : _firestore = firestore;

  final FirebaseFirestore _firestore;

  @override
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchGuestSessionDocument(
    String sessionId,
  ) {
    final normalizedSessionId = sessionId.trim();
    return _firestore
        .collection('guest_sessions')
        .doc(normalizedSessionId)
        .snapshots();
  }

  @override
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchRouteDocument(
    String routeId,
  ) {
    final normalizedRouteId = routeId.trim();
    return _firestore.collection('routes').doc(normalizedRouteId).snapshots();
  }

  @override
  Stream<QuerySnapshot<Map<String, dynamic>>> watchActiveTripDocuments(
    String routeId,
  ) {
    final normalizedRouteId = routeId.trim();
    return _firestore
        .collection('trips')
        .where('routeId', isEqualTo: normalizedRouteId)
        .where('status', isEqualTo: 'active')
        .limit(1)
        .snapshots();
  }

  @override
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchDriverDocument(
    String driverId,
  ) {
    final normalizedDriverId = driverId.trim();
    return _firestore.collection('drivers').doc(normalizedDriverId).snapshots();
  }

  @override
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchPassengerDocument({
    required String routeId,
    required String passengerUid,
  }) {
    final normalizedRouteId = routeId.trim();
    final normalizedPassengerUid = passengerUid.trim();
    return _firestore
        .collection('routes')
        .doc(normalizedRouteId)
        .collection('passengers')
        .doc(normalizedPassengerUid)
        .snapshots();
  }

  @override
  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteAnnouncements(
    String routeId, {
    int limit = 20,
  }) {
    final normalizedRouteId = routeId.trim();
    return _firestore
        .collection('announcements')
        .where('routeId', isEqualTo: normalizedRouteId)
        .limit(limit)
        .snapshots();
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
}
