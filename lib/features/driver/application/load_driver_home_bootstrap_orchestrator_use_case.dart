import '../../subscription/domain/driver_subscription_snapshot.dart';
import 'load_driver_home_header_bootstrap_use_case.dart';
import 'load_driver_home_route_section_use_case.dart';

typedef DriverHomeRouteSectionPerfTracker = void Function({
  required int durationMs,
  required String outcome,
  required int routeCount,
});

class DriverHomeBootstrapOrchestratorSeed {
  const DriverHomeBootstrapOrchestratorSeed({
    required this.userId,
    required this.fallbackDisplayName,
    this.fallbackPhotoUrl,
  });

  final String userId;
  final String fallbackDisplayName;
  final String? fallbackPhotoUrl;
}

class DriverHomeBootstrapOrchestratorResult<TTrip> {
  const DriverHomeBootstrapOrchestratorResult({
    required this.isDriver,
    this.driverDisplayName = 'Sofor',
    this.driverPhotoUrl,
    this.myTrips = const <Never>[],
    this.subscription = const DriverSubscriptionSnapshot(),
    this.routeSection,
  });

  final bool isDriver;
  final String driverDisplayName;
  final String? driverPhotoUrl;
  final List<TTrip> myTrips;
  final DriverSubscriptionSnapshot subscription;
  final DriverHomeRouteSectionResult? routeSection;
}

class LoadDriverHomeBootstrapOrchestratorUseCase<TTrip> {
  LoadDriverHomeBootstrapOrchestratorUseCase({
    required Future<DriverHomeHeaderBootstrapResult> Function(
      DriverHomeHeaderBootstrapSeed seed,
    ) loadHeaderBootstrap,
    required Future<List<TTrip>> Function() loadMyTrips,
    required Future<DriverSubscriptionSnapshot> Function(String uid)
        loadSubscriptionSnapshot,
    required Future<DriverHomeRouteSectionResult?> Function(String uid)
        loadRouteSection,
    DriverHomeRouteSectionPerfTracker? trackRouteSectionPerf,
  })  : _loadHeaderBootstrap = loadHeaderBootstrap,
        _loadMyTrips = loadMyTrips,
        _loadSubscriptionSnapshot = loadSubscriptionSnapshot,
        _loadRouteSection = loadRouteSection,
        _trackRouteSectionPerf = trackRouteSectionPerf;

  final Future<DriverHomeHeaderBootstrapResult> Function(
    DriverHomeHeaderBootstrapSeed seed,
  ) _loadHeaderBootstrap;
  final Future<List<TTrip>> Function() _loadMyTrips;
  final Future<DriverSubscriptionSnapshot> Function(String uid)
      _loadSubscriptionSnapshot;
  final Future<DriverHomeRouteSectionResult?> Function(String uid)
      _loadRouteSection;
  final DriverHomeRouteSectionPerfTracker? _trackRouteSectionPerf;

  Future<DriverHomeBootstrapOrchestratorResult<TTrip>> execute(
    DriverHomeBootstrapOrchestratorSeed seed,
  ) async {
    final header = await _loadHeaderBootstrap(
      DriverHomeHeaderBootstrapSeed(
        fallbackDisplayName: seed.fallbackDisplayName,
        userId: seed.userId,
        fallbackPhotoUrl: seed.fallbackPhotoUrl,
      ),
    );
    if (!header.isDriver) {
      return DriverHomeBootstrapOrchestratorResult<TTrip>(
        isDriver: false,
      );
    }

    List<TTrip> myTrips;
    try {
      myTrips = await _loadMyTrips();
    } catch (_) {
      myTrips = <TTrip>[];
    }

    final subscription = await _loadSubscriptionSnapshot(seed.userId);

    final routeSectionStopwatch = Stopwatch()..start();
    var routeSectionOutcome = 'success';
    var routeSectionRouteCount = 0;
    DriverHomeRouteSectionResult? routeSection;
    try {
      routeSection = await _loadRouteSection(seed.userId);
      routeSectionRouteCount = routeSection?.candidateRouteCount ?? 0;
    } catch (_) {
      routeSectionOutcome = 'error';
      rethrow;
    } finally {
      _trackRouteSectionPerf?.call(
        durationMs: routeSectionStopwatch.elapsedMilliseconds,
        outcome: routeSectionOutcome,
        routeCount: routeSectionRouteCount,
      );
    }

    return DriverHomeBootstrapOrchestratorResult<TTrip>(
      isDriver: true,
      driverDisplayName: header.driverDisplayName,
      driverPhotoUrl: header.driverPhotoUrl,
      myTrips: myTrips,
      subscription: subscription,
      routeSection: routeSection,
    );
  }
}
