part of '../app_router.dart';

const Duration _passengerEntryMembershipResolveTimeout = Duration(seconds: 6);

Uri _resolveDeleteInterceptorManageUri({
  required Map<String, dynamic> payload,
  required AppEnvironment environment,
}) {
  final fallback = _resolvePaywallManageUri(environment);
  final rawUrls = payload['manageSubscriptionUrls'];
  if (rawUrls is! Map) {
    return fallback;
  }

  final normalized = Map<String, dynamic>.from(rawUrls);
  final platformKey =
      defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
  final platformUrlRaw = normalized[platformKey];
  if (platformUrlRaw is String) {
    final parsed = Uri.tryParse(platformUrlRaw.trim());
    if (parsed != null) {
      return parsed;
    }
  }
  return fallback;
}

Future<String> _resolveDriverEntryDestination(User user) async {
  final destination = await _resolveDriverEntryDestinationUseCase.execute(
    user.uid,
  );
  return switch (destination) {
    DriverEntryDestination.home => AppRoutePath.driverHome,
    DriverEntryDestination.profileSetup => AppRoutePath.driverProfileSetup,
  };
}

Future<String> _resolvePassengerHomeDestination(User user) async {
  final membership = await _resolvePrimaryPassengerMembership(user.uid);
  if (membership != null) {
    return _buildPassengerTrackingUri(
      routeId: membership.routeId,
      routeName: membership.routeName,
    );
  }
  final cachedMembership = await _readCachedPassengerRoute().timeout(
    _passengerEntryMembershipResolveTimeout,
    onTimeout: () => null,
  );
  if (cachedMembership != null) {
    return _buildPassengerTrackingUri(
      routeId: cachedMembership.routeId,
      routeName: cachedMembership.routeName,
    );
  }
  return '${AppRoutePath.join}?role=passenger';
}

Future<_PassengerMembershipSummary?> _resolvePrimaryPassengerMembership(
  String uid,
) async {
  try {
    final membership =
        await _readPrimaryPassengerMembershipUseCase.execute(uid).timeout(
              _passengerEntryMembershipResolveTimeout,
              onTimeout: () => null,
            );
    if (membership == null) {
      return null;
    }
    return _PassengerMembershipSummary(
      routeId: membership.routeId,
      routeName: membership.routeName,
    );
  } catch (error) {
    debugPrint('Passenger membership resolve failed for $uid: $error');
    return null;
  }
}

String _buildPassengerTrackingUri({
  required String routeId,
  String? routeName,
}) {
  return Uri(
    path: AppRoutePath.passengerTracking,
    queryParameters: <String, String>{
      'routeId': routeId,
      if (routeName != null && routeName.isNotEmpty) 'routeName': routeName,
    },
  ).toString();
}

String _buildTripChatUri({
  required String routeId,
  required String conversationId,
  required String counterpartName,
  String? counterpartSubtitle,
}) {
  return Uri(
    path: AppRoutePath.tripChat,
    queryParameters: <String, String>{
      'routeId': routeId,
      'conversationId': conversationId,
      'counterpartName': counterpartName,
      if (counterpartSubtitle != null && counterpartSubtitle.isNotEmpty)
        'counterpartSubtitle': counterpartSubtitle,
    },
  ).toString();
}
