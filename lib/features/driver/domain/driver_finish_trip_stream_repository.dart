import 'package:cloud_firestore/cloud_firestore.dart';

abstract class DriverFinishTripStreamRepository {
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchRouteDocument(
    String routeId,
  );

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteStops(String routeId);

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRoutePassengers(
    String routeId,
  );

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteSkipRequestsByDate({
    required String routeId,
    required String dateKey,
  });

  Stream<QuerySnapshot<Map<String, dynamic>>> watchActiveGuestSessionsByRoute(
    String routeId,
  );
}
