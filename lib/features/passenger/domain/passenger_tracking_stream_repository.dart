import 'package:cloud_firestore/cloud_firestore.dart';

abstract class PassengerTrackingStreamRepository {
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchGuestSessionDocument(
    String sessionId,
  );

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchRouteDocument(
    String routeId,
  );

  Stream<QuerySnapshot<Map<String, dynamic>>> watchActiveTripDocuments(
    String routeId,
  );

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchDriverDocument(
    String driverId,
  );

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchPassengerDocument({
    required String routeId,
    required String passengerUid,
  });

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteAnnouncements(
    String routeId, {
    int limit = 20,
  });

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteStops(String routeId);
}
