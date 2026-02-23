import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_trip_completed_bootstrap_repository.dart';

class FirebaseDriverTripCompletedBootstrapRepository
    implements DriverTripCompletedBootstrapRepository {
  FirebaseDriverTripCompletedBootstrapRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<DriverTripCompletedBootstrapRawData> loadRawData({
    required String routeId,
    required String tripId,
  }) async {
    final routeRef = _firestore.collection('routes').doc(routeId);
    final tripRef = _firestore.collection('trips').doc(tripId);
    final futures = await Future.wait<dynamic>(<Future<dynamic>>[
      routeRef.get(),
      routeRef.collection('stops').orderBy('order').limit(60).get(),
      routeRef.collection('passengers').get(),
      tripRef.get(),
    ]);

    final routeSnapshot = futures[0] as DocumentSnapshot<Map<String, dynamic>>;
    final stopsSnapshot = futures[1] as QuerySnapshot<Map<String, dynamic>>;
    final passengersSnapshot =
        futures[2] as QuerySnapshot<Map<String, dynamic>>;
    final tripSnapshot = futures[3] as DocumentSnapshot<Map<String, dynamic>>;

    return DriverTripCompletedBootstrapRawData(
      routeData: routeSnapshot.data(),
      stops:
          stopsSnapshot.docs.map((doc) => doc.data()).toList(growable: false),
      passengerCountFromRoutePassengersCollection:
          passengersSnapshot.docs.length,
      tripData: tripSnapshot.data(),
    );
  }
}
