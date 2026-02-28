import 'router_realtime_connection_helpers.dart';

typedef RouterDurationLabelBuilder = String Function(Duration duration);

String resolveRouterRealtimeReconnectNoticeLabel({
  required Duration? reconnectLatency,
  required String noLatencyLabel,
  required RouterDurationLabelBuilder reconnectLatencyLabelBuilder,
}) {
  if (reconnectLatency == null) {
    return noLatencyLabel;
  }
  return reconnectLatencyLabelBuilder(reconnectLatency);
}

String? resolveRouterRealtimeOfflineBannerLabel({
  required bool isRealtimeConnected,
  required String offlineLabel,
}) {
  if (isRealtimeConnected) {
    return null;
  }
  return offlineLabel;
}

String? resolveRouterRealtimeLatencyIndicatorLabel({
  required bool isRealtimeConnected,
  required DateTime? lastReconnectAtUtc,
  required Duration? lastReconnectLatency,
  required DateTime nowUtc,
  required String offlineLabel,
  required RouterDurationLabelBuilder reconnectLatencyLabelBuilder,
}) {
  if (!isRealtimeConnected) {
    return offlineLabel;
  }
  final reconnectLatency = resolveRouterRecentReconnectLatency(
    isRealtimeConnected: isRealtimeConnected,
    lastReconnectAtUtc: lastReconnectAtUtc,
    lastReconnectLatency: lastReconnectLatency,
    nowUtc: nowUtc,
  );
  if (reconnectLatency == null) {
    return null;
  }
  return reconnectLatencyLabelBuilder(reconnectLatency);
}
