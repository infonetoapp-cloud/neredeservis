import '../entities/driver_entity.dart';
import '../models/driver_model.dart';

extension DriverModelMapper on DriverModel {
  DriverEntity toEntity() {
    return DriverEntity(
      driverId: driverId,
      name: name,
      phone: phone,
      plate: plate,
      showPhoneToPassengers: showPhoneToPassengers,
      companyId: companyId,
      subscriptionStatus: driverSubscriptionStatusFromRaw(subscriptionStatus),
      trialStartDate:
          trialStartDate == null ? null : _parseUtcDate(trialStartDate!),
      trialEndsAt: trialEndsAt == null ? null : _parseUtcDate(trialEndsAt!),
      lastPaywallShownAt: lastPaywallShownAt == null
          ? null
          : _parseUtcDate(lastPaywallShownAt!),
      activeDeviceToken: activeDeviceToken,
      createdAt: _parseUtcDate(createdAt),
      updatedAt: _parseUtcDate(updatedAt),
    );
  }
}

DriverModel driverModelFromEntity(DriverEntity entity) {
  return DriverModel(
    driverId: entity.driverId,
    name: entity.name,
    phone: entity.phone,
    plate: entity.plate,
    showPhoneToPassengers: entity.showPhoneToPassengers,
    companyId: entity.companyId,
    subscriptionStatus: entity.subscriptionStatus.name,
    trialStartDate: entity.trialStartDate?.toUtc().toIso8601String(),
    trialEndsAt: entity.trialEndsAt?.toUtc().toIso8601String(),
    lastPaywallShownAt: entity.lastPaywallShownAt?.toUtc().toIso8601String(),
    activeDeviceToken: entity.activeDeviceToken,
    createdAt: entity.createdAt.toUtc().toIso8601String(),
    updatedAt: entity.updatedAt.toUtc().toIso8601String(),
  );
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
