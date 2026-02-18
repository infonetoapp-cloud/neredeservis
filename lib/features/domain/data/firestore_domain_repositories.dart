import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../core/errors/error_codes.dart';
import '../../../core/exceptions/app_exception.dart';
import '../../../services/repository_interfaces.dart';
import '../entities/announcement_entity.dart';
import '../entities/consent_entity.dart';
import '../entities/driver_entity.dart';
import '../entities/guest_session_entity.dart';
import '../entities/local_ownership_entity.dart';
import '../entities/passenger_profile_entity.dart';
import '../entities/route_entity.dart';
import '../entities/stop_entity.dart';
import '../entities/trip_entity.dart';
import '../entities/user_entity.dart';
import '../mappers/announcement_mapper.dart';
import '../mappers/consent_mapper.dart';
import '../mappers/driver_mapper.dart';
import '../mappers/guest_session_mapper.dart';
import '../mappers/local_ownership_mapper.dart';
import '../mappers/passenger_profile_mapper.dart';
import '../mappers/route_mapper.dart';
import '../mappers/stop_mapper.dart';
import '../mappers/trip_mapper.dart';
import '../mappers/user_mapper.dart';
import '../models/announcement_model.dart';
import '../models/consent_model.dart';
import '../models/driver_model.dart';
import '../models/guest_session_model.dart';
import '../models/local_ownership_model.dart';
import '../models/passenger_profile_model.dart';
import '../models/route_model.dart';
import '../models/stop_model.dart';
import '../models/trip_model.dart';
import '../models/user_model.dart';

class FirestoreUserRepository implements UserRepository {
  FirestoreUserRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('users');

  @override
  Stream<UserEntity?> watchUser(String uid) {
    return _collection.doc(uid).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return UserModel.fromMap(data, uid: snapshot.id).toEntity();
    });
  }

  @override
  Future<UserEntity?> getUser(String uid) async {
    final snapshot = await _collection.doc(uid).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return UserModel.fromMap(data, uid: snapshot.id).toEntity();
  }

  @override
  Future<void> upsertUser(UserEntity user) async {
    final model = userModelFromEntity(user);
    await _collection.doc(user.uid).set(model.toMap(), SetOptions(merge: true));
  }
}

class FirestoreDriverRepository implements DriverRepository {
  FirestoreDriverRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('drivers');

  @override
  Stream<DriverEntity?> watchDriver(String driverId) {
    return _collection.doc(driverId).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return DriverModel.fromMap(data, driverId: snapshot.id).toEntity();
    });
  }

  @override
  Future<DriverEntity?> getDriver(String driverId) async {
    final snapshot = await _collection.doc(driverId).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return DriverModel.fromMap(data, driverId: snapshot.id).toEntity();
  }

  @override
  Future<void> upsertDriver(DriverEntity driver) async {
    final model = driverModelFromEntity(driver);
    await _collection
        .doc(driver.driverId)
        .set(model.toMap(), SetOptions(merge: true));
  }
}

class FirestoreRouteRepository implements RouteRepository {
  FirestoreRouteRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('routes');

  @override
  Stream<RouteEntity?> watchRoute(String routeId) {
    return _collection.doc(routeId).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return RouteModel.fromMap(data, routeId: snapshot.id).toEntity();
    });
  }

  @override
  Stream<List<RouteEntity>> watchMemberRoutes(String uid) {
    return _collection
        .where('memberIds', arrayContains: uid)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) =>
              RouteModel.fromMap(doc.data(), routeId: doc.id).toEntity())
          .toList(growable: false);
    });
  }

  @override
  Stream<RouteMembership?> watchMembership(String userId) {
    return _collection
        .where('memberIds', arrayContains: userId)
        .limit(1)
        .snapshots()
        .map((snapshot) {
      if (snapshot.docs.isEmpty) {
        return null;
      }
      final doc = snapshot.docs.first;
      final data = doc.data();
      return RouteMembership(
        routeId: doc.id,
        routeName: data['name'] as String? ?? '',
        role: 'member',
      );
    });
  }

  @override
  Future<RouteEntity?> getRoute(String routeId) async {
    final snapshot = await _collection.doc(routeId).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return RouteModel.fromMap(data, routeId: snapshot.id).toEntity();
  }

  @override
  Future<RouteMembership> joinBySrvCode(
      JoinRouteBySrvCodeCommand command) async {
    final query = await _collection
        .where('srvCode', isEqualTo: command.srvCode)
        .limit(1)
        .get();
    if (query.docs.isEmpty) {
      throw const AppException(
        code: ErrorCodes.invalidArgument,
        message: 'Route not found for given SRV code.',
      );
    }
    final doc = query.docs.first;
    final data = doc.data();

    return RouteMembership(
      routeId: doc.id,
      routeName: data['name'] as String? ?? '',
      role: 'passenger',
    );
  }

  @override
  Future<void> leaveRoute(String routeId, {required String uid}) {
    return _collection.doc(routeId).update(<String, dynamic>{
      'memberIds': FieldValue.arrayRemove(<String>[uid]),
    });
  }

  @override
  Future<void> upsertRoute(RouteEntity route) async {
    final model = routeModelFromEntity(route);
    await _collection
        .doc(route.routeId)
        .set(model.toMap(), SetOptions(merge: true));
  }

  @override
  Future<void> updateArchiveState({
    required String routeId,
    required bool isArchived,
  }) {
    return _collection
        .doc(routeId)
        .update(<String, dynamic>{'isArchived': isArchived});
  }
}

