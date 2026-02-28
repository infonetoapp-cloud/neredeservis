import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_trip_detail_bootstrap_repository.dart';

class FirebaseDriverTripDetailBootstrapRepository
    implements DriverTripDetailBootstrapRepository {
  FirebaseDriverTripDetailBootstrapRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<DriverTripDetailBootstrapRawData> loadRawData({
    required String routeId,
    required String? tripId,
  }) async {
    final routeRef = _firestore.collection('routes').doc(routeId);
    final futures = <Future<dynamic>>[
      routeRef.get(),
      routeRef.collection('stops').orderBy('order').limit(120).get(),
      routeRef.collection('passengers').limit(300).get(),
    ];
    if (tripId != null) {
      futures.add(_firestore.collection('trips').doc(tripId).get());
    }

    final results = await Future.wait<dynamic>(futures);
    final routeSnapshot = results[0] as DocumentSnapshot<Map<String, dynamic>>;
    final stopsSnapshot = results[1] as QuerySnapshot<Map<String, dynamic>>;
    final passengersSnapshot =
        results[2] as QuerySnapshot<Map<String, dynamic>>;

    Map<String, dynamic>? tripData;
    if (tripId != null && results.length >= 4) {
      final tripSnapshot = results[3] as DocumentSnapshot<Map<String, dynamic>>;
      tripData = tripSnapshot.data();
    } else {
      try {
        final activeTripSnapshot = await _firestore
            .collection('trips')
            .where('routeId', isEqualTo: routeId)
            .where('status', isEqualTo: 'active')
            .limit(1)
            .get();
        if (activeTripSnapshot.docs.isNotEmpty) {
          tripData = activeTripSnapshot.docs.first.data();
        }
      } catch (_) {
        tripData = null;
      }
    }

    final stopRows = stopsSnapshot.docs
        .map(
          (doc) => DriverTripDetailRawStopRow(
            stopId: doc.id,
            stopData: doc.data(),
          ),
        )
        .toList(growable: false);
    final passengerRows = passengersSnapshot.docs
        .map(
          (doc) => DriverTripDetailRawPassengerRow(
            passengerId: doc.id,
            passengerData: doc.data(),
          ),
        )
        .toList(growable: false);

    return DriverTripDetailBootstrapRawData(
      routeData: routeSnapshot.data(),
      stopRows: stopRows,
      passengerRows: passengerRows,
      tripData: tripData,
    );
  }
}
