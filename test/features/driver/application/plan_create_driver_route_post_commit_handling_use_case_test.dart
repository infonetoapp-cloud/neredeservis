import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_create_driver_route_post_commit_handling_use_case.dart';

void main() {
  group('PlanCreateDriverRoutePostCommitHandlingUseCase', () {
    const useCase = PlanCreateDriverRoutePostCommitHandlingUseCase();

    test('builds cache write plan when uid and routeId are present', () {
      final plan = useCase.execute(
        const PlanCreateDriverRoutePostCommitHandlingCommand(
          currentUserUid: 'u1',
          routeId: 'r1',
          srvCode: 'SRV123',
          routeName: 'Test Route',
          startAddress: 'A',
          endAddress: 'B',
          startLat: 1,
          startLng: 2,
          endLat: 3,
          endLng: 4,
          scheduledTime: '08:30',
        ),
      );

      expect(plan.srvCode, 'SRV123');
      expect(plan.driverHomePreviewRouteId, 'r1');
      expect(plan.shouldForceDriverHomeRefresh, isTrue);
      expect(plan.recentCacheWrite, isNotNull);
      expect(plan.recentCacheWrite!.uid, 'u1');
      expect(plan.recentCacheWrite!.routeId, 'r1');
      expect(plan.recentCacheWrite!.routeName, 'Test Route');
    });

    test('skips cache write plan when uid is missing', () {
      final plan = useCase.execute(
        const PlanCreateDriverRoutePostCommitHandlingCommand(
          currentUserUid: null,
          routeId: 'r1',
          srvCode: 'SRV123',
          routeName: 'Test Route',
          startAddress: 'A',
          endAddress: 'B',
          startLat: 1,
          startLng: 2,
          endLat: 3,
          endLng: 4,
          scheduledTime: '08:30',
        ),
      );

      expect(plan.recentCacheWrite, isNull);
      expect(plan.driverHomePreviewRouteId, 'r1');
    });

    test('skips cache write plan when routeId is missing', () {
      final plan = useCase.execute(
        const PlanCreateDriverRoutePostCommitHandlingCommand(
          currentUserUid: 'u1',
          routeId: null,
          srvCode: 'SRV123',
          routeName: 'Test Route',
          startAddress: 'A',
          endAddress: 'B',
          startLat: 1,
          startLng: 2,
          endLat: 3,
          endLng: 4,
          scheduledTime: '08:30',
        ),
      );

      expect(plan.recentCacheWrite, isNull);
      expect(plan.driverHomePreviewRouteId, isNull);
      expect(plan.shouldForceDriverHomeRefresh, isTrue);
    });
  });
}
