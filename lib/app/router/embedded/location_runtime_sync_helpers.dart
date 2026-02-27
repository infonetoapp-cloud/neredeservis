part of '../app_router.dart';

void _recordLocationPublishMetric(LocationPublishMetric metric) {
  final intervalMs = metric.publishIntervalMs;
  if (intervalMs == null || intervalMs < 0) {
    return;
  }
  _mobileTelemetry.trackPerf(
    eventName: MobileEventNames.backgroundPublishInterval,
    durationMs: intervalMs,
    attributes: <String, Object?>{
      'outcome': metric.outcome.name,
      'staleReplay': metric.staleReplay,
    },
  );
}

Future<void> _syncDriverLocationForegroundService({
  required bool shouldRun,
}) async {
  try {
    if (shouldRun) {
      final running = await _androidLocationBackgroundService
          .isDriverLocationServiceRunning();
      if (running) {
        return;
      }
      await _androidLocationBackgroundService.startDriverLocationService();
      return;
    }
    await _androidLocationBackgroundService.stopDriverLocationService();
  } catch (_) {
    debugPrint(
      'DriverLocationForegroundService sync failed (shouldRun=$shouldRun).',
    );
  }
}

Future<void> _syncIosSilentKillWatchdog({
  required bool shouldRun,
  String? tripId,
}) async {
  try {
    if (!shouldRun) {
      await _iosSilentKillMitigationService.stopWatchdog();
      return;
    }
    final normalizedTripId = _nullableToken(tripId);
    if (normalizedTripId == null) {
      return;
    }
    final started = await _iosSilentKillMitigationService.startWatchdog(
      tripId: normalizedTripId,
    );
    if (!started) {
      return;
    }
    await _iosSilentKillMitigationService.recordHeartbeat(
      movingSignal: true,
    );
  } catch (_) {
    debugPrint(
      'iOS silent-kill watchdog sync failed (shouldRun=$shouldRun, tripId=$tripId).',
    );
  }
}
