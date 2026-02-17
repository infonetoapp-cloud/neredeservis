class TripSummary {
  const TripSummary({
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
