class RouterRealtimeConnectionTransition {
  const RouterRealtimeConnectionTransition({
    required this.isRealtimeConnected,
    required this.realtimeDisconnectedAtUtc,
    required this.lastReconnectAtUtc,
    required this.lastReconnectLatency,
    required this.reconnectLatencyForNotice,
  });

  final bool isRealtimeConnected;
  final DateTime? realtimeDisconnectedAtUtc;
  final DateTime? lastReconnectAtUtc;
  final Duration? lastReconnectLatency;
  final Duration? reconnectLatencyForNotice;
}

RouterRealtimeConnectionTransition? resolveRouterRealtimeConnectionTransition({
  required bool connected,
  required bool currentConnected,
  required DateTime nowUtc,
  required DateTime? realtimeDisconnectedAtUtc,
}) {
  if (connected == currentConnected) {
    return null;
  }

  if (!connected) {
    return RouterRealtimeConnectionTransition(
      isRealtimeConnected: false,
      realtimeDisconnectedAtUtc: nowUtc,
      lastReconnectAtUtc: null,
      lastReconnectLatency: null,
      reconnectLatencyForNotice: null,
    );
  }

  final reconnectLatency = realtimeDisconnectedAtUtc == null
      ? null
      : nowUtc.difference(realtimeDisconnectedAtUtc);
  return RouterRealtimeConnectionTransition(
    isRealtimeConnected: true,
    realtimeDisconnectedAtUtc: null,
    lastReconnectAtUtc: nowUtc,
    lastReconnectLatency: reconnectLatency,
    reconnectLatencyForNotice: reconnectLatency,
  );
}

Duration? resolveRouterRecentReconnectLatency({
  required bool isRealtimeConnected,
  required DateTime? lastReconnectAtUtc,
  required Duration? lastReconnectLatency,
  required DateTime nowUtc,
  Duration visibleWindow = const Duration(minutes: 2),
}) {
  if (!isRealtimeConnected) {
    return null;
  }
  final reconnectAt = lastReconnectAtUtc;
  final reconnectLatency = lastReconnectLatency;
  if (reconnectAt == null || reconnectLatency == null) {
    return null;
  }
  final elapsed = nowUtc.difference(reconnectAt);
  if (elapsed > visibleWindow) {
    return null;
  }
  return reconnectLatency;
}

String formatRouterConnectionDurationLabel(Duration duration) {
  final totalSeconds = duration.inSeconds;
  if (totalSeconds < 1) {
    return '<1 sn';
  }
  if (totalSeconds < 60) {
    return '$totalSeconds sn';
  }
  final minutes = duration.inMinutes;
  final remainingSeconds = totalSeconds % 60;
  if (minutes < 60) {
    return '$minutes dk ${remainingSeconds.toString().padLeft(2, '0')} sn';
  }
  final hours = duration.inHours;
  final remainingMinutes = minutes % 60;
  return '$hours sa ${remainingMinutes.toString().padLeft(2, '0')} dk';
}
