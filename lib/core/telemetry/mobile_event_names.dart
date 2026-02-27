class MobileEventNames {
  const MobileEventNames._();

  // Flow events
  static const String tripStart = 'trip_start';
  static const String tripFinish = 'trip_finish';
  static const String routeJoin = 'route_join';
  static const String routeLeave = 'route_leave';
  static const String announcementShare = 'announcement_share';
  static const String permissionDenied = 'permission_denied';

  // Perf events
  static const String appStartup = 'perf_app_startup';
  static const String mapRender = 'perf_map_render';
  static const String routeListLoad = 'perf_route_list_load';
  static const String backgroundPublishInterval =
      'perf_background_publish_interval';
  static const String joinCallableLatency = 'perf_join_callable_latency';
  static const String leaveRouteCallableLatency = 'perf_leave_callable_latency';
  static const String startTripCallableLatency =
      'perf_start_trip_callable_latency';
  static const String finishTripCallableLatency =
      'perf_finish_trip_callable_latency';
  static const String shareCallableLatency = 'perf_share_callable_latency';
}
