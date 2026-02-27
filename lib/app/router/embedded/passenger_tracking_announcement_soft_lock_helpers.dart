part of '../app_router.dart';

Map<String, dynamic>? _resolveLatestAnnouncementData(
  QuerySnapshot<Map<String, dynamic>>? snapshot,
) {
  if (snapshot == null || snapshot.docs.isEmpty) {
    return null;
  }
  QueryDocumentSnapshot<Map<String, dynamic>>? latestDoc;
  String? latestCreatedAt;
  for (final doc in snapshot.docs) {
    final data = doc.data();
    final createdAt = (data['createdAt'] as String?)?.trim();
    if (createdAt == null || createdAt.isEmpty) {
      continue;
    }
    if (latestCreatedAt == null || createdAt.compareTo(latestCreatedAt) > 0) {
      latestDoc = doc;
      latestCreatedAt = createdAt;
    }
  }
  return latestDoc?.data();
}

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
