part of '../app_router.dart';

Future<_DriverRouteContext?> _resolvePrimaryDriverRouteContext(
    String uid) async {
  final stopwatch = Stopwatch()..start();
  var outcome = 'success';
  var routeCount = 0;
  try {
    final selection = await _selectPrimaryDriverRouteCandidateUseCase.execute(
      uid,
    );
    routeCount = selection.candidateRouteCount;
    final primary = selection.primaryRoute;
    if (primary == null) {
      return null;
    }
    return _DriverRouteContext(
      routeId: primary.routeId,
      routeName: primary.routeName,
      updatedAtUtc: primary.updatedAtUtc,
      isOwnedByCurrentDriver: primary.isOwnedByCurrentDriver,
    );
  } catch (_) {
    outcome = 'error';
    rethrow;
  } finally {
    _mobileTelemetry.trackPerf(
      eventName: MobileEventNames.routeListLoad,
      durationMs: stopwatch.elapsedMilliseconds,
      attributes: <String, Object?>{
        'outcome': outcome,
        'routeCount': routeCount,
      },
    );
  }
}

