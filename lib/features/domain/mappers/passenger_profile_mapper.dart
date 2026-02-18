import '../entities/passenger_profile_entity.dart';
import '../models/passenger_profile_model.dart';

extension PassengerProfileModelMapper on PassengerProfileModel {
  PassengerProfileEntity toEntity() {
    return PassengerProfileEntity(
      routeId: routeId,
      passengerId: passengerId,
      name: name,
      phone: phone,
      showPhoneToDriver: showPhoneToDriver,
      boardingArea: boardingArea,
      virtualStop: virtualStop == null
          ? null
          : PassengerVirtualStopEntity(
              lat: virtualStop!.lat,
              lng: virtualStop!.lng,
            ),
      virtualStopLabel: virtualStopLabel,
      notificationTime: notificationTime,
      joinedAt: _parseUtcDate(joinedAt),
      updatedAt: _parseUtcDate(updatedAt),
    );
  }
}

PassengerProfileModel passengerProfileModelFromEntity(
  PassengerProfileEntity entity,
) {
  return PassengerProfileModel(
    routeId: entity.routeId,
    passengerId: entity.passengerId,
    name: entity.name,
    phone: entity.phone,
    showPhoneToDriver: entity.showPhoneToDriver,
    boardingArea: entity.boardingArea,
    virtualStop: entity.virtualStop == null
        ? null
        : PassengerVirtualStopModel(
            lat: entity.virtualStop!.lat,
            lng: entity.virtualStop!.lng,
          ),
    virtualStopLabel: entity.virtualStopLabel,
    notificationTime: entity.notificationTime,
    joinedAt: entity.joinedAt.toUtc().toIso8601String(),
    updatedAt: entity.updatedAt.toUtc().toIso8601String(),
  );
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
