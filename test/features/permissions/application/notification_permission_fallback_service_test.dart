import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/permissions/application/notification_permission_fallback_service.dart';
import 'package:neredeservis/features/permissions/application/notification_permission_orchestrator.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  test('shows denied banner when no prior cooldown record exists', () async {
    final service = NotificationPermissionFallbackService(
      nowUtc: () => DateTime.utc(2026, 2, 19, 8, 0, 0),
    );

    final shouldShow = await service.shouldShowDeniedBanner(
      NotificationPermissionTrigger.passengerJoin,
    );

    expect(shouldShow, isTrue);
  });

  test('suppresses denied banner during cooldown window', () async {
    final currentTime = DateTime.utc(2026, 2, 19, 8, 0, 0);
    final service = NotificationPermissionFallbackService(
      nowUtc: () => currentTime,
    );

    await service.markDeniedBannerShown(
      NotificationPermissionTrigger.driverAnnouncement,
    );
    final shouldShow = await service.shouldShowDeniedBanner(
      NotificationPermissionTrigger.driverAnnouncement,
    );

    expect(shouldShow, isFalse);
  });

  test('allows denied banner after 24 hour cooldown expires', () async {
    var currentTime = DateTime.utc(2026, 2, 19, 8, 0, 0);
    final service = NotificationPermissionFallbackService(
      nowUtc: () => currentTime,
    );

    await service.markDeniedBannerShown(
      NotificationPermissionTrigger.passengerJoin,
    );
    currentTime = currentTime.add(const Duration(hours: 25));

    final shouldShow = await service.shouldShowDeniedBanner(
      NotificationPermissionTrigger.passengerJoin,
    );

    expect(shouldShow, isTrue);
  });
}
