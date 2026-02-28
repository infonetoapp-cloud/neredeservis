import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/prepare_driver_phone_visibility_toggle_upsert_command_use_case.dart';
import 'package:neredeservis/features/driver/application/read_driver_profile_record_use_case.dart';

void main() {
  group('PrepareDriverPhoneVisibilityToggleUpsertCommandUseCase', () {
    const useCase = PrepareDriverPhoneVisibilityToggleUpsertCommandUseCase();

    test('returns failure when profile is incomplete', () {
      final result = useCase.execute(
        const PrepareDriverPhoneVisibilityToggleUpsertCommand(
          driverProfile: DriverProfileRecordSnapshot(
            name: 'A',
            phone: '123',
            plate: '12',
            showPhoneToPassengers: false,
            companyId: null,
          ),
          showPhoneToPassengers: true,
        ),
      );

      expect(result.isSuccess, isFalse);
      expect(
        result.failure,
        PrepareDriverPhoneVisibilityToggleUpsertFailure.incompleteDriverProfile,
      );
      expect(result.upsertCommand, isNull);
    });

    test('builds normalized upsert command for valid profile', () {
      final result = useCase.execute(
        const PrepareDriverPhoneVisibilityToggleUpsertCommand(
          driverProfile: DriverProfileRecordSnapshot(
            name: '  Ahmet  ',
            phone: ' 05551234567 ',
            plate: ' 34 abc 123 ',
            showPhoneToPassengers: false,
            companyId: '  comp_1  ',
          ),
          showPhoneToPassengers: true,
        ),
      );

      expect(result.isSuccess, isTrue);
      final command = result.upsertCommand!;
      expect(command.name, 'Ahmet');
      expect(command.phone, '05551234567');
      expect(command.plate, '34 ABC 123');
      expect(command.showPhoneToPassengers, isTrue);
      expect(command.companyId, 'comp_1');
    });

    test('normalizes blank company id to null', () {
      final result = useCase.execute(
        const PrepareDriverPhoneVisibilityToggleUpsertCommand(
          driverProfile: DriverProfileRecordSnapshot(
            name: 'Driver Name',
            phone: '5551234567',
            plate: '06ABC06',
            showPhoneToPassengers: false,
            companyId: '   ',
          ),
          showPhoneToPassengers: false,
        ),
      );

      expect(result.upsertCommand?.companyId, isNull);
    });
  });
}
