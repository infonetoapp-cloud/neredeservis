import '../domain/driver_stop_mutation_repository.dart';
import 'delete_driver_stop_use_case.dart';

class CommitDeleteDriverStopCommand {
  const CommitDeleteDriverStopCommand({
    this.companyId,
    required this.routeId,
    required this.stopId,
    this.lastKnownUpdateToken,
  });

  final String? companyId;
  final String routeId;
  final String stopId;
  final String? lastKnownUpdateToken;
}

class CommitDeleteDriverStopUseCase {
  const CommitDeleteDriverStopUseCase({
    required DeleteDriverStopUseCase deleteDriverStopUseCase,
  }) : _deleteDriverStopUseCase = deleteDriverStopUseCase;

  final DeleteDriverStopUseCase _deleteDriverStopUseCase;

  Future<void> execute(CommitDeleteDriverStopCommand command) {
    return _deleteDriverStopUseCase.execute(
      DriverStopDeleteCommand(
        companyId: command.companyId,
        routeId: command.routeId,
        stopId: command.stopId,
        lastKnownUpdateToken: command.lastKnownUpdateToken,
      ),
    );
  }
}
