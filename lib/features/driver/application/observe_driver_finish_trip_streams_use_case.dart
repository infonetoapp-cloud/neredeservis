import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_finish_trip_stream_repository.dart';

class ObserveDriverFinishTripStreamsUseCase {
  ObserveDriverFinishTripStreamsUseCase({
    required DriverFinishTripStreamRepository repository,
  }) : _repository = repository;

  final DriverFinishTripStreamRepository _repository;

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchRouteDocument(
    String routeId,
  ) {
    return _repository.watchRouteDocument(routeId);
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteStops(String routeId) {
    return _repository.watchRouteStops(routeId);
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRoutePassengers(
    String routeId,
  ) {
    return _repository.watchRoutePassengers(routeId);
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteSkipRequestsByDate({
    required String routeId,
    required String dateKey,
  }) {
    return _repository.watchRouteSkipRequestsByDate(
      routeId: routeId,
      dateKey: dateKey,
    );
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchActiveGuestSessionsByRoute(
    String routeId,
  ) {
    return _repository.watchActiveGuestSessionsByRoute(routeId);
  }
}
