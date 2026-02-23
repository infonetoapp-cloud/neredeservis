import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/router_cached_passenger_route_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('RouterCachedPassengerRouteStore', () {
    late RouterCachedPassengerRouteStore store;

    setUp(() {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      store = const RouterCachedPassengerRouteStore();
    });

    test('returns null when cache is empty', () async {
      expect(await store.read(), isNull);
    });

    test('persists route id and optional route name', () async {
      await store.persist(routeId: ' route-1 ', routeName: ' Hat A ');
      final result = await store.read();

      expect(result, isNotNull);
      expect(result!.routeId, 'route-1');
      expect(result.routeName, 'Hat A');
    });

    test('ignores empty route id writes', () async {
      await store.persist(routeId: '   ', routeName: 'Hat');
      expect(await store.read(), isNull);
    });

    test('clears route name when blank and clear removes both keys', () async {
      await store.persist(routeId: 'route-1', routeName: 'Hat');
      await store.persist(routeId: 'route-1', routeName: '   ');

      final withoutName = await store.read();
      expect(withoutName, isNotNull);
      expect(withoutName!.routeId, 'route-1');
      expect(withoutName.routeName, isNull);

      await store.clear();
      expect(await store.read(), isNull);
    });
  });
}
