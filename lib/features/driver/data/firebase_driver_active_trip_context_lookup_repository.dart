import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_active_trip_context_lookup_repository.dart';

class FirebaseDriverActiveTripContextLookupRepository
    implements DriverActiveTripContextLookupRepository {
  FirebaseDriverActiveTripContextLookupRepository({
    required FirebaseFirestore firestore,
  }) : _firestore = firestore;

  final FirebaseFirestore _firestore;

  @override
  Future<DriverActiveTripContextLookupResult?> resolveActiveTripContext(
    DriverActiveTripContextLookupCommand command,
  ) async {
    final uid = command.uid.trim();
    if (uid.isEmpty) {
      return null;
    }

    final normalizedRouteId = command.routeId?.trim() ?? '';
    final normalizedTripId = command.tripId?.trim() ?? '';
    final initialTransitionVersion = command.initialTransitionVersion;
    final tripsCollection = _firestore.collection('trips');

    if (normalizedTripId.isNotEmpty) {
      final tripSnapshot = await tripsCollection.doc(normalizedTripId).get();
      final tripData = tripSnapshot.data();
      if (tripData != null) {
        final status = (tripData['status'] as String?)?.trim();
        final driverId = (tripData['driverId'] as String?)?.trim();
        final resolvedRouteId =
            (tripData['routeId'] as String?)?.trim() ?? normalizedRouteId;
        final transitionVersion =
            (tripData['transitionVersion'] as num?)?.toInt() ??
                initialTransitionVersion ??
                0;
        if (status == 'active' &&
            driverId == uid &&
            resolvedRouteId.isNotEmpty) {
          return DriverActiveTripContextLookupResult(
            routeId: resolvedRouteId,
            tripId: tripSnapshot.id,
            transitionVersion: transitionVersion,
          );
        }
      }
    }

    if (normalizedRouteId.isEmpty) {
      return null;
    }

    final activeTripSnapshot = await tripsCollection
        .where('routeId', isEqualTo: normalizedRouteId)
        .where('status', isEqualTo: 'active')
        .limit(1)
        .get();
    if (activeTripSnapshot.docs.isEmpty) {
      return null;
    }
    final activeTripDoc = activeTripSnapshot.docs.first;
    final activeTripData = activeTripDoc.data();
    final driverId = (activeTripData['driverId'] as String?)?.trim();
    if (driverId != uid) {
      return null;
    }
    final transitionVersion =
        (activeTripData['transitionVersion'] as num?)?.toInt() ??
            initialTransitionVersion ??
            0;
    return DriverActiveTripContextLookupResult(
      routeId: normalizedRouteId,
      tripId: activeTripDoc.id,
      transitionVersion: transitionVersion,
    );
  }
}
