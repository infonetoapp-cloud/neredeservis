import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/driver/application/plan_create_driver_route_post_commit_handling_use_case.dart';

typedef RouterRememberRecentDriverCreatedRouteFromPlan = void Function(
  CreateDriverRouteRecentCacheWritePlan plan,
);

typedef RouterShowSrvCodeDialog = Future<void> Function(
  BuildContext context, {
  required String srvCode,
});

typedef RouterBuildDriverHomeRoutePath = String Function({
  String? previewRouteId,
  String? startedRouteId,
  bool forceRefresh,
});

void applyRouterCreateDriverRoutePostCommitCacheWritePlan({
  required CreateDriverRoutePostCommitHandlingPlan plan,
  required RouterRememberRecentDriverCreatedRouteFromPlan
      rememberRecentDriverCreatedRouteFromPlan,
}) {
  final recentCacheWrite = plan.recentCacheWrite;
  if (recentCacheWrite == null) {
    return;
  }
  rememberRecentDriverCreatedRouteFromPlan(recentCacheWrite);
}

Future<void> executeRouterCreateDriverRoutePostCommitUiEffects(
  BuildContext context, {
  required CreateDriverRoutePostCommitHandlingPlan plan,
  required RouterShowSrvCodeDialog showSrvCodeDialog,
  required RouterBuildDriverHomeRoutePath buildDriverHomeRoute,
}) async {
  await showSrvCodeDialog(context, srvCode: plan.srvCode);
  if (!context.mounted) {
    return;
  }

  context.go(
    buildDriverHomeRoute(
      previewRouteId: plan.driverHomePreviewRouteId,
      forceRefresh: plan.shouldForceDriverHomeRefresh,
    ),
  );
}
