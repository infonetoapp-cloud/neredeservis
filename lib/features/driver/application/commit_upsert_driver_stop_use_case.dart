import '../domain/driver_stop_mutation_repository.dart';
import 'upsert_driver_stop_use_case.dart';

class CommitUpsertDriverStopCommand {
  const CommitUpsertDriverStopCommand({
    this.companyId,
    required this.routeId,
    this.lastKnownUpdateToken,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
    this.stopId,
  });

  final String? companyId;
  final String routeId;
  final String? lastKnownUpdateToken;
  final String? stopId;
  final String name;
  final double lat;
  final double lng;
  final int order;
}

class CommitUpsertDriverStopResult {
  const CommitUpsertDriverStopResult({
    required this.stopId,
    this.updatedAt,
  });

  final String stopId;
  final String? updatedAt;
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
        companyId: command.companyId,
        routeId: command.routeId,
        lastKnownUpdateToken: command.lastKnownUpdateToken,
        stopId: command.stopId,
        name: command.name,
        lat: command.lat,
        lng: command.lng,
        order: command.order,
      ),
    );
    return CommitUpsertDriverStopResult(
      stopId: result.stopId,
      updatedAt: result.updatedAt,
    );
  }
}
