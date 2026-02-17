import '../../models/trip_summary.dart';

class TripSummaryDto {
  const TripSummaryDto({
    required this.tripId,
    required this.routeId,
    required this.status,
    required this.passengerCount,
    required this.lastLocationEpochMs,
  });

  final String tripId;
  final String routeId;
  final String status;
  final int passengerCount;
  final int lastLocationEpochMs;
}

extension TripSummaryMapper on TripSummaryDto {
  TripSummary toModel() {
    return TripSummary(
      tripId: tripId,
      routeId: routeId,
      status: status,
      passengerCount: passengerCount,
      lastLocationEpochMs: lastLocationEpochMs,
    );
  }
}

TripSummaryDto tripSummaryDtoFromModel(TripSummary model) {
  return TripSummaryDto(
    tripId: model.tripId,
    routeId: model.routeId,
    status: model.status,
    passengerCount: model.passengerCount,
    lastLocationEpochMs: model.lastLocationEpochMs,
  );
}
