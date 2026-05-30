part of '../app_router.dart';

bool _resolvePassengerSoftLockMode({
  required Map<String, dynamic>? routeData,
  required Map<String, dynamic>? driverData,
}) {
  final routeBooleanFlags = <Object?>[
    routeData?['softLockModeEnabled'],
    routeData?['isSoftLockMode'],
    routeData?['softLockEnabled'],
    routeData?['lowPriorityModeEnabled'],
    routeData?['isLowPriorityMode'],
  ];
  for (final flag in routeBooleanFlags) {
    if (flag == true) {
      return true;
    }
  }

  final routeModeRaw = routeData?['serviceConnectionMode'] ??
      routeData?['publishCadenceMode'] ??
      routeData?['connectionMode'];
  final routeModeNormalized =
      (routeModeRaw is String) ? routeModeRaw.trim().toLowerCase() : null;
  if (routeModeNormalized == 'soft_lock' ||
      routeModeNormalized == 'low_priority' ||
      routeModeNormalized == 'degraded') {
    return true;
  }

  final subscriptionStatusRaw = driverData?['subscriptionStatus'];
  final subscriptionStatus = (subscriptionStatusRaw is String)
      ? subscriptionStatusRaw.trim().toLowerCase()
      : null;
  return subscriptionStatus == 'expired' || subscriptionStatus == 'mock';
}
