import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/passenger_primary_membership_lookup_repository.dart';

class FirebasePassengerPrimaryMembershipLookupRepository
    implements PassengerPrimaryMembershipLookupRepository {
  FirebasePassengerPrimaryMembershipLookupRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<PassengerPrimaryMembershipLookupResult?> lookupPrimaryMembership(
    String passengerUid,
  ) async {
    final normalizedUid = passengerUid.trim();
    if (normalizedUid.isEmpty) {
      return null;
    }

    try {
      final routeQuery = await _firestore
          .collection('routes')
          .where('memberIds', arrayContains: normalizedUid)
          .limit(1)
          .get();
      if (routeQuery.docs.isNotEmpty) {
        final summary =
            _toMembershipSummaryFromRouteSnapshot(routeQuery.docs.first);
        if (summary != null) {
          return summary;
        }
      }
    } catch (_) {
      // Fall through to collection-group fallback.
    }

    try {
      final passengerQuery = await _firestore
          .collectionGroup('passengers')
          .where(FieldPath.documentId, isEqualTo: normalizedUid)
          .limit(1)
          .get();
      if (passengerQuery.docs.isEmpty) {
        return null;
      }
      final passengerDoc = passengerQuery.docs.first;
      final routeRef = passengerDoc.reference.parent.parent;
      if (routeRef == null) {
        return null;
      }
      final routeId = routeRef.id.trim();
      if (routeId.isEmpty) {
        return null;
      }

      String? routeName;
      try {
        final routeSnapshot = await routeRef.get();
        routeName = _nullableRouteName(routeSnapshot.data()?['name']);
      } catch (_) {
        routeName = null;
      }

      return PassengerPrimaryMembershipLookupResult(
        routeId: routeId,
        routeName: routeName,
      );
    } catch (_) {
      return null;
    }
  }
}

PassengerPrimaryMembershipLookupResult? _toMembershipSummaryFromRouteSnapshot(
  QueryDocumentSnapshot<Map<String, dynamic>> snapshot,
) {
  final routeId = snapshot.id.trim();
  if (routeId.isEmpty) {
    return null;
  }
  return PassengerPrimaryMembershipLookupResult(
    routeId: routeId,
    routeName: _nullableRouteName(snapshot.data()['name']),
  );
}

String? _nullableRouteName(Object? rawValue) {
  final routeName = rawValue is String ? rawValue.trim() : '';
  if (routeName.isEmpty) {
    return null;
  }
  return routeName;
}
