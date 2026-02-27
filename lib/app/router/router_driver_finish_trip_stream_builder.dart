import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

import '../../features/driver/application/observe_driver_finish_trip_streams_use_case.dart';
import '../../ui/screens/active_trip_screen.dart';
import 'router_driver_finish_trip_geometry_helpers.dart';
import 'router_driver_finish_trip_location_snapshot_helpers.dart';
import 'router_driver_finish_trip_passenger_helpers.dart';
import 'router_firebase_runtime_gateway.dart';

class RouterDriverFinishTripStreamSnapshot {
  const RouterDriverFinishTripStreamSnapshot({
    required this.locationSnapshot,
    required this.passengerEntries,
  });

  final RouterDriverFinishTripLocationSnapshot locationSnapshot;
  final List<ActiveTripPassengerEntry> passengerEntries;
}

class RouterDriverFinishTripStreamBuilder extends StatelessWidget {
  const RouterDriverFinishTripStreamBuilder({
    super.key,
    required this.routeId,
    required this.todayIstanbulDateKey,
    required this.observeStreamsUseCase,
    required this.batteryDegradeModeEnabled,
    required this.builder,
    this.firebaseRuntimeGateway = routerFirebaseRuntimeGateway,
  });

  final String routeId;
  final String todayIstanbulDateKey;
  final ObserveDriverFinishTripStreamsUseCase observeStreamsUseCase;
  final bool batteryDegradeModeEnabled;
  final Widget Function(RouterDriverFinishTripStreamSnapshot snapshot) builder;
  final RouterFirebaseRuntimeGateway firebaseRuntimeGateway;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: observeStreamsUseCase.watchRouteDocument(routeId),
      builder: (context, routeSnapshot) {
        final routeData = routeSnapshot.data?.data();
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: observeStreamsUseCase.watchRouteStops(routeId),
          builder: (context, stopsSnapshot) {
            final orderedStops = parseDriverFinishTripStops(stopsSnapshot.data);
            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: observeStreamsUseCase.watchRoutePassengers(routeId),
              builder: (context, passengersSnapshot) {
                return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: observeStreamsUseCase.watchRouteSkipRequestsByDate(
                    routeId: routeId,
                    dateKey: todayIstanbulDateKey,
                  ),
                  builder: (context, skipRequestsSnapshot) {
                    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      stream:
                          observeStreamsUseCase.watchActiveGuestSessionsByRoute(
                        routeId,
                      ),
                      builder: (context, guestSessionsSnapshot) {
                        final skipTodayPassengerIds =
                            resolveDriverFinishTripSkipTodayPassengerIds(
                          skipRequestsSnapshot.data,
                        );
                        final passengerEntries =
                            resolveDriverFinishTripPassengerEntries(
                          passengersSnapshot: passengersSnapshot.data,
                          skipTodayPassengerIds: skipTodayPassengerIds,
                          guestSessionsSnapshot: guestSessionsSnapshot.data,
                        );

                        return StreamBuilder<DatabaseEvent>(
                          stream:
                              firebaseRuntimeGateway.watchRouteLocationValue(
                            routeId,
                          ),
                          builder: (context, locationSnapshot) {
                            final locationUiSnapshot =
                                resolveDriverFinishTripLocationSnapshot(
                              rawLocationValue:
                                  locationSnapshot.data?.snapshot.value,
                              routeData: routeData,
                              orderedStops: orderedStops,
                              batteryDegradeModeEnabled:
                                  batteryDegradeModeEnabled,
                            );
                            return builder(
                              RouterDriverFinishTripStreamSnapshot(
                                locationSnapshot: locationUiSnapshot,
                                passengerEntries: passengerEntries,
                              ),
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }
}