class FirestoreStopRepository implements StopRepository {
  FirestoreStopRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> _stops(String routeId) {
    return _firestore.collection('routes').doc(routeId).collection('stops');
  }

  @override
  Stream<List<StopEntity>> watchStops(String routeId) {
    return _stops(routeId).orderBy('order').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return StopModel.fromMap(
          doc.data(),
          routeId: routeId,
          stopId: doc.id,
        ).toEntity();
      }).toList(growable: false);
    });
  }

  @override
  Future<List<StopEntity>> getStops(String routeId) async {
    final snapshot = await _stops(routeId).orderBy('order').get();
    return snapshot.docs.map((doc) {
      return StopModel.fromMap(
        doc.data(),
        routeId: routeId,
        stopId: doc.id,
      ).toEntity();
    }).toList(growable: false);
  }

  @override
  Future<void> upsertStop(StopEntity stop) async {
    final model = stopModelFromEntity(stop);
    await _stops(stop.routeId)
        .doc(stop.stopId)
        .set(model.toMap(), SetOptions(merge: true));
  }

  @override
  Future<void> deleteStop({
    required String routeId,
    required String stopId,
  }) {
    return _stops(routeId).doc(stopId).delete();
  }
}

class FirestorePassengerProfileRepository
    implements PassengerProfileRepository {
  FirestorePassengerProfileRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> _passengers(String routeId) {
    return _firestore
        .collection('routes')
        .doc(routeId)
        .collection('passengers');
  }

  @override
  Stream<PassengerProfileEntity?> watchPassengerProfile({
    required String routeId,
    required String passengerId,
  }) {
    return _passengers(routeId).doc(passengerId).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return PassengerProfileModel.fromMap(
        data,
        routeId: routeId,
        passengerId: snapshot.id,
      ).toEntity();
    });
  }

  @override
  Future<PassengerProfileEntity?> getPassengerProfile({
    required String routeId,
    required String passengerId,
  }) async {
    final snapshot = await _passengers(routeId).doc(passengerId).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return PassengerProfileModel.fromMap(
      data,
      routeId: routeId,
      passengerId: snapshot.id,
    ).toEntity();
  }

  @override
  Future<void> upsertPassengerProfile(
    PassengerProfileEntity passengerProfile,
  ) async {
    final model = passengerProfileModelFromEntity(passengerProfile);
    await _passengers(passengerProfile.routeId)
        .doc(passengerProfile.passengerId)
        .set(model.toMap(), SetOptions(merge: true));
  }

  @override
  Future<void> removePassengerProfile({
    required String routeId,
    required String passengerId,
  }) {
    return _passengers(routeId).doc(passengerId).delete();
  }
}

class FirestoreTripRepository implements TripRepository {
  FirestoreTripRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('trips');

  @override
  Stream<TripEntity?> watchActiveTrip(String routeId) {
    return _collection
        .where('routeId', isEqualTo: routeId)
        .where('status', isEqualTo: 'active')
        .orderBy('startedAt', descending: true)
        .limit(1)
        .snapshots()
        .map((snapshot) {
      if (snapshot.docs.isEmpty) {
        return null;
      }
      final doc = snapshot.docs.first;
      return TripModel.fromMap(doc.data(), tripId: doc.id).toEntity();
    });
  }

