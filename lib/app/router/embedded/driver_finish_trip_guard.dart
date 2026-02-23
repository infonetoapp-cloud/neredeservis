part of '../app_router.dart';

class _DriverFinishTripGuard extends StatefulWidget {
  const _DriverFinishTripGuard({
    required this.routeName,
    this.routeId,
    this.tripId,
    this.initialTransitionVersion,
    this.mapboxPublicToken,
  });

  final String routeName;
  final String? routeId;
  final String? tripId;
  final int? initialTransitionVersion;
  final String? mapboxPublicToken;

  @override
  State<_DriverFinishTripGuard> createState() => _DriverFinishTripGuardState();
}

class _DriverFinishTripGuardState extends State<_DriverFinishTripGuard>
    with WidgetsBindingObserver {
  bool _finishing = false;
  bool _queueFlushInFlight = false;
  bool _finishTripSyncPending = false;
  bool _hasPendingCriticalSync = false;
  bool _hasManualInterventionSync = false;
  bool _manualInterventionInfoShown = false;
  int _screenResetSeed = 0;
  bool _batteryDegradeMode = false;
  bool _batteryPromptInFlight = false;
  bool _resumeRecoveryInFlight = false;
  Timer? _heartbeatUiTicker;
  Timer? _watchdogHeartbeatTimer;
  Timer? _queueFlushTicker;
  StreamSubscription<DatabaseEvent>? _realtimeConnectionSubscription;
  StreamSubscription<AccelerometerEvent>? _shakeToReportSubscription;
  bool _shakeToReportFlowInProgress = false;
  bool _isRealtimeConnected = true;
  DateTime? _realtimeDisconnectedAtUtc;
  DateTime? _lastReconnectAtUtc;
  Duration? _lastReconnectLatency;
  late final ShakeToReportDetector _shakeToReportDetector =
      ShakeToReportDetector(
    onShakeDetected: () => unawaited(_handleShakeToReportTriggered()),
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_syncDriverLocationForegroundService(shouldRun: true));
    unawaited(_configureTerminatedQueueFlushStrategy());
    unawaited(_startOrRefreshIosWatchdogIfPossible());
    unawaited(_bootstrapBatteryOptimizationPolicy());
    unawaited(_localQueueRepository.resumePendingOwnershipMigrationIfNeeded());
    unawaited(_refreshQueueSyncState());
    unawaited(_flushQueuedOpsSilently());
    _startHeartbeatUiTicker();
    _startWatchdogHeartbeatTicker();
    _startQueueFlushTicker();
    _startRealtimeConnectionListener();
    _startShakeToReportListener();
  }

  @override
  void didUpdateWidget(covariant _DriverFinishTripGuard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.tripId != oldWidget.tripId) {
      unawaited(_startOrRefreshIosWatchdogIfPossible());
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_handleAndroidKillSignalAndBatteryPolicy());
      unawaited(_handleResumeRecoveryIfNeeded());
      unawaited(_configureTerminatedQueueFlushStrategy());
      unawaited(_refreshQueueSyncState());
      unawaited(_flushQueuedOpsSilently());
      return;
    }
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      unawaited(
        _iosSilentKillMitigationService.recordHeartbeat(movingSignal: false),
      );
    }
  }

  void _startWatchdogHeartbeatTicker() {
    _watchdogHeartbeatTimer?.cancel();
    _watchdogHeartbeatTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) {
        unawaited(
          _iosSilentKillMitigationService.recordHeartbeat(movingSignal: true),
        );
      },
    );
  }

  void _startHeartbeatUiTicker() {
    _heartbeatUiTicker?.cancel();
    _heartbeatUiTicker = Timer.periodic(
      const Duration(seconds: 5),
      (_) {
        if (!mounted) {
          return;
        }
        setState(() {});
      },
    );
  }

  void _startQueueFlushTicker() {
    _queueFlushTicker?.cancel();
    _queueFlushTicker = Timer.periodic(
      const Duration(minutes: 15),
      (_) => unawaited(_flushQueuedOpsSilently()),
    );
  }

  void _startRealtimeConnectionListener() {
    _realtimeConnectionSubscription?.cancel();
    _realtimeConnectionSubscription =
        FirebaseDatabase.instance.ref('.info/connected').onValue.listen(
      (event) {
        _handleRealtimeConnectionChanged(event.snapshot.value == true);
      },
      onError: (_) {
        debugPrint('Realtime connection listener failed.');
      },
    );
  }

  void _handleRealtimeConnectionChanged(bool connected) {
    if (!mounted || connected == _isRealtimeConnected) {
      return;
    }
    if (!connected) {
      setState(() {
        _isRealtimeConnected = false;
        _realtimeDisconnectedAtUtc = DateTime.now().toUtc();
      });
      return;
    }

    final nowUtc = DateTime.now().toUtc();
    final disconnectedAtUtc = _realtimeDisconnectedAtUtc;
    final reconnectLatency =
        disconnectedAtUtc == null ? null : nowUtc.difference(disconnectedAtUtc);
    setState(() {
      _isRealtimeConnected = true;
      _realtimeDisconnectedAtUtc = null;
      _lastReconnectAtUtc = nowUtc;
      _lastReconnectLatency = reconnectLatency;
    });
    final reconnectLabel = reconnectLatency == null
        ? 'BaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± geri geldi.'
        : 'BaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± geri geldi (${_formatConnectionDurationLabel(reconnectLatency)}).';
    _showInfo(context, reconnectLabel);
    unawaited(_refreshQueueSyncState());
    unawaited(_flushQueuedOpsSilently());
  }

  String? _resolveDriverOfflineBannerLabel() {
    if (_isRealtimeConnected) {
      return null;
    }
    return 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°nternet baÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± kesildi. ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lem kuyruÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸a alÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±nacak.';
  }

  String? _resolveDriverLatencyIndicatorLabel() {
    if (!_isRealtimeConnected) {
      return 'Kesinti';
    }
    final reconnectAt = _lastReconnectAtUtc;
    final reconnectLatency = _lastReconnectLatency;
    if (reconnectAt == null || reconnectLatency == null) {
      return null;
    }
    final elapsed = DateTime.now().toUtc().difference(reconnectAt);
    if (elapsed > const Duration(minutes: 2)) {
      return null;
    }
    return 'Yeniden baÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lantÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± ${_formatConnectionDurationLabel(reconnectLatency)}';
  }

  bool get _isShakeToReportSupported {
    if (kIsWeb) {
      return false;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
      case TargetPlatform.iOS:
        return true;
      case TargetPlatform.fuchsia:
      case TargetPlatform.linux:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
        return false;
    }
  }

  void _startShakeToReportListener() {
    if (!_isShakeToReportSupported) {
      return;
    }
    _shakeToReportSubscription?.cancel();
    _shakeToReportSubscription = accelerometerEventStream().listen(
      (event) {
        _shakeToReportDetector.addSample(
          x: event.x,
          y: event.y,
          z: event.z,
        );
      },
      onError: (_) {
        debugPrint('Shake-to-report accelerometer stream error.');
      },
    );
  }

  Future<void> _handleShakeToReportTriggered() async {
    if (!mounted || _shakeToReportFlowInProgress) {
      return;
    }
    _shakeToReportFlowInProgress = true;
    try {
      final proceed = await _showShakeToReportConfirmDialog(context);
      if (!mounted || proceed != true) {
        return;
      }
      await _handleSubmitSupportReport(
        context,
        source: SupportReportSource.shakeShortcut,
        routeId: widget.routeId,
        tripId: widget.tripId,
        batteryDegradeModeEnabled: _batteryDegradeMode,
      );
    } finally {
      _shakeToReportFlowInProgress = false;
    }
  }

  Future<bool?> _showShakeToReportConfirmDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Shake Kisayolu'),
          content: const Text(
            'Telefon sallama algÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±landÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±. Sorun Bildir raporu aÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬ÂÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±lsÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±n mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±?',
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Hayir'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Evet'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _configureTerminatedQueueFlushStrategy() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return;
    }
    await _backgroundQueueFlushScheduler.configureForOwner(
      ownerUid: user.uid,
    );
  }

  Future<void> _refreshQueueSyncState() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      if (!mounted) {
        return;
      }
      setState(() {
        _hasPendingCriticalSync = false;
        _hasManualInterventionSync = false;
      });
      return;
    }

    final pendingCritical =
        await _queueFlushOrchestrator.hasPendingCriticalTripActions(
      ownerUid: user.uid,
    );
    final manualIntervention =
        await _queueFlushOrchestrator.hasManualInterventionRequirement(
      ownerUid: user.uid,
    );
    if (!mounted) {
      return;
    }
    setState(() {
      _hasPendingCriticalSync = pendingCritical;
      _hasManualInterventionSync = manualIntervention;
      if (!pendingCritical) {
        _finishTripSyncPending = false;
      }
    });
  }

  Future<void> _flushQueuedOpsSilently() async {
    if (_queueFlushInFlight) {
      return;
    }
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return;
    }

    final hasPending = await _queueFlushOrchestrator.hasPendingQueue(
      ownerUid: user.uid,
    );
    if (!hasPending) {
      await _refreshQueueSyncState();
      return;
    }

    _queueFlushInFlight = true;
    try {
      final summary = await _queueFlushOrchestrator.flushAll(
        ownerUid: user.uid,
      );
      await _refreshQueueSyncState();
      if (!mounted) {
        return;
      }

      if (summary.hasManualIntervention && !_manualInterventionInfoShown) {
        _manualInterventionInfoShown = true;
        _showInfo(
          context,
          CoreErrorFeedbackTokens.manualInterventionRequired,
        );
      }
      if (!summary.hasManualIntervention) {
        _manualInterventionInfoShown = false;
      }
    } catch (_) {
      debugPrint('Driver queue flush skipped due to transient failure.');
    } finally {
      _queueFlushInFlight = false;
    }
  }

  Future<void> _handleManualRetryTap() async {
    if (_queueFlushInFlight) {
      if (mounted) {
        _showInfo(context, 'Senkronizasyon zaten deneniyor...');
      }
      return;
    }
    await _flushQueuedOpsSilently();
    if (!mounted) {
      return;
    }
    if (_hasPendingCriticalSync) {
      _showInfo(context, 'Senkronizasyon tekrar denendi, kuyruk izleniyor...');
      return;
    }
    _showInfo(context, 'Bekleyen kritik senkronizasyon kalmadi.');
  }

  Future<void> _showPendingSyncExitWarning() async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Senkronizasyon Bekleniyor'),
          content: const Text(
            'Veriler henÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬ÂÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼z buluta gÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬ÂÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¶nderilmedi. Cikarsaniz iÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸lem arka planda tekrar denenecek.',
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Geri Don'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                unawaited(
                  _handleSubmitSupportReport(
                    context,
                    source: SupportReportSource.activeTripSync,
                    routeId: widget.routeId,
                    tripId: widget.tripId,
                    batteryDegradeModeEnabled: _batteryDegradeMode,
                  ),
                );
              },
              child: const Text('Sorun Bildir'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                Navigator.of(context).maybePop();
              },
              child: const Text('Beklemeden Cik'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _startOrRefreshIosWatchdogIfPossible() async {
    final tripId = _nullableToken(widget.tripId);
    if (tripId == null) {
      return;
    }
    await _syncIosSilentKillWatchdog(
      shouldRun: true,
      tripId: tripId,
    );
  }

  Future<void> _handleResumeRecoveryIfNeeded() async {
    if (_resumeRecoveryInFlight) {
      return;
    }
    _resumeRecoveryInFlight = true;
    try {
      final shouldRecover =
          await _iosSilentKillMitigationService.shouldRecoverAfterResume(
        staleThresholdSeconds: 120,
      );
      await _iosSilentKillMitigationService.recordHeartbeat(
        movingSignal: true,
      );
      if (!mounted || !shouldRecover) {
        return;
      }
      await _syncDriverLocationForegroundService(shouldRun: true);
      if (!mounted) {
        return;
      }
      _showInfo(
        context,
        'iOS arka plan kesintisi algÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±landÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±; konum yayÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± toparlanÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±yor.',
      );
    } catch (_) {
      debugPrint('iOS resume recovery check skipped.');
    } finally {
      _resumeRecoveryInFlight = false;
    }
  }

  Future<void> _bootstrapBatteryOptimizationPolicy() async {
    final degraded =
        await _batteryOptimizationFallbackService.isDegradeModeEnabled();
    if (mounted) {
      setState(() {
        _batteryDegradeMode = degraded;
      });
    }
    await _handleBatteryOptimizationNeedMoment(
      oemKillSignalDetected: false,
    );
  }

  Future<void> _handleAndroidKillSignalAndBatteryPolicy() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return;
    }
    final running = await _androidLocationBackgroundService
        .isDriverLocationServiceRunning();
    if (!running) {
      await _syncDriverLocationForegroundService(shouldRun: true);
      if (!mounted) {
        return;
      }
      _showInfo(
        context,
        'Arka plan servis kesildi; konum yayini tekrar baÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸latÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ldÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±.',
      );
      await _handleBatteryOptimizationNeedMoment(
        oemKillSignalDetected: true,
      );
      return;
    }
    await _handleBatteryOptimizationNeedMoment(
      oemKillSignalDetected: false,
    );
  }

  Future<void> _handleBatteryOptimizationNeedMoment({
    required bool oemKillSignalDetected,
  }) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return;
    }
    if (_batteryPromptInFlight) {
      return;
    }

    final bypassEnabled =
        await _androidBatteryOptimizationOrchestrator.isBypassEnabled();
    if (bypassEnabled) {
      await _batteryOptimizationFallbackService.setDegradeModeEnabled(false);
      if (mounted && _batteryDegradeMode) {
        setState(() {
          _batteryDegradeMode = false;
        });
      }
      return;
    }

    final shouldPrompt =
        await _batteryOptimizationFallbackService.shouldPromptAtNeedMoment(
      oemKillSignalDetected: oemKillSignalDetected,
    );
    if (!shouldPrompt) {
      await _batteryOptimizationFallbackService.setDegradeModeEnabled(true);
      if (mounted && !_batteryDegradeMode) {
        setState(() {
          _batteryDegradeMode = true;
        });
      }
      return;
    }
    if (!mounted) {
      return;
    }

    _batteryPromptInFlight = true;
    try {
      final openSettings = await _showBatteryOptimizationPromptDialog(
        context,
        oemKillSignalDetected: oemKillSignalDetected,
      );
      await _batteryOptimizationFallbackService.markNeedMomentHandled();
      if (openSettings != true) {
        await _batteryOptimizationFallbackService.setDegradeModeEnabled(true);
        if (mounted) {
          setState(() {
            _batteryDegradeMode = true;
          });
          _showBatteryOptimizationDegradeBanner();
        }
        return;
      }

      final outcome = await _androidBatteryOptimizationOrchestrator
          .requestBypassAtNeedMoment();
      if (outcome == AndroidBatteryOptimizationOutcome.granted) {
        await _batteryOptimizationFallbackService.setDegradeModeEnabled(false);
        if (mounted) {
          setState(() {
            _batteryDegradeMode = false;
          });
          _showInfo(context, 'Pil optimizasyonu istisnasi aktif.');
        }
        return;
      }

      await _batteryOptimizationFallbackService.setDegradeModeEnabled(true);
      if (mounted) {
        setState(() {
          _batteryDegradeMode = true;
        });
        _showBatteryOptimizationDegradeBanner();
      }
    } finally {
      _batteryPromptInFlight = false;
    }
  }

  Future<bool?> _showBatteryOptimizationPromptDialog(
    BuildContext context, {
    required bool oemKillSignalDetected,
  }) {
    final message = oemKillSignalDetected
        ? 'Cihaz arka planda konum servisini kapatti. Kesinti riskini azaltmak iÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬ÂÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§in pil optimizasyon istisnasini ac.'
        : 'Aktif seferde arka plan kesintilerini azaltmak iÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬ÂÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§in pil optimizasyon istisnasini ac.';
    return showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Pil Optimizasyonu'),
          content: Text(message),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Simdi Degil'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Ayarlar\'dan Ac'),
            ),
          ],
        );
      },
    );
  }

  void _showBatteryOptimizationDegradeBanner() {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentMaterialBanner();
    messenger.showMaterialBanner(
      MaterialBanner(
        content: const Text(
          'Pil optimizasyonu aÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬ÂÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±k kaldÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± iÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬ÂÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§in degrade izleme modu aktif. Arka planda konum akÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± kesilebilir.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () async {
              messenger.hideCurrentMaterialBanner();
              final outcome = await _androidBatteryOptimizationOrchestrator
                  .requestBypassAtNeedMoment();
              if (outcome == AndroidBatteryOptimizationOutcome.granted) {
                await _batteryOptimizationFallbackService
                    .setDegradeModeEnabled(false);
                if (!mounted) {
                  return;
                }
                setState(() {
                  _batteryDegradeMode = false;
                });
                _showInfo(context, 'Pil optimizasyonu istisnasi aktif.');
                return;
              }
              if (mounted) {
                _showInfo(
                  context,
                  'Pil optimizasyonu istisnasi kapalÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± kaldi; degrade mod devam ediyor.',
                );
              }
            },
            child: const Text('Ayarlar\'dan Ac'),
          ),
          TextButton(
            onPressed: messenger.hideCurrentMaterialBanner,
            child: const Text('Kapat'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleTripFinishConfirmed() async {
    if (_finishing) {
      return;
    }
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      _showInfo(context, CoreErrorFeedbackTokens.sessionMissingSignInAgain);
      return;
    }

    setState(() {
      _finishing = true;
    });

    final shouldCommit = await _showFinishTripUndoWindow(context);
    if (!mounted) {
      return;
    }
    if (!shouldCommit) {
      setState(() {
        _finishing = false;
        _screenResetSeed++;
      });
      _showInfo(context, 'Sefer bitirme iptal edildi.');
      return;
    }

    final activeTripContext = await _resolveActiveTripContextForFinish(
      user,
      tripId: widget.tripId,
      routeId: widget.routeId,
      initialTransitionVersion: widget.initialTransitionVersion,
    );
    if (!mounted) {
      return;
    }
    if (activeTripContext == null) {
      setState(() {
        _finishing = false;
        _screenResetSeed++;
      });
      _showInfo(context, 'Aktif sefer baglami bulunamadi.');
      return;
    }

    final outcome = await _commitFinishTrip(context, user, activeTripContext);
    if (!mounted) {
      return;
    }
    if (outcome == _FinishTripCommitOutcome.synced) {
      context.go(
        _buildDriverTripCompletedRoute(
          routeId: activeTripContext.routeId,
          tripId: activeTripContext.tripId,
          routeName: widget.routeName,
        ),
      );
      return;
    }
    if (outcome == _FinishTripCommitOutcome.pendingSync) {
      setState(() {
        _finishing = false;
        _finishTripSyncPending = true;
        _screenResetSeed++;
      });
      unawaited(_refreshQueueSyncState());
      unawaited(_flushQueuedOpsSilently());
      return;
    }

    setState(() {
      _finishing = false;
      _screenResetSeed++;
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _heartbeatUiTicker?.cancel();
    _watchdogHeartbeatTimer?.cancel();
    _queueFlushTicker?.cancel();
    _realtimeConnectionSubscription?.cancel();
    _shakeToReportSubscription?.cancel();
    _shakeToReportDetector.reset();
    unawaited(_syncIosSilentKillWatchdog(shouldRun: false));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final normalizedRouteId = _nullableToken(widget.routeId);
    final todayIstanbulDateKey = _buildIstanbulDateKey(DateTime.now().toUtc());
    if (normalizedRouteId == null) {
      final fallbackHeartbeat = resolveDriverHeartbeatSnapshot(
        freshness: LiveSignalFreshness.live,
        lastSeenAgo: null,
        degradeModeEnabled: _batteryDegradeMode,
      );
      return _buildActiveTripScreen(
        heartbeatState: _toUiHeartbeatState(fallbackHeartbeat.band),
        lastHeartbeatAgo: fallbackHeartbeat.subtitle,
        routePathPoints: const <ActiveTripMapPoint>[],
        vehiclePoint: null,
        nextStopPoint: null,
        nextStopName: null,
        crowFlyDistanceMeters: null,
        stopsRemaining: null,
        passengerEntries: const <ActiveTripPassengerEntry>[],
      );
    }

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('routes')
          .doc(normalizedRouteId)
          .snapshots(),
      builder: (context, routeSnapshot) {
        final routeData = routeSnapshot.data?.data();
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('routes')
              .doc(normalizedRouteId)
              .collection('stops')
              .orderBy('order')
              .snapshots(),
          builder: (context, stopsSnapshot) {
            final orderedStops = _parseDriverStops(stopsSnapshot.data);
            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('routes')
                  .doc(normalizedRouteId)
                  .collection('passengers')
                  .snapshots(),
              builder: (context, passengersSnapshot) {
                return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: FirebaseFirestore.instance
                      .collection('routes')
                      .doc(normalizedRouteId)
                      .collection('skip_requests')
                      .where('dateKey', isEqualTo: todayIstanbulDateKey)
                      .snapshots(),
                  builder: (context, skipRequestsSnapshot) {
                    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      stream: FirebaseFirestore.instance
                          .collection('guest_sessions')
                          .where('routeId', isEqualTo: normalizedRouteId)
                          .where('status', isEqualTo: 'active')
                          .snapshots(),
                      builder: (context, guestSessionsSnapshot) {
                        final skipTodayPassengerIds =
                            _resolveSkipTodayPassengerIds(
                          skipRequestsSnapshot.data,
                        );
                        final passengerEntries = _resolveDriverPassengerEntries(
                          passengersSnapshot: passengersSnapshot.data,
                          skipTodayPassengerIds: skipTodayPassengerIds,
                          guestSessionsSnapshot: guestSessionsSnapshot.data,
                        );

                        return StreamBuilder<DatabaseEvent>(
                          stream: FirebaseDatabase.instance
                              .ref('locations/$normalizedRouteId')
                              .onValue,
                          builder: (context, locationSnapshot) {
                            final rawMap = _mapFromRtdbValue(
                                locationSnapshot.data?.snapshot.value);
                            final timestampMs = parseLiveLocationTimestampMs(
                              rawMap?['timestamp'],
                            );
                            final nowUtc = DateTime.now().toUtc();
                            final freshness = resolveLiveSignalFreshness(
                              nowUtc: nowUtc,
                              timestampMs: timestampMs,
                              treatMissingAsLive: false,
                            );
                            final lastSeenAgo = formatLastSeenAgo(
                              nowUtc: nowUtc,
                              timestampMs: timestampMs,
                            );
                            final heartbeat = resolveDriverHeartbeatSnapshot(
                              freshness: freshness,
                              lastSeenAgo: lastSeenAgo,
                              degradeModeEnabled: _batteryDegradeMode,
                            );

                            final vehicleLat =
                                _parseFiniteDouble(rawMap?['lat']);
                            final vehicleLng =
                                _parseFiniteDouble(rawMap?['lng']);
                            final vehiclePoint =
                                (vehicleLat == null || vehicleLng == null)
                                    ? null
                                    : ActiveTripMapPoint(
                                        lat: vehicleLat,
                                        lng: vehicleLng,
                                      );
                            final nextStop = _resolveNextStop(
                              orderedStops: orderedStops,
                              vehiclePoint: vehiclePoint,
                            );
                            final routePathPoints = _buildDriverRoutePathPoints(
                              routeData: routeData,
                              orderedStops: orderedStops,
                            );
                            final crowFlyDistanceMeters =
                                (vehiclePoint == null || nextStop == null)
                                    ? null
                                    : _distanceMetersBetween(
                                        vehiclePoint,
                                        nextStop.point,
                                      ).round();
                            final stopsRemaining = _resolveStopsRemaining(
                              orderedStops: orderedStops,
                              nextStop: nextStop,
                            );

                            return _buildActiveTripScreen(
                              heartbeatState:
                                  _toUiHeartbeatState(heartbeat.band),
                              lastHeartbeatAgo: heartbeat.subtitle,
                              routePathPoints: routePathPoints,
                              vehiclePoint: vehiclePoint,
                              nextStopPoint: nextStop?.point,
                              nextStopName: nextStop?.name,
                              crowFlyDistanceMeters: crowFlyDistanceMeters,
                              stopsRemaining: stopsRemaining,
                              passengerEntries: passengerEntries,
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildActiveTripScreen({
    required HeartbeatState heartbeatState,
    required String lastHeartbeatAgo,
    required List<ActiveTripMapPoint> routePathPoints,
    required ActiveTripMapPoint? vehiclePoint,
    required ActiveTripMapPoint? nextStopPoint,
    required String? nextStopName,
    required int? crowFlyDistanceMeters,
    required int? stopsRemaining,
    required List<ActiveTripPassengerEntry> passengerEntries,
  }) {
    final canOpenPassengerChat =
        (widget.routeId != null && widget.routeId!.isNotEmpty);
    final screen = ActiveTripScreen(
      key: ValueKey<String>(
        'active_trip_${widget.routeId ?? 'none'}_${widget.tripId ?? 'none'}_$_screenResetSeed',
      ),
      routeName: widget.routeName,
      nextStopName: nextStopName,
      crowFlyDistanceMeters: crowFlyDistanceMeters,
      stopsRemaining: stopsRemaining,
      passengersAtNextStop: _resolvePassengersAtNextStop(passengerEntries),
      passengerEntries: passengerEntries,
      heartbeatState: heartbeatState,
      lastHeartbeatAgo: lastHeartbeatAgo,
      routePathPoints: routePathPoints,
      vehiclePoint: vehiclePoint,
      nextStopPoint: nextStopPoint,
      syncStateLabel: _finishTripSyncPending ? 'Buluta yaziliyor...' : null,
      manualInterventionMessage: _hasManualInterventionSync
          ? CoreErrorFeedbackTokens.syncRetryLimitReached
          : null,
      offlineBannerLabel: _resolveDriverOfflineBannerLabel(),
      latencyIndicatorLabel: _resolveDriverLatencyIndicatorLabel(),
      mapboxPublicToken: widget.mapboxPublicToken,
      onPassengerMessageTap: !canOpenPassengerChat
          ? null
          : (entry) => unawaited(
                _handleOpenTripChat(
                  context,
                  routeId: widget.routeId!,
                  passengerUid: entry.passengerUid,
                  counterpartName: entry.name,
                  counterpartSubtitle: entry.isGuest ? 'Misafir' : 'Yolcu',
                ),
              ),
      onRetrySyncTap: _hasPendingCriticalSync
          ? () => unawaited(_handleManualRetryTap())
          : null,
      onReportIssueTap: _hasManualInterventionSync || _hasPendingCriticalSync
          ? () => unawaited(
                _handleSubmitSupportReport(
                  context,
                  source: SupportReportSource.activeTripSync,
                  routeId: widget.routeId,
                  tripId: widget.tripId,
                  batteryDegradeModeEnabled: _batteryDegradeMode,
                ),
              )
          : null,
      onTripFinished: _finishing ? null : _handleTripFinishConfirmed,
    );
    return PopScope(
      canPop: !_hasPendingCriticalSync,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop || !_hasPendingCriticalSync) {
          return;
        }
        unawaited(_showPendingSyncExitWarning());
      },
      child: screen,
    );
  }

  Set<String> _resolveSkipTodayPassengerIds(
    QuerySnapshot<Map<String, dynamic>>? snapshot,
  ) {
    if (snapshot == null || snapshot.docs.isEmpty) {
      return const <String>{};
    }
    final ids = <String>{};
    for (final doc in snapshot.docs) {
      final data = doc.data();
      final passengerId = (data['passengerId'] as String?)?.trim();
      if (passengerId != null && passengerId.isNotEmpty) {
        ids.add(passengerId);
        continue;
      }
      final rawId = doc.id.trim();
      final separatorIndex = rawId.indexOf('_');
      if (separatorIndex > 0) {
        ids.add(rawId.substring(0, separatorIndex));
      }
    }
    return ids;
  }

  List<ActiveTripPassengerEntry> _resolveDriverPassengerEntries({
    required QuerySnapshot<Map<String, dynamic>>? passengersSnapshot,
    required Set<String> skipTodayPassengerIds,
    required QuerySnapshot<Map<String, dynamic>>? guestSessionsSnapshot,
  }) {
    final entries = <ActiveTripPassengerEntry>[];

    if (passengersSnapshot != null) {
      for (final doc in passengersSnapshot.docs) {
        final data = doc.data();
        final rawName = (data['name'] as String?)?.trim();
        final displayName =
            (rawName == null || rawName.isEmpty) ? 'Yolcu' : rawName;
        entries.add(
          ActiveTripPassengerEntry(
            passengerUid: doc.id,
            name: displayName,
            isSkipToday: skipTodayPassengerIds.contains(doc.id),
            isGuest: false,
          ),
        );
      }
    }

    final existingUids = entries
        .map((entry) => entry.passengerUid)
        .where((uid) => uid.isNotEmpty)
        .toSet();
    final nowUtc = DateTime.now().toUtc();
    if (guestSessionsSnapshot != null) {
      for (final doc in guestSessionsSnapshot.docs) {
        final data = doc.data();
        final guestUid = _nullableToken(data['guestUid'] as String?);
        if (guestUid == null || existingUids.contains(guestUid)) {
          continue;
        }

        final expiresAtRaw = _nullableToken(data['expiresAt'] as String?);
        final expiresAt = expiresAtRaw == null
            ? null
            : DateTime.tryParse(expiresAtRaw)?.toUtc();
        if (expiresAt == null || !expiresAt.isAfter(nowUtc)) {
          continue;
        }

        final rawName = _nullableToken(data['guestDisplayName'] as String?) ??
            _nullableToken(data['name'] as String?);
        final displayName =
            (rawName == null || rawName.isEmpty) ? 'Misafir' : rawName;
        entries.add(
          ActiveTripPassengerEntry(
            passengerUid: guestUid,
            name: displayName,
            isSkipToday: false,
            isGuest: true,
          ),
        );
        existingUids.add(guestUid);
      }
    }

    if (entries.isEmpty) {
      return const <ActiveTripPassengerEntry>[];
    }

    entries.sort((left, right) {
      if (left.isSkipToday != right.isSkipToday) {
        return left.isSkipToday ? 1 : -1;
      }
      if (left.isGuest != right.isGuest) {
        return left.isGuest ? 1 : -1;
      }
      return left.name.toLowerCase().compareTo(right.name.toLowerCase());
    });
    return entries;
  }

  int? _resolvePassengersAtNextStop(List<ActiveTripPassengerEntry> entries) {
    if (entries.isEmpty) {
      return null;
    }
    return entries
        .where((entry) => !entry.isSkipToday && !entry.isGuest)
        .length;
  }

  List<_DriverStopSnapshot> _parseDriverStops(
    QuerySnapshot<Map<String, dynamic>>? snapshot,
  ) {
    if (snapshot == null || snapshot.docs.isEmpty) {
      return const <_DriverStopSnapshot>[];
    }
    final stops = <_DriverStopSnapshot>[];
    for (final doc in snapshot.docs) {
      final data = doc.data();
      final location = _parseMapPointFromRaw(data['location']);
      if (location == null) {
        continue;
      }
      final rawName = (data['name'] as String?)?.trim();
      final name = (rawName == null || rawName.isEmpty) ? 'Durak' : rawName;
      final orderRaw = data['order'];
      final order = orderRaw is num ? orderRaw.toInt() : 9999;
      stops.add(
        _DriverStopSnapshot(
          stopId: doc.id,
          name: name,
          order: order,
          point: location,
        ),
      );
    }
    stops.sort((left, right) {
      final orderCompare = left.order.compareTo(right.order);
      if (orderCompare != 0) {
        return orderCompare;
      }
      return left.stopId.compareTo(right.stopId);
    });
    return stops;
  }

  List<ActiveTripMapPoint> _buildDriverRoutePathPoints({
    required Map<String, dynamic>? routeData,
    required List<_DriverStopSnapshot> orderedStops,
  }) {
    if (orderedStops.length >= 2) {
      return orderedStops.map((stop) => stop.point).toList(growable: false);
    }

    final startPoint = _parseMapPointFromRaw(routeData?['startPoint']);
    final endPoint = _parseMapPointFromRaw(routeData?['endPoint']);
    if (startPoint != null && endPoint != null) {
      if ((startPoint.lat - endPoint.lat).abs() < 0.0000001 &&
          (startPoint.lng - endPoint.lng).abs() < 0.0000001) {
        return <ActiveTripMapPoint>[startPoint];
      }
      return <ActiveTripMapPoint>[startPoint, endPoint];
    }
    if (orderedStops.length == 1) {
      return <ActiveTripMapPoint>[orderedStops.first.point];
    }
    return const <ActiveTripMapPoint>[];
  }

  _DriverStopSnapshot? _resolveNextStop({
    required List<_DriverStopSnapshot> orderedStops,
    required ActiveTripMapPoint? vehiclePoint,
  }) {
    if (orderedStops.isEmpty) {
      return null;
    }
    if (vehiclePoint == null) {
      return orderedStops.first;
    }

    var nearest = orderedStops.first;
    var nearestDistanceMeters = _distanceMetersBetween(
      vehiclePoint,
      nearest.point,
    );
    for (final stop in orderedStops.skip(1)) {
      final distanceMeters = _distanceMetersBetween(
        vehiclePoint,
        stop.point,
      );
      if (distanceMeters < nearestDistanceMeters) {
        nearest = stop;
        nearestDistanceMeters = distanceMeters;
      }
    }

    const arrivalThresholdMeters = 80.0;
    if (nearestDistanceMeters <= arrivalThresholdMeters) {
      final nextByOrder =
          orderedStops.where((candidate) => candidate.order > nearest.order);
      if (nextByOrder.isNotEmpty) {
        return nextByOrder.first;
      }
    }
    return nearest;
  }

  int? _resolveStopsRemaining({
    required List<_DriverStopSnapshot> orderedStops,
    required _DriverStopSnapshot? nextStop,
  }) {
    if (nextStop == null || orderedStops.isEmpty) {
      return 0;
    }
    return orderedStops.where((stop) => stop.order >= nextStop.order).length;
  }

  ActiveTripMapPoint? _parseMapPointFromRaw(Object? rawValue) {
    if (rawValue is! Map<Object?, Object?> &&
        rawValue is! Map<String, dynamic>) {
      return null;
    }
    final rawMap = rawValue is Map<String, dynamic>
        ? rawValue
        : Map<String, dynamic>.from(rawValue as Map<Object?, Object?>);
    final lat = _parseFiniteDouble(rawMap['lat']);
    final lng = _parseFiniteDouble(rawMap['lng']);
    if (lat == null || lng == null) {
      return null;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    return ActiveTripMapPoint(lat: lat, lng: lng);
  }

  double _distanceMetersBetween(
    ActiveTripMapPoint from,
    ActiveTripMapPoint to,
  ) {
    const earthRadiusMeters = 6371000.0;
    final lat1 = from.lat * (pi / 180.0);
    final lat2 = to.lat * (pi / 180.0);
    final deltaLat = (to.lat - from.lat) * (pi / 180.0);
    final deltaLng = (to.lng - from.lng) * (pi / 180.0);
    final sinLat = sin(deltaLat / 2.0);
    final sinLng = sin(deltaLng / 2.0);
    final a = (sinLat * sinLat) + (cos(lat1) * cos(lat2) * sinLng * sinLng);
    final c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    return earthRadiusMeters * c;
  }

  HeartbeatState _toUiHeartbeatState(ConnectionHeartbeatBand band) {
    return switch (band) {
      ConnectionHeartbeatBand.green => HeartbeatState.green,
      ConnectionHeartbeatBand.yellow => HeartbeatState.yellow,
      ConnectionHeartbeatBand.red => HeartbeatState.red,
    };
  }
}
