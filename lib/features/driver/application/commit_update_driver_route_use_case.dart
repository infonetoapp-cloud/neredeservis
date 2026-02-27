import '../domain/driver_route_update_repository.dart';
import 'update_driver_route_use_case.dart';

class CommitUpdateDriverRoutePoint {
  const CommitUpdateDriverRoutePoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class CommitUpdateDriverRouteInlineStopUpsert {
  const CommitUpdateDriverRouteInlineStopUpsert({
    required this.stopId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
  });

  final String stopId;
  final String name;
  final double lat;
  final double lng;
  final int order;
}

class CommitUpdateDriverRouteCommand {
  const CommitUpdateDriverRouteCommand({
    required this.routeId,
    this.name,
    this.startPoint,
    this.startAddress,
    this.endPoint,
    this.endAddress,
    this.scheduledTime,
    this.timeSlot,
    this.allowGuestTracking,
    this.authorizedDriverIds,
    this.isArchived,
    this.vacationUntil,
    this.clearVacationUntil = false,
    this.inlineStopUpserts = const <CommitUpdateDriverRouteInlineStopUpsert>[],
  });

  final String routeId;
  final String? name;
  final CommitUpdateDriverRoutePoint? startPoint;
  final String? startAddress;
  final CommitUpdateDriverRoutePoint? endPoint;
  final String? endAddress;
  final String? scheduledTime;
  final String? timeSlot;
  final bool? allowGuestTracking;
  final List<String>? authorizedDriverIds;
  final bool? isArchived;
  final String? vacationUntil;
  final bool clearVacationUntil;
  final List<CommitUpdateDriverRouteInlineStopUpsert> inlineStopUpserts;
}

class CommitUpdateDriverRouteUseCase {
  const CommitUpdateDriverRouteUseCase({
    required UpdateDriverRouteUseCase updateDriverRouteUseCase,
  }) : _updateDriverRouteUseCase = updateDriverRouteUseCase;

  final UpdateDriverRouteUseCase _updateDriverRouteUseCase;

  Future<void> execute(CommitUpdateDriverRouteCommand command) {
    return _updateDriverRouteUseCase.execute(
      DriverRouteUpdateCommand(
        routeId: command.routeId,
        name: command.name,
        startAddress: command.startAddress,
        startPoint: command.startPoint == null
            ? null
            : DriverRouteUpdatePoint(
                lat: command.startPoint!.lat,
                lng: command.startPoint!.lng,
              ),
        endAddress: command.endAddress,
        endPoint: command.endPoint == null
            ? null
            : DriverRouteUpdatePoint(
                lat: command.endPoint!.lat,
                lng: command.endPoint!.lng,
              ),
        scheduledTime: command.scheduledTime,
        timeSlot: command.timeSlot,
        allowGuestTracking: command.allowGuestTracking,
        authorizedDriverIds: command.authorizedDriverIds,
        isArchived: command.isArchived,
        clearVacationUntil: command.clearVacationUntil,
        vacationUntil: command.vacationUntil,
        inlineStopUpserts: command.inlineStopUpserts
            .map(
              (stop) => DriverRouteInlineStopUpsertCommand(
                stopId: stop.stopId,
                name: stop.name,
                lat: stop.lat,
                lng: stop.lng,
                order: stop.order,
              ),
            )
            .toList(growable: false),
      ),
    );
  }
}
