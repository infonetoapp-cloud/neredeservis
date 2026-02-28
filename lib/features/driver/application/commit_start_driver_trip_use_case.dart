import '../domain/driver_trip_start_repository.dart';
import 'read_driver_active_trip_transition_version_use_case.dart';
import 'start_driver_trip_use_case.dart';

class CommitStartDriverTripCommand {
  const CommitStartDriverTripCommand({
    required this.routeId,
    required this.uid,
    required this.devicePlatformKey,
    required this.idempotencyKey,
  });

  final String routeId;
  final String uid;
  final String devicePlatformKey;
  final String idempotencyKey;
}

class CommitStartDriverTripResult {
  const CommitStartDriverTripResult({
    required this.tripId,
    required this.status,
  });

  final String tripId;
  final String status;

  bool get isActiveTripStarted => tripId.isNotEmpty && status == 'active';
}

class CommitStartDriverTripUseCase {
  CommitStartDriverTripUseCase({
    required ReadDriverActiveTripTransitionVersionUseCase
        readTransitionVersionUseCase,
    required StartDriverTripUseCase startDriverTripUseCase,
  }) : _readTransitionVersionUseCase = readTransitionVersionUseCase,
       _startDriverTripUseCase = startDriverTripUseCase;

  final ReadDriverActiveTripTransitionVersionUseCase _readTransitionVersionUseCase;
  final StartDriverTripUseCase _startDriverTripUseCase;

  Future<CommitStartDriverTripResult> execute(
    CommitStartDriverTripCommand command,
  ) async {
    final expectedTransitionVersion =
        await _readTransitionVersionUseCase.execute(command.routeId);
    final uidPrefix = command.uid.length <= 8
        ? command.uid
        : command.uid.substring(0, 8);
    final deviceId = '${command.devicePlatformKey}_$uidPrefix';
    final result = await _startDriverTripUseCase.execute(
      DriverTripStartCommand(
        routeId: command.routeId,
        deviceId: deviceId,
        idempotencyKey: command.idempotencyKey,
        expectedTransitionVersion: expectedTransitionVersion,
      ),
    );
    return CommitStartDriverTripResult(
      tripId: result.tripId,
      status: result.status,
    );
  }
}
