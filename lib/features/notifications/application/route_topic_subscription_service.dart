import 'package:firebase_messaging/firebase_messaging.dart';

class RouteTopicSubscriptionService {
  RouteTopicSubscriptionService({
    TopicSubscribeInvoker? subscribeInvoker,
    TopicUnsubscribeInvoker? unsubscribeInvoker,
  })  : _subscribeInvoker =
            subscribeInvoker ?? FirebaseMessaging.instance.subscribeToTopic,
        _unsubscribeInvoker = unsubscribeInvoker ??
            FirebaseMessaging.instance.unsubscribeFromTopic;

  final TopicSubscribeInvoker _subscribeInvoker;
  final TopicUnsubscribeInvoker _unsubscribeInvoker;

  Future<void> subscribeRouteTopic(String routeId) {
    final topic = buildRouteTopicName(routeId);
    return _subscribeInvoker(topic);
  }

  Future<void> unsubscribeRouteTopic(String routeId) {
    final topic = buildRouteTopicName(routeId);
    return _unsubscribeInvoker(topic);
  }
}

typedef TopicSubscribeInvoker = Future<void> Function(String topic);
typedef TopicUnsubscribeInvoker = Future<void> Function(String topic);

String buildRouteTopicName(String routeId) {
  final trimmed = routeId.trim().toLowerCase();
  if (trimmed.isEmpty) {
    throw ArgumentError.value(routeId, 'routeId', 'routeId bos olamaz');
  }
  final normalized = trimmed.replaceAll(RegExp(r'[^a-z0-9_-]'), '_');
  if (normalized.isEmpty) {
    throw ArgumentError.value(
        routeId, 'routeId', 'routeId topic icin gecersiz');
  }
  final cappedSuffix =
      normalized.length <= 80 ? normalized : normalized.substring(0, 80);
  return 'route_$cappedSuffix';
}
