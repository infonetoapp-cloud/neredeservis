import '../domain/driver_stop_mutation_repository.dart';
import 'delete_driver_stop_use_case.dart';

class CommitDeleteDriverStopCommand {
  const CommitDeleteDriverStopCommand({
    required this.routeId,
    required this.stopId,
  });

  final String routeId;
  final String stopId;
}

class CommitDeleteDriverStopUseCase {
  const CommitDeleteDriverStopUseCase({
    required DeleteDriverStopUseCase deleteDriverStopUseCase,
  }) : _deleteDriverStopUseCase = deleteDriverStopUseCase;

  final DeleteDriverStopUseCase _deleteDriverStopUseCase;

  Future<void> execute(CommitDeleteDriverStopCommand command) {
    return _deleteDriverStopUseCase.execute(
      DriverStopDeleteCommand(
        routeId: command.routeId,
        stopId: command.stopId,
      ),
    );
  }
}
