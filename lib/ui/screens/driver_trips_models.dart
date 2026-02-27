import 'package:flutter/foundation.dart';

enum DriverTripCardStatus {
  planned,
  live,
  completed,
  canceled,
}

@immutable
class DriverTripListItem {
  const DriverTripListItem({
    required this.routeId,
    required this.routeName,
    required this.startAddress,
    required this.endAddress,
    required this.status,
    required this.sortAtUtc,
    this.tripId,
    this.plannedAtLocal,
    this.scheduledTimeLabel,
    this.passengerCount,
    this.startPoint,
    this.endPoint,
    this.srvCode,
    this.routePolylineEncoded,
    this.isHistory = false,
  });

  final String routeId;
  final String routeName;
  final String startAddress;
  final String endAddress;
  final DriverTripCardStatus status;
  final DateTime sortAtUtc;
  final String? tripId;
  final DateTime? plannedAtLocal;
  final String? scheduledTimeLabel;
  final int? passengerCount;
  final DriverTripGeoPoint? startPoint;
  final DriverTripGeoPoint? endPoint;
  final String? srvCode;
  final String? routePolylineEncoded;
  final bool isHistory;
}

@immutable
class DriverTripGeoPoint {
  const DriverTripGeoPoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

@immutable
class DriverTripDetailStopItem {
  const DriverTripDetailStopItem({
    required this.stopId,
    required this.name,
    required this.order,
    required this.point,
  });

  final String stopId;
  final String name;
  final int order;
  final DriverTripGeoPoint point;
}

@immutable
class DriverTripDetailPassengerItem {
  const DriverTripDetailPassengerItem({
    required this.passengerId,
    required this.name,
    this.boardingArea,
  });

  final String passengerId;
  final String name;
  final String? boardingArea;
}

@immutable
class DriverTripDetailData {
  const DriverTripDetailData({
    required this.routeId,
    required this.routeName,
    required this.startAddress,
    required this.endAddress,
    required this.startPoint,
    required this.endPoint,
    required this.status,
    required this.stops,
    required this.passengers,
    this.tripId,
    this.srvCode,
    this.scheduledTimeLabel,
    this.routePolylineEncoded,
    this.tripStartedAtUtc,
    this.tripEndedAtUtc,
  });

  final String routeId;
  final String routeName;
  final String startAddress;
  final String endAddress;
  final DriverTripGeoPoint startPoint;
  final DriverTripGeoPoint endPoint;
  final DriverTripCardStatus status;
  final List<DriverTripDetailStopItem> stops;
  final List<DriverTripDetailPassengerItem> passengers;
  final String? tripId;
  final String? srvCode;
  final String? scheduledTimeLabel;
  final String? routePolylineEncoded;
  final DateTime? tripStartedAtUtc;
  final DateTime? tripEndedAtUtc;

  int get passengerCount => passengers.length;
}
