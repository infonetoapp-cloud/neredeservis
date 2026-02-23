import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/load_driver_home_bootstrap_orchestrator_use_case.dart';
import 'package:neredeservis/features/driver/application/load_driver_home_header_bootstrap_use_case.dart';
import 'package:neredeservis/features/driver/application/load_driver_home_route_section_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_home_route_section_repository.dart';
import 'package:neredeservis/features/subscription/domain/driver_subscription_snapshot.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';

void main() {
  group('LoadDriverHomeBootstrapOrchestratorUseCase', () {
    test('short-circuits on non-driver header and skips downstream loaders',
        () async {
      var myTripsCalls = 0;
      var subscriptionCalls = 0;
      var routeSectionCalls = 0;
      var perfCalls = 0;

      final useCase = LoadDriverHomeBootstrapOrchestratorUseCase<String>(
        loadHeaderBootstrap: (_) async => const DriverHomeHeaderBootstrapResult(
          isDriver: false,
          driverDisplayName: 'Seed',
        ),
        loadMyTrips: () async {
          myTripsCalls++;
          return const <String>[];
        },
        loadSubscriptionSnapshot: (_) async {
          subscriptionCalls++;
          return const DriverSubscriptionSnapshot();
        },
        loadRouteSection: (_) async {
          routeSectionCalls++;
          return null;
        },
        trackRouteSectionPerf: ({
          required durationMs,
          required outcome,
          required routeCount,
        }) {
          perfCalls++;
        },
      );

      final result = await useCase.execute(
        const DriverHomeBootstrapOrchestratorSeed(
          userId: 'u1',
          fallbackDisplayName: 'Fallback',
        ),
      );

      expect(result.isDriver, isFalse);
      expect(myTripsCalls, 0);
      expect(subscriptionCalls, 0);
      expect(routeSectionCalls, 0);
      expect(perfCalls, 0);
    });

    test('loads all sections and reports route perf on success', () async {
      var perfOutcome = '';
      var perfRouteCount = -1;
      const routeSection = DriverHomeRouteSectionResult(
        routeId: 'r1',
        routeName: 'Route 1',
        stops: <DriverHomeStopSummary>[
          DriverHomeStopSummary(stopId: 's1', name: 'A', order: 1),
        ],
        candidateRouteCount: 3,
        queuedPassengerCount: 2,
      );

      final useCase = LoadDriverHomeBootstrapOrchestratorUseCase<String>(
        loadHeaderBootstrap: (_) async => const DriverHomeHeaderBootstrapResult(
          isDriver: true,
          driverDisplayName: 'Driver',
          driverPhotoUrl: 'photo',
        ),
        loadMyTrips: () async => const <String>['trip1', 'trip2'],
        loadSubscriptionSnapshot: (_) async => const DriverSubscriptionSnapshot(
          status: SubscriptionUiStatus.active,
          trialDaysLeft: 7,
        ),
        loadRouteSection: (_) async => routeSection,
        trackRouteSectionPerf: ({
          required durationMs,
          required outcome,
          required routeCount,
        }) {
          perfOutcome = outcome;
          perfRouteCount = routeCount;
          expect(durationMs, greaterThanOrEqualTo(0));
        },
      );

      final result = await useCase.execute(
        const DriverHomeBootstrapOrchestratorSeed(
          userId: 'driver-1',
          fallbackDisplayName: 'Fallback',
          fallbackPhotoUrl: 'seed',
        ),
      );

      expect(result.isDriver, isTrue);
      expect(result.driverDisplayName, 'Driver');
      expect(result.driverPhotoUrl, 'photo');
      expect(result.myTrips, <String>['trip1', 'trip2']);
      expect(result.subscription.status, SubscriptionUiStatus.active);
      expect(result.subscription.trialDaysLeft, 7);
      expect(result.routeSection, same(routeSection));
      expect(perfOutcome, 'success');
      expect(perfRouteCount, 3);
    });

    test('falls back to empty myTrips when myTrips loader throws', () async {
      final useCase = LoadDriverHomeBootstrapOrchestratorUseCase<String>(
        loadHeaderBootstrap: (_) async => const DriverHomeHeaderBootstrapResult(
          isDriver: true,
          driverDisplayName: 'Driver',
        ),
        loadMyTrips: () async => throw Exception('myTrips'),
        loadSubscriptionSnapshot: (_) async =>
            const DriverSubscriptionSnapshot(),
        loadRouteSection: (_) async => null,
      );

      final result = await useCase.execute(
        const DriverHomeBootstrapOrchestratorSeed(
          userId: 'driver-1',
          fallbackDisplayName: 'Fallback',
        ),
      );

      expect(result.isDriver, isTrue);
      expect(result.myTrips, isEmpty);
      expect(result.routeSection, isNull);
    });

    test('tracks error perf and rethrows when route section loader fails',
        () async {
      var perfOutcome = '';
      var perfRouteCount = -1;

      final useCase = LoadDriverHomeBootstrapOrchestratorUseCase<String>(
        loadHeaderBootstrap: (_) async => const DriverHomeHeaderBootstrapResult(
          isDriver: true,
          driverDisplayName: 'Driver',
        ),
        loadMyTrips: () async => const <String>[],
        loadSubscriptionSnapshot: (_) async =>
            const DriverSubscriptionSnapshot(),
        loadRouteSection: (_) async => throw StateError('route'),
        trackRouteSectionPerf: ({
          required durationMs,
          required outcome,
          required routeCount,
        }) {
          perfOutcome = outcome;
          perfRouteCount = routeCount;
        },
      );

      await expectLater(
        () => useCase.execute(
          const DriverHomeBootstrapOrchestratorSeed(
            userId: 'driver-1',
            fallbackDisplayName: 'Fallback',
          ),
        ),
        throwsA(isA<StateError>()),
      );
      expect(perfOutcome, 'error');
      expect(perfRouteCount, 0);
    });
  });
}
