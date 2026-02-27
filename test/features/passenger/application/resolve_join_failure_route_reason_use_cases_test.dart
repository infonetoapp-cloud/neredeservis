import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/resolve_guest_join_failure_route_reason_use_case.dart';
import 'package:neredeservis/features/passenger/application/resolve_passenger_join_failure_route_reason_use_case.dart';

void main() {
  group('ResolvePassengerJoinFailureRouteReasonUseCase', () {
    const useCase = ResolvePassengerJoinFailureRouteReasonUseCase();

    test('maps rate limit and session expiry', () {
      expect(
        useCase.execute(errorCode: 'resource-exhausted'),
        'rate_limited',
      );
      expect(
        useCase.execute(errorCode: 'unauthenticated'),
        'session_expired',
      );
    });
  });

  group('ResolveGuestJoinFailureRouteReasonUseCase', () {
    const useCase = ResolveGuestJoinFailureRouteReasonUseCase();

    test('maps permission denied to join_closed and unknown fallback', () {
      expect(useCase.execute(errorCode: 'permission-denied'), 'join_closed');
      expect(useCase.execute(errorCode: 'internal'), 'unknown');
    });
  });
}
