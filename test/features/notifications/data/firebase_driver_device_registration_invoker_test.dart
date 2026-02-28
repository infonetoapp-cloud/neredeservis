import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/notifications/data/firebase_driver_device_registration_invoker.dart';

void main() {
  test(
      'FirebaseDriverDeviceRegistrationInvoker forwards registerDevice payload',
      () async {
    String? callableName;
    Map<String, dynamic>? payload;

    final invoker = FirebaseDriverDeviceRegistrationInvoker(
      invoker: (name, input) async {
        callableName = name;
        payload = Map<String, dynamic>.from(input);
        return <String, dynamic>{};
      },
    );

    await invoker.invoke(
      deviceId: 'android_12345678',
      activeDeviceToken: 'token-1',
      lastSeenAtUtc: DateTime.utc(2026, 2, 23, 12, 0, 0),
    );

    expect(callableName, 'registerDevice');
    expect(payload, <String, dynamic>{
      'deviceId': 'android_12345678',
      'activeDeviceToken': 'token-1',
      'lastSeenAt': '2026-02-23T12:00:00.000Z',
    });
  });
}
