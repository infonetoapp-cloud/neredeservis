import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/permissions/application/notification_permission_orchestrator.dart';

void main() {
  test('returns skipped when prompt is not supported', () async {
    var requested = false;
    final orchestrator = NotificationPermissionOrchestrator(
      isPromptSupported: () => false,
      readStatus: () async => AuthorizationStatus.notDetermined,
      requestStatus: () async {
        requested = true;
        return AuthorizationStatus.authorized;
      },
    );

    final outcome = await orchestrator.requestAtValueMoment(
      NotificationPermissionTrigger.passengerJoin,
    );

    expect(outcome, NotificationPermissionOutcome.skipped);
    expect(requested, isFalse);
  });

  test('returns alreadyGranted when status is authorized', () async {
    var requested = false;
    final orchestrator = NotificationPermissionOrchestrator(
      isPromptSupported: () => true,
      readStatus: () async => AuthorizationStatus.authorized,
      requestStatus: () async {
        requested = true;
        return AuthorizationStatus.authorized;
      },
    );

    final outcome = await orchestrator.requestAtValueMoment(
      NotificationPermissionTrigger.driverAnnouncement,
    );

    expect(outcome, NotificationPermissionOutcome.alreadyGranted);
    expect(requested, isFalse);
  });

  test('requests permission and returns granted', () async {
    var requestCount = 0;
    final orchestrator = NotificationPermissionOrchestrator(
      isPromptSupported: () => true,
      readStatus: () async => AuthorizationStatus.notDetermined,
      requestStatus: () async {
        requestCount++;
        return AuthorizationStatus.authorized;
      },
    );

    final outcome = await orchestrator.requestAtValueMoment(
      NotificationPermissionTrigger.passengerJoin,
    );

    expect(outcome, NotificationPermissionOutcome.granted);
    expect(requestCount, 1);
  });

  test('requests permission and returns denied', () async {
    var requestCount = 0;
    final orchestrator = NotificationPermissionOrchestrator(
      isPromptSupported: () => true,
      readStatus: () async => AuthorizationStatus.denied,
      requestStatus: () async {
        requestCount++;
        return AuthorizationStatus.denied;
      },
    );

    final outcome = await orchestrator.requestAtValueMoment(
      NotificationPermissionTrigger.driverAnnouncement,
    );

    expect(outcome, NotificationPermissionOutcome.denied);
    expect(requestCount, 1);
  });
}
