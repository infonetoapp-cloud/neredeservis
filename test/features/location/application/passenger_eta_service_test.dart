import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/application/passenger_eta_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  PassengerEtaInput buildInput({
    required PassengerEtaPoint rawVehiclePoint,
    PassengerEtaPoint? filteredVehiclePoint,
    PassengerEtaPoint? destinationPoint,
    List<PassengerEtaPoint>? routeFallbackPath,
    String fallbackLabel = 'Sanal Durak: Ev',
  }) {
    return PassengerEtaInput(
      routeId: 'route-1',
      fallbackEtaSourceLabel: fallbackLabel,
      rawVehiclePoint: rawVehiclePoint,
      filteredVehiclePoint: filteredVehiclePoint,
      destinationPoint: destinationPoint,
      routePolylineEncoded: null,
      routeFallbackPath: routeFallbackPath ?? const <PassengerEtaPoint>[],
    );
  }

  group('PassengerEtaService', () {
    test('uses crow-fly fallback when directions gate is closed', () async {
      var directionsCalls = 0;
      final service = PassengerEtaService(
        directionsInvoker: (_) async {
          directionsCalls += 1;
          return const PassengerDirectionsDuration(durationSeconds: 300);
        },
        directionsCompileEnabledOverride: false,
      );

      final result = await service.resolve(
        input: buildInput(
          rawVehiclePoint: const PassengerEtaPoint(lat: 40.0, lng: 29.0),
          destinationPoint: const PassengerEtaPoint(lat: 40.0, lng: 29.01),
        ),
      );

      expect(directionsCalls, 0);
      expect(result.source, PassengerEtaSource.crowFlyFallback);
      expect(result.estimatedMinutes, isNotNull);
      expect(result.etaSourceLabel, contains('Kus ucusu'));
      expect(result.lastEtaSourceKey, 'crow_fly_fallback');
    });

    test('switches to off-route ETA mode when distance to route exceeds 500m',
        () async {
      final service = PassengerEtaService(
        directionsCompileEnabledOverride: false,
      );

      final result = service.buildFallback(
        input: buildInput(
          rawVehiclePoint: const PassengerEtaPoint(lat: 0.01, lng: 0.005),
          filteredVehiclePoint: const PassengerEtaPoint(lat: 0.0, lng: 0.005),
          destinationPoint: const PassengerEtaPoint(lat: 0.0, lng: 0.02),
          routeFallbackPath: const <PassengerEtaPoint>[
            PassengerEtaPoint(lat: 0.0, lng: 0.0),
            PassengerEtaPoint(lat: 0.0, lng: 0.01),
          ],
        ),
      );

      expect(result.source, PassengerEtaSource.offRouteEta);
      expect(result.isOffRouteEta, isTrue);
      expect(result.useRawMarkerPoint, isTrue);
      expect(result.etaSourceLabel, contains('Alternatif guzergah'));
      expect(result.lastEtaSourceKey, 'off_route_eta');
    });

    test('uses directions result when enabled and under cap', () async {
      PassengerDirectionsRequest? capturedRequest;
      final service = PassengerEtaService(
        directionsCompileEnabledOverride: true,
        runtimeGateLoader: () async => const PassengerDirectionsRuntimeGate(
          enabled: true,
          monthlyRequestMax: 100,
        ),
        directionsInvoker: (request) async {
          capturedRequest = request;
          return const PassengerDirectionsDuration(durationSeconds: 600);
        },
      );

      final result = await service.resolve(
        input: buildInput(
          rawVehiclePoint: const PassengerEtaPoint(lat: 40.0, lng: 29.0),
          filteredVehiclePoint:
              const PassengerEtaPoint(lat: 40.001, lng: 29.001),
          destinationPoint: const PassengerEtaPoint(lat: 40.01, lng: 29.02),
          routeFallbackPath: const <PassengerEtaPoint>[
            PassengerEtaPoint(lat: 40.0, lng: 29.0),
            PassengerEtaPoint(lat: 40.02, lng: 29.03),
          ],
        ),
      );

      expect(capturedRequest, isNotNull);
      expect(capturedRequest!.origin.lat, closeTo(40.001, 0.0000001));
      expect(capturedRequest!.origin.lng, closeTo(29.001, 0.0000001));
      expect(result.source, PassengerEtaSource.directionsApi);
      expect(result.estimatedMinutes, 10);
      expect(result.etaSourceLabel, contains('Directions API'));
      expect(result.lastEtaSourceKey, 'directions_api');
    });

    test('enforces 1 request per 20 seconds per route', () async {
      var nowUtc = DateTime.utc(2026, 2, 19, 10, 0, 0);
      var directionsCalls = 0;
      final service = PassengerEtaService(
        nowProvider: () => nowUtc,
        directionsCompileEnabledOverride: true,
        runtimeGateLoader: () async => const PassengerDirectionsRuntimeGate(
          enabled: true,
          monthlyRequestMax: 100,
        ),
        directionsInvoker: (_) async {
          directionsCalls += 1;
          return const PassengerDirectionsDuration(durationSeconds: 300);
        },
      );

      final input = buildInput(
        rawVehiclePoint: const PassengerEtaPoint(lat: 40.0, lng: 29.0),
        filteredVehiclePoint: const PassengerEtaPoint(lat: 40.0, lng: 29.001),
        destinationPoint: const PassengerEtaPoint(lat: 40.01, lng: 29.02),
        routeFallbackPath: const <PassengerEtaPoint>[
          PassengerEtaPoint(lat: 40.0, lng: 29.0),
          PassengerEtaPoint(lat: 40.02, lng: 29.03),
        ],
      );

      final first = await service.resolve(input: input);
      nowUtc = nowUtc.add(const Duration(seconds: 5));
      final second = await service.resolve(input: input);
      nowUtc = nowUtc.add(const Duration(seconds: 21));
      final third = await service.resolve(input: input);

      expect(first.source, PassengerEtaSource.directionsApi);
      expect(second.source, PassengerEtaSource.directionsApi);
      expect(third.source, PassengerEtaSource.directionsApi);
      expect(directionsCalls, 2);
    });

    test('falls back after monthly hard cap is reached', () async {
      var nowUtc = DateTime.utc(2026, 2, 19, 10, 0, 0);
      var directionsCalls = 0;
      final service = PassengerEtaService(
        nowProvider: () => nowUtc,
        directionsCompileEnabledOverride: true,
        runtimeGateLoader: () async => const PassengerDirectionsRuntimeGate(
          enabled: true,
          monthlyRequestMax: 1,
        ),
        directionsInvoker: (_) async {
          directionsCalls += 1;
          return const PassengerDirectionsDuration(durationSeconds: 420);
        },
      );

      final input = buildInput(
        rawVehiclePoint: const PassengerEtaPoint(lat: 40.0, lng: 29.0),
        destinationPoint: const PassengerEtaPoint(lat: 40.01, lng: 29.02),
        routeFallbackPath: const <PassengerEtaPoint>[
          PassengerEtaPoint(lat: 40.0, lng: 29.0),
          PassengerEtaPoint(lat: 40.02, lng: 29.03),
        ],
      );

      final first = await service.resolve(input: input);
      nowUtc = nowUtc.add(const Duration(seconds: 25));
      final second = await service.resolve(input: input);

      expect(first.source, PassengerEtaSource.directionsApi);
      expect(second.source, PassengerEtaSource.crowFlyFallback);
      expect(second.etaSourceLabel, contains('Kus ucusu'));
      expect(directionsCalls, 1);
    });

    test('off-route mode sends raw GPS to directions request', () async {
      PassengerDirectionsRequest? capturedRequest;
      final service = PassengerEtaService(
        directionsCompileEnabledOverride: true,
        runtimeGateLoader: () async => const PassengerDirectionsRuntimeGate(
          enabled: true,
          monthlyRequestMax: 100,
        ),
        directionsInvoker: (request) async {
          capturedRequest = request;
          return const PassengerDirectionsDuration(durationSeconds: 360);
        },
      );

      final result = await service.resolve(
        input: buildInput(
          rawVehiclePoint: const PassengerEtaPoint(lat: 0.01, lng: 0.005),
          filteredVehiclePoint: const PassengerEtaPoint(lat: 0.0, lng: 0.005),
          destinationPoint: const PassengerEtaPoint(lat: 0.0, lng: 0.02),
          routeFallbackPath: const <PassengerEtaPoint>[
            PassengerEtaPoint(lat: 0.0, lng: 0.0),
            PassengerEtaPoint(lat: 0.0, lng: 0.01),
          ],
        ),
      );

      expect(capturedRequest, isNotNull);
      expect(capturedRequest!.origin.lat, closeTo(0.01, 0.0000001));
      expect(capturedRequest!.origin.lng, closeTo(0.005, 0.0000001));
      expect(result.source, PassengerEtaSource.offRouteEta);
      expect(result.lastEtaSourceKey, 'off_route_eta');
      expect(result.etaSourceLabel, contains('Alternatif guzergah'));
    });
  });
}
