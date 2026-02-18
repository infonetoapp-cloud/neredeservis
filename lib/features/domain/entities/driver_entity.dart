enum DriverSubscriptionStatus {
  trial,
  active,
  expired,
  unknown,
}

DriverSubscriptionStatus driverSubscriptionStatusFromRaw(String? rawStatus) {
  switch (rawStatus) {
    case 'trial':
      return DriverSubscriptionStatus.trial;
    case 'active':
      return DriverSubscriptionStatus.active;
    case 'expired':
      return DriverSubscriptionStatus.expired;
    default:
      return DriverSubscriptionStatus.unknown;
  }
}

class DriverEntity {
  const DriverEntity({
    required this.driverId,
    required this.name,
    required this.phone,
    required this.plate,
    required this.showPhoneToPassengers,
    required this.companyId,
    required this.subscriptionStatus,
    required this.trialStartDate,
    required this.trialEndsAt,
    required this.lastPaywallShownAt,
    required this.activeDeviceToken,
    required this.createdAt,
    required this.updatedAt,
  });

  final String driverId;
  final String name;
  final String phone;
  final String plate;
  final bool showPhoneToPassengers;
  final String? companyId;
  final DriverSubscriptionStatus subscriptionStatus;
  final DateTime? trialStartDate;
  final DateTime? trialEndsAt;
  final DateTime? lastPaywallShownAt;
  final String? activeDeviceToken;
  final DateTime createdAt;
  final DateTime updatedAt;
}
