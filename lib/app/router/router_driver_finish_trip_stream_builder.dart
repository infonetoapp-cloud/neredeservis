import 'package:flutter/material.dart';

import '../../features/driver/application/observe_driver_finish_trip_streams_use_case.dart';
import '../../features/driver/domain/driver_finish_trip_stream_repository.dart';
import '../../ui/screens/active_trip_screen.dart';
import 'router_driver_finish_trip_geometry_helpers.dart';
import 'router_driver_finish_trip_location_snapshot_helpers.dart';
import 'router_driver_finish_trip_passenger_helpers.dart';

class RouterDriverFinishTripStreamSnapshot {
  const RouterDriverFinishTripStreamSnapshot({
    required this.locationSnapshot,
    required this.passengerEntries,
  });

  final RouterDriverFinishTripLocationSnapshot locationSnapshot;
  final List<ActiveTripPassengerEntry> passengerEntries;
}

class RouterDriverFinishTripStreamBuilder extends StatefulWidget {
  const RouterDriverFinishTripStreamBuilder({
    super.key,
    required this.routeId,
    required this.tripId,
    required this.todayIstanbulDateKey,
    required this.observeStreamsUseCase,
    required this.batteryDegradeModeEnabled,
    required this.builder,
  });

  final String routeId;
  final String? tripId;
  final String todayIstanbulDateKey;
  final ObserveDriverFinishTripStreamsUseCase observeStreamsUseCase;
  final bool batteryDegradeModeEnabled;
  final Widget Function(RouterDriverFinishTripStreamSnapshot snapshot) builder;

  @override
  State<RouterDriverFinishTripStreamBuilder> createState() =>
      _RouterDriverFinishTripStreamBuilderState();
}

class _RouterDriverFinishTripStreamBuilderState
    extends State<RouterDriverFinishTripStreamBuilder> {
  late Stream<DriverFinishTripSnapshotData?> _snapshotStream;

  @override
  void initState() {
    super.initState();
    _snapshotStream = _buildStream();
  }

  @override
  void didUpdateWidget(
      covariant RouterDriverFinishTripStreamBuilder oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.routeId != oldWidget.routeId ||
        widget.tripId != oldWidget.tripId ||
        widget.todayIstanbulDateKey != oldWidget.todayIstanbulDateKey ||
        widget.observeStreamsUseCase != oldWidget.observeStreamsUseCase) {
      _snapshotStream = _buildStream();
    }
  }

  Stream<DriverFinishTripSnapshotData?> _buildStream() {
    return widget.observeStreamsUseCase.watchSnapshot(
      routeId: widget.routeId,
      tripId: widget.tripId,
      dateKey: widget.todayIstanbulDateKey,
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DriverFinishTripSnapshotData?>(
      stream: _snapshotStream,
      builder: (context, snapshot) {
        final finishTripSnapshot = snapshot.data;
        final orderedStops = parseDriverFinishTripStops(
            finishTripSnapshot?.stopRows ?? const []);
        final skipTodayPassengerIds =
            resolveDriverFinishTripSkipTodayPassengerIds(
          finishTripSnapshot?.skipTodayPassengerIds ?? const <String>[],
        );
        final passengerEntries = resolveDriverFinishTripPassengerEntries(
          passengerRows: finishTripSnapshot?.passengerRows ?? const [],
          skipTodayPassengerIds: skipTodayPassengerIds,
          guestSessions: finishTripSnapshot?.guestSessions ?? const [],
        );
        final locationUiSnapshot = resolveDriverFinishTripLocationSnapshot(
          rawLocationValue: finishTripSnapshot?.liveLocation,
          routeData: finishTripSnapshot?.routeData,
          orderedStops: orderedStops,
          batteryDegradeModeEnabled: widget.batteryDegradeModeEnabled,
        );

        return widget.builder(
          RouterDriverFinishTripStreamSnapshot(
            locationSnapshot: locationUiSnapshot,
            passengerEntries: passengerEntries,
          ),
        );
      },
    );
  }
}
