class DriverModel {
  const DriverModel({
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
  final String subscriptionStatus;
  final String? trialStartDate;
  final String? trialEndsAt;
  final String? lastPaywallShownAt;
  final String? activeDeviceToken;
  final String createdAt;
  final String updatedAt;

  factory DriverModel.fromMap(Map<String, dynamic> map,
      {required String driverId}) {
    return DriverModel(
      driverId: driverId,
      name: map['name'] as String? ?? '',
      phone: map['phone'] as String? ?? '',
      plate: map['plate'] as String? ?? '',
      showPhoneToPassengers: map['showPhoneToPassengers'] as bool? ?? false,
      companyId: map['companyId'] as String?,
      subscriptionStatus: map['subscriptionStatus'] as String? ?? '',
      trialStartDate: map['trialStartDate'] as String?,
      trialEndsAt: map['trialEndsAt'] as String?,
      lastPaywallShownAt: map['lastPaywallShownAt'] as String?,
      activeDeviceToken: map['activeDeviceToken'] as String?,
      createdAt: map['createdAt'] as String? ?? '',
      updatedAt: map['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': name,
      'phone': phone,
      'plate': plate,
      'showPhoneToPassengers': showPhoneToPassengers,
      'companyId': companyId,
      'subscriptionStatus': subscriptionStatus,
      'trialStartDate': trialStartDate,
      'trialEndsAt': trialEndsAt,
      'lastPaywallShownAt': lastPaywallShownAt,
      'activeDeviceToken': activeDeviceToken,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
