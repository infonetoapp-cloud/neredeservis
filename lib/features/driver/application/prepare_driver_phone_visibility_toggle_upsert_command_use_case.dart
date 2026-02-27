import '../domain/driver_profile_upsert_repository.dart';
import 'read_driver_profile_record_use_case.dart';

enum PrepareDriverPhoneVisibilityToggleUpsertFailure {
  incompleteDriverProfile,
}

class PrepareDriverPhoneVisibilityToggleUpsertCommand {
  const PrepareDriverPhoneVisibilityToggleUpsertCommand({
    required this.driverProfile,
    required this.showPhoneToPassengers,
  });

  final DriverProfileRecordSnapshot? driverProfile;
  final bool showPhoneToPassengers;
}

class PrepareDriverPhoneVisibilityToggleUpsertResult {
  const PrepareDriverPhoneVisibilityToggleUpsertResult.success(
    this.upsertCommand,
  ) : failure = null;

  const PrepareDriverPhoneVisibilityToggleUpsertResult.failure(
    this.failure,
  ) : upsertCommand = null;

  final DriverProfileUpsertCommand? upsertCommand;
  final PrepareDriverPhoneVisibilityToggleUpsertFailure? failure;

  bool get isSuccess => upsertCommand != null;
}

class PrepareDriverPhoneVisibilityToggleUpsertCommandUseCase {
  const PrepareDriverPhoneVisibilityToggleUpsertCommandUseCase();

  PrepareDriverPhoneVisibilityToggleUpsertResult execute(
    PrepareDriverPhoneVisibilityToggleUpsertCommand command,
  ) {
    final profile = command.driverProfile;
    final name = (profile?.name ?? '').trim();
    final phone = (profile?.phone ?? '').trim();
    final plate = (profile?.plate ?? '').trim().toUpperCase();

    if (name.length < 2 || phone.length < 7 || plate.length < 3) {
      return const PrepareDriverPhoneVisibilityToggleUpsertResult.failure(
        PrepareDriverPhoneVisibilityToggleUpsertFailure.incompleteDriverProfile,
      );
    }

    final companyIdRaw = profile?.companyId?.trim();
    final companyId =
        (companyIdRaw == null || companyIdRaw.isEmpty) ? null : companyIdRaw;

    return PrepareDriverPhoneVisibilityToggleUpsertResult.success(
      DriverProfileUpsertCommand(
        name: name,
        phone: phone,
        plate: plate,
        showPhoneToPassengers: command.showPhoneToPassengers,
        companyId: companyId,
      ),
    );
  }
}
