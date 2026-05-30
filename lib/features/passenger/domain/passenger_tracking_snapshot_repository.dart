import 'dart:convert';

class PassengerTrackingSnapshotData {
  const PassengerTrackingSnapshotData({
    required this.routeId,
    required this.routeName,
    required this.routeData,
    required this.activeTripData,
    required this.driverData,
    required this.passengerData,
    required this.latestAnnouncement,
    required this.stops,
    required this.liveLocation,
    required this.guestSession,
    required this.generatedAt,
  });

  final String? routeId;
  final String? routeName;
  final Map<String, dynamic>? routeData;
  final Map<String, dynamic>? activeTripData;
  final Map<String, dynamic>? driverData;
  final Map<String, dynamic>? passengerData;
  final Map<String, dynamic>? latestAnnouncement;
  final List<Map<String, dynamic>> stops;
  final Map<String, dynamic>? liveLocation;
  final Map<String, dynamic>? guestSession;
  final String? generatedAt;

  bool get isGuestSessionExpired {
    final guestSessionData = guestSession;
    if (guestSessionData == null) {
      return false;
    }

    final status =
        (guestSessionData['status'] as String?)?.trim().toLowerCase();
    final expiresAtRaw = (guestSessionData['expiresAt'] as String?)?.trim();
    final expiresAtUtc =
        expiresAtRaw == null ? null : DateTime.tryParse(expiresAtRaw)?.toUtc();
    if (status != null && status != 'active') {
      return true;
    }
    return expiresAtUtc == null ||
        !expiresAtUtc.isAfter(DateTime.now().toUtc());
  }

  factory PassengerTrackingSnapshotData.fromJson(Map<String, dynamic> json) {
    return PassengerTrackingSnapshotData(
      routeId: _normalizedString(json['routeId']),
      routeName: _normalizedString(json['routeName']),
      routeData: _normalizedMap(json['routeData']),
      activeTripData: _normalizedMap(json['activeTripData']),
      driverData: _normalizedMap(json['driverData']),
      passengerData: _normalizedMap(json['passengerData']),
      latestAnnouncement: _normalizedMap(json['latestAnnouncement']),
      stops: _normalizedMapList(json['stops']),
      liveLocation: _normalizedMap(json['liveLocation']),
      guestSession: _normalizedMap(json['guestSession']),
      generatedAt: _normalizedString(json['generatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'routeId': routeId,
      'routeName': routeName,
      'routeData': routeData,
      'activeTripData': activeTripData,
      'driverData': driverData,
      'passengerData': passengerData,
      'latestAnnouncement': latestAnnouncement,
      'stops': stops,
      'liveLocation': liveLocation,
      'guestSession': guestSession,
      'generatedAt': generatedAt,
    };
  }

  String signature() => jsonEncode(toJson());
}

abstract class PassengerTrackingSnapshotRepository {
  Future<PassengerTrackingSnapshotData?> readPassengerRouteTracking(
    String routeId,
  );

  Future<PassengerTrackingSnapshotData?> readGuestSessionTracking(
    String sessionId,
  );

  Stream<PassengerTrackingSnapshotData?> watchPassengerRouteTracking(
    String routeId,
  );

  Stream<PassengerTrackingSnapshotData?> watchGuestSessionTracking(
    String sessionId,
  );
}

String? _normalizedString(Object? value) {
  final normalized = (value as String?)?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}

Map<String, dynamic>? _normalizedMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map<Object?, Object?>) {
    return Map<String, dynamic>.from(value);
  }
  return null;
}

List<Map<String, dynamic>> _normalizedMapList(Object? value) {
  if (value is! List) {
    return const <Map<String, dynamic>>[];
  }

  return value
      .whereType<Map<dynamic, dynamic>>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList(growable: false);
}
