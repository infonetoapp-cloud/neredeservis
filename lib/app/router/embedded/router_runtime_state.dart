part of '../app_router.dart';

final _SessionRoleRefreshNotifier _sessionRoleRefreshNotifier =
    _SessionRoleRefreshNotifier();
const RouterSessionRolePreferenceStore _sessionRolePreferenceStore =
    RouterSessionRolePreferenceStore();
const RouterCachedPassengerRouteStore _cachedPassengerRouteStore =
    RouterCachedPassengerRouteStore();
const RouterRecentDriverCreatedRouteStore _recentDriverCreatedRouteStore =
    RouterRecentDriverCreatedRouteStore();
final Set<String> _driverHomeLocationPromptedUids = <String>{};
final Map<String, _RecentDriverCreatedRouteStub>
    _recentDriverCreatedRouteStubsByRouteId =
    <String, _RecentDriverCreatedRouteStub>{};
final Set<String> _recentDriverCreatedRouteStubsHydratedUids = <String>{};
