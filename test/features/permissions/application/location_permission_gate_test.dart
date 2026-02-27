import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/permissions/application/location_permission_gate.dart';

void main() {
  const gate = LocationPermissionGate();

  test('driver role can prompt location on start trip', () {
    final canPrompt = gate.shouldPromptLocationPermission(
      role: UserRole.driver,
      trigger: LocationPermissionPromptTrigger.startTrip,
    );

    expect(canPrompt, isTrue);
  });

  test('driver role can prompt location on driver home entry', () {
    final canPrompt = gate.shouldPromptLocationPermission(
      role: UserRole.driver,
      trigger: LocationPermissionPromptTrigger.driverHomeEntry,
    );

    expect(canPrompt, isTrue);
  });

  test('driver role can prompt location on ghost drive recording', () {
    final canPrompt = gate.shouldPromptLocationPermission(
      role: UserRole.driver,
      trigger: LocationPermissionPromptTrigger.ghostDriveRecording,
    );

    expect(canPrompt, isTrue);
  });

  test('passenger role cannot prompt location permission', () {
    final canPrompt = gate.shouldPromptLocationPermission(
      role: UserRole.passenger,
      trigger: LocationPermissionPromptTrigger.startTrip,
    );

    expect(canPrompt, isFalse);
  });

  test('guest role cannot prompt location permission', () {
    final canPrompt = gate.shouldPromptLocationPermission(
      role: UserRole.guest,
      trigger: LocationPermissionPromptTrigger.startTrip,
    );

    expect(canPrompt, isFalse);
  });

  test('unknown role cannot prompt location permission', () {
    final canPrompt = gate.shouldPromptLocationPermission(
      role: UserRole.unknown,
      trigger: LocationPermissionPromptTrigger.startTrip,
    );

    expect(canPrompt, isFalse);
  });
}