  @override
  Future<TripEntity?> getTrip(String tripId) async {
    final snapshot = await _collection.doc(tripId).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return TripModel.fromMap(data, tripId: snapshot.id).toEntity();
  }

  @override
  Future<void> upsertTrip(TripEntity trip) async {
    final model = tripModelFromEntity(trip);
    await _collection
        .doc(trip.tripId)
        .set(model.toMap(), SetOptions(merge: true));
  }

  @override
  Future<void> startTrip(StartTripCommand command) {
    throw const AppException(
      code: ErrorCodes.failedPrecondition,
      message:
          'startTrip requires callable workflow with idempotency contract.',
    );
  }

  @override
  Future<void> finishTrip(FinishTripCommand command) {
    throw const AppException(
      code: ErrorCodes.failedPrecondition,
      message:
          'finishTrip requires callable workflow with idempotency contract.',
    );
  }
}

class FirestoreAnnouncementRepository implements AnnouncementRepository {
  FirestoreAnnouncementRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('announcements');

  @override
  Stream<List<AnnouncementEntity>> watchAnnouncements(String routeId) {
    return _collection
        .where('routeId', isEqualTo: routeId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) =>
              AnnouncementModel.fromMap(doc.data(), announcementId: doc.id)
                  .toEntity())
          .toList(growable: false);
    });
  }

  @override
  Future<void> sendDriverAnnouncement(DriverAnnouncementCommand command) async {
    final now = DateTime.now().toUtc().toIso8601String();
    await _collection.add(<String, dynamic>{
      'routeId': command.routeId,
      'driverId': '',
      'templateKey': 'custom',
      'customText': command.message,
      'channels': <String>['fcm'],
      'createdAt': now,
    });
  }

  @override
  Future<void> upsertAnnouncement(AnnouncementEntity announcement) async {
    final model = announcementModelFromEntity(announcement);
    await _collection
        .doc(announcement.announcementId)
        .set(model.toMap(), SetOptions(merge: true));
  }
}

class FirestoreConsentRepository implements ConsentRepository {
  FirestoreConsentRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('consents');

  @override
  Stream<ConsentEntity?> watchConsent(String uid) {
    return _collection.doc(uid).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return ConsentModel.fromMap(data, uid: snapshot.id).toEntity();
    });
  }

  @override
  Future<ConsentEntity?> getConsent(String uid) async {
    final snapshot = await _collection.doc(uid).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return ConsentModel.fromMap(data, uid: snapshot.id).toEntity();
  }

  @override
  Future<void> upsertConsent(ConsentEntity consent) async {
    final model = consentModelFromEntity(consent);
    await _collection
        .doc(consent.uid)
        .set(model.toMap(), SetOptions(merge: true));
  }
}

class FirestoreGuestSessionRepository implements GuestSessionRepository {
  FirestoreGuestSessionRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('guest_sessions');

  @override
  Stream<GuestSessionEntity?> watchGuestSession(String sessionId) {
    return _collection.doc(sessionId).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return GuestSessionModel.fromMap(data, sessionId: snapshot.id).toEntity();
    });
  }

  @override
  Future<GuestSessionEntity?> getGuestSession(String sessionId) async {
    final snapshot = await _collection.doc(sessionId).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return GuestSessionModel.fromMap(data, sessionId: snapshot.id).toEntity();
  }

  @override
  Future<void> upsertGuestSession(GuestSessionEntity guestSession) async {
    final model = guestSessionModelFromEntity(guestSession);
    await _collection
        .doc(guestSession.sessionId)
        .set(model.toMap(), SetOptions(merge: true));
  }
}

class FirestoreLocalOwnershipRepository implements LocalOwnershipRepository {
  FirestoreLocalOwnershipRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('local_ownership');

  @override
  Future<LocalOwnershipEntity?> getOwnership(String key) async {
    final snapshot = await _collection.doc(key).get();
    final data = snapshot.data();
    if (data == null) {
      return null;
    }
    return LocalOwnershipModel.fromMap(data).toEntity();
  }

  @override
  Future<void> upsertOwnership({
    required String key,
    required LocalOwnershipEntity ownership,
  }) async {
    final model = localOwnershipModelFromEntity(ownership);
    await _collection.doc(key).set(model.toMap(), SetOptions(merge: true));
  }
}
