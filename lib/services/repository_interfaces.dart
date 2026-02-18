import '../features/domain/entities/announcement_entity.dart';
import '../features/domain/entities/consent_entity.dart';
import '../features/domain/entities/driver_entity.dart';
import '../features/domain/entities/guest_session_entity.dart';
import '../features/domain/entities/live_location_entity.dart';
import '../features/domain/entities/local_ownership_entity.dart';
import '../features/domain/entities/passenger_profile_entity.dart';
import '../features/domain/entities/route_entity.dart';
import '../features/domain/entities/stop_entity.dart';
import '../features/domain/entities/trip_entity.dart';
import '../features/domain/entities/user_entity.dart';

abstract class UserRepository {
  Stream<UserEntity?> watchUser(String uid);
  Future<UserEntity?> getUser(String uid);
  Future<void> upsertUser(UserEntity user);
}

abstract class DriverRepository {
  Stream<DriverEntity?> watchDriver(String driverId);
  Future<DriverEntity?> getDriver(String driverId);
  Future<void> upsertDriver(DriverEntity driver);
}

abstract class RouteRepository {
  Stream<RouteEntity?> watchRoute(String routeId);
  Stream<List<RouteEntity>> watchMemberRoutes(String uid);
  Stream<RouteMembership?> watchMembership(String userId);
  Future<RouteEntity?> getRoute(String routeId);
  Future<RouteMembership> joinBySrvCode(JoinRouteBySrvCodeCommand command);
  Future<void> leaveRoute(String routeId, {required String uid});
  Future<void> upsertRoute(RouteEntity route);
  Future<void> updateArchiveState({
    required String routeId,
    required bool isArchived,
  });
}

abstract class StopRepository {
  Stream<List<StopEntity>> watchStops(String routeId);
  Future<List<StopEntity>> getStops(String routeId);
  Future<void> upsertStop(StopEntity stop);
  Future<void> deleteStop({
    required String routeId,
    required String stopId,
  });
}

abstract class PassengerProfileRepository {
  Stream<PassengerProfileEntity?> watchPassengerProfile({
    required String routeId,
    required String passengerId,
  });
  Future<PassengerProfileEntity?> getPassengerProfile({
    required String routeId,
    required String passengerId,
  });
  Future<void> upsertPassengerProfile(PassengerProfileEntity passengerProfile);
  Future<void> removePassengerProfile({
    required String routeId,
    required String passengerId,
  });
}

abstract class TripRepository {
  Stream<TripEntity?> watchActiveTrip(String routeId);
  Future<TripEntity?> getTrip(String tripId);
  Future<void> upsertTrip(TripEntity trip);
  Future<void> startTrip(StartTripCommand command);
  Future<void> finishTrip(FinishTripCommand command);
}

abstract class AnnouncementRepository {
  Stream<List<AnnouncementEntity>> watchAnnouncements(String routeId);
  Future<void> sendDriverAnnouncement(DriverAnnouncementCommand command);
  Future<void> upsertAnnouncement(AnnouncementEntity announcement);
}

abstract class ConsentRepository {
  Stream<ConsentEntity?> watchConsent(String uid);
  Future<ConsentEntity?> getConsent(String uid);
  Future<void> upsertConsent(ConsentEntity consent);
}

abstract class GuestSessionRepository {
  Stream<GuestSessionEntity?> watchGuestSession(String sessionId);
  Future<GuestSessionEntity?> getGuestSession(String sessionId);
  Future<void> upsertGuestSession(GuestSessionEntity guestSession);
}

abstract class LocalOwnershipRepository {
  Future<LocalOwnershipEntity?> getOwnership(String key);
  Future<void> upsertOwnership({
    required String key,
    required LocalOwnershipEntity ownership,
  });
}

abstract class LiveLocationRepository {
  Stream<LiveLocationEntity?> watchLiveLocation(String routeId);
  Future<LiveLocationEntity?> getLiveLocation(String routeId);
  Future<void> upsertLiveLocation(LiveLocationEntity location);
  Future<void> clearLiveLocation(String routeId);
}

class RouteMembership {
  const RouteMembership({
    required this.routeId,
    required this.routeName,
    required this.role,
  });

  final String routeId;
  final String routeName;
  final String role;
}

class JoinRouteBySrvCodeCommand {
  const JoinRouteBySrvCodeCommand({
    required this.srvCode,
    required this.name,
    required this.phone,
    required this.showPhoneToDriver,
    required this.boardingArea,
    required this.notificationTime,
  });

  final String srvCode;
  final String name;
  final String? phone;
  final bool showPhoneToDriver;
  final String boardingArea;
  final String notificationTime;
}

class StartTripCommand {
  const StartTripCommand({
    required this.routeId,
    required this.deviceId,
    required this.idempotencyKey,
    required this.expectedTransitionVersion,
  });

  final String routeId;
  final String deviceId;
  final String idempotencyKey;
  final int expectedTransitionVersion;
}

class FinishTripCommand {
  const FinishTripCommand({
    required this.tripId,
    required this.deviceId,
    required this.idempotencyKey,
    required this.expectedTransitionVersion,
  });

  final String tripId;
  final String deviceId;
  final String idempotencyKey;
  final int expectedTransitionVersion;
}

class DriverAnnouncementCommand {
  const DriverAnnouncementCommand({
    required this.routeId,
    required this.tripId,
    required this.message,
  });

  final String routeId;
  final String tripId;
  final String message;
}
