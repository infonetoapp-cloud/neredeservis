import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_home_route_section_repository.dart';

class FirebaseDriverHomeRouteSectionRepository
    implements DriverHomeRouteSectionRepository {
  FirebaseDriverHomeRouteSectionRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<List<DriverHomeRouteCandidate>> loadCandidateRoutes(String uid) async {
    final routesCollection = _firestore.collection('routes');
    try {
      final ownedFuture =
          routesCollection.where('driverId', isEqualTo: uid).limit(20).get();
      final sharedFuture = routesCollection
          .where('authorizedDriverIds', arrayContains: uid)
          .limit(20)
          .get();

      final snapshots = <QuerySnapshot<Map<String, dynamic>>>[];
      try {
        snapshots.add(await ownedFuture);
      } catch (_) {
        // Keep trying shared routes.
      }
      try {
        snapshots.add(await sharedFuture);
      } catch (_) {
        // Keep owned routes if shared query is denied/missing.
      }

      final merged = <DriverHomeRouteCandidate>[];
      final seenRouteIds = <String>{};
      for (final snapshot in snapshots) {
        for (final doc in snapshot.docs) {
          if (!seenRouteIds.add(doc.id)) {
            continue;
          }
          final data = doc.data();
          if (data['isArchived'] == true) {
            continue;
          }
          final routeNameRaw = (data['name'] as String?)?.trim();
          final routeName = (routeNameRaw == null || routeNameRaw.isEmpty)
              ? _fallbackDriverRouteName
              : routeNameRaw;
          final updatedAtRaw = (data['updatedAt'] as String?)?.trim();
          final updatedAtUtc = DateTime.tryParse(updatedAtRaw ?? '')?.toUtc() ??
              DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
          final ownerUid = (data['driverId'] as String?)?.trim();
          merged.add(
            DriverHomeRouteCandidate(
              routeId: doc.id,
              routeName: routeName,
              updatedAtUtc: updatedAtUtc,
              isOwnedByCurrentDriver: ownerUid == uid,
            ),
          );
        }
      }

      return merged;
    } catch (_) {
      return const <DriverHomeRouteCandidate>[];
    }
  }

  @override
  Future<List<DriverHomeStopSummary>> loadRouteStops(String routeId) async {
    try {
      final snapshot = await _firestore
          .collection('routes')
          .doc(routeId)
          .collection('stops')
          .orderBy('order')
          .limit(40)
          .get();
      if (snapshot.docs.isEmpty) {
        return const <DriverHomeStopSummary>[];
      }
      final stops = <DriverHomeStopSummary>[];
      for (final doc in snapshot.docs) {
        final data = doc.data();
        final nameRaw = (data['name'] as String?)?.trim();
        final name = (nameRaw == null || nameRaw.isEmpty) ? 'Durak' : nameRaw;
        final orderRaw = data['order'];
        final waitingRaw = data['passengersWaiting'];
        stops.add(
          DriverHomeStopSummary(
            stopId: doc.id,
            name: name,
            order: orderRaw is num ? orderRaw.toInt() : 9999,
            passengersWaiting: waitingRaw is num ? waitingRaw.toInt() : null,
          ),
        );
      }
      return stops;
    } catch (_) {
      return const <DriverHomeStopSummary>[];
    }
  }
}

const String _fallbackDriverRouteName = '\u015eof\u00f6r Rotas\u0131';
