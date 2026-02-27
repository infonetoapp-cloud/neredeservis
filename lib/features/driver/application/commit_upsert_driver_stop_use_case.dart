import '../domain/driver_stop_mutation_repository.dart';
import 'upsert_driver_stop_use_case.dart';

class CommitUpsertDriverStopCommand {
  const CommitUpsertDriverStopCommand({
    required this.routeId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
    this.stopId,
  });

  final String routeId;
  final String? stopId;
  final String name;
  final double lat;
  final double lng;
  final int order;
}

class CommitUpsertDriverStopResult {
  const CommitUpsertDriverStopResult({
    required this.stopId,
  });

  final String stopId;
}

class CommitUpsertDriverStopUseCase {
  const CommitUpsertDriverStopUseCase({
    required UpsertDriverStopUseCase upsertDriverStopUseCase,
  }) : _upsertDriverStopUseCase = upsertDriverStopUseCase;

  final UpsertDriverStopUseCase _upsertDriverStopUseCase;

  Future<CommitUpsertDriverStopResult> execute(
    CommitUpsertDriverStopCommand command,
  ) async {
    final result = await _upsertDriverStopUseCase.execute(
      DriverStopUpsertCommand(
        routeId: command.routeId,
        stopId: command.stopId,
        name: command.name,
        lat: command.lat,
        lng: command.lng,
        order: command.order,
      ),
    );
    return CommitUpsertDriverStopResult(stopId: result.stopId);
  }
}
