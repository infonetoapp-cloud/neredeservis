import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/notifications/application/route_topic_subscription_service.dart';

void main() {
  group('buildRouteTopicName', () {
    test('normalizes route id into topic-safe string', () {
      final topic = buildRouteTopicName('Route/ABC 123');
      expect(topic, 'route_route_abc_123');
    });

    test('caps long route id suffix to 80 chars', () {
      final routeId = 'x' * 100;
      final topic = buildRouteTopicName(routeId);
      expect(topic.length, lessThanOrEqualTo(86));
      expect(topic.startsWith('route_'), isTrue);
    });

    test('throws for empty route id', () {
      expect(
        () => buildRouteTopicName('   '),
        throwsA(isA<ArgumentError>()),
      );
    });
  });

  group('RouteTopicSubscriptionService', () {
    test('subscribes and unsubscribes using normalized topic name', () async {
      final subscribedTopics = <String>[];
      final unsubscribedTopics = <String>[];

      final service = RouteTopicSubscriptionService(
        subscribeInvoker: (topic) async {
          subscribedTopics.add(topic);
        },
        unsubscribeInvoker: (topic) async {
          unsubscribedTopics.add(topic);
        },
      );

      await service.subscribeRouteTopic('Route-1');
      await service.unsubscribeRouteTopic('Route-1');

      expect(subscribedTopics, <String>['route_route-1']);
      expect(unsubscribedTopics, <String>['route_route-1']);
    });
  });
}
