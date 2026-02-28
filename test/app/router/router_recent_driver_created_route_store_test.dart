import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/router_recent_driver_created_route_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('RouterRecentDriverCreatedRouteStore', () {
    late RouterRecentDriverCreatedRouteStore store;

    setUp(() {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      store = const RouterRecentDriverCreatedRouteStore();
    });

    test('returns empty list when uid is blank or no cache exists', () async {
      expect(
        await store.loadRawItemsForUid(uid: '   '),
        isEmpty,
      );
      expect(
        await store.loadRawItemsForUid(uid: 'driver-1'),
        isEmpty,
      );
    });

    test('saves and loads decoded raw item maps', () async {
      await store.saveRawItemsForUid(
        uid: ' driver-1 ',
        items: <Map<String, dynamic>>[
          <String, dynamic>{'routeId': 'r1', 'routeName': 'Hat A'},
          <String, dynamic>{'routeId': 'r2', 'createdAtUtc': '2026-02-23'},
        ],
      );

      final result = await store.loadRawItemsForUid(uid: 'driver-1');
      expect(result, hasLength(2));
      expect(result.first['routeId'], 'r1');
      expect(result.first['routeName'], 'Hat A');
      expect(result.last['routeId'], 'r2');
    });

    test('returns empty when malformed cached entry breaks hydration parsing',
        () async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        'driver_recent_route_stubs_v1_driver-1': <String>[
          '',
          'not-json',
          '[]',
          '{"routeId":"r1"}',
        ],
      });
      const freshStore = RouterRecentDriverCreatedRouteStore();

      final result = await freshStore.loadRawItemsForUid(uid: 'driver-1');
      expect(result, isEmpty);
    });
  });
}
