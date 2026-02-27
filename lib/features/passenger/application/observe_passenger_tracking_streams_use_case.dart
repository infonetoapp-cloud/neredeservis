import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/passenger_tracking_stream_repository.dart';

class ObservePassengerTrackingStreamsUseCase {
  ObservePassengerTrackingStreamsUseCase({
    required PassengerTrackingStreamRepository repository,
  }) : _repository = repository;

  final PassengerTrackingStreamRepository _repository;

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchGuestSessionDocument(
    String sessionId,
  ) {
    return _repository.watchGuestSessionDocument(sessionId);
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchRouteDocument(
    String routeId,
  ) {
    return _repository.watchRouteDocument(routeId);
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchActiveTripDocuments(
    String routeId,
  ) {
    return _repository.watchActiveTripDocuments(routeId);
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchDriverDocument(
    String driverId,
  ) {
    return _repository.watchDriverDocument(driverId);
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchPassengerDocument({
    required String routeId,
    required String passengerUid,
  }) {
    return _repository.watchPassengerDocument(
      routeId: routeId,
      passengerUid: passengerUid,
    );
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteAnnouncements(
    String routeId, {
    int limit = 20,
  }) {
    return _repository.watchRouteAnnouncements(routeId, limit: limit);
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchRouteStops(String routeId) {
    return _repository.watchRouteStops(routeId);
  }
}
