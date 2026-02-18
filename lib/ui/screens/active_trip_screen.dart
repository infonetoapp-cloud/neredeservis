import 'package:flutter/material.dart';

import '../components/buttons/amber_slide_to_finish.dart';
import '../components/indicators/amber_heartbeat_indicator.dart';
import '../components/indicators/amber_status_chip.dart';
import '../components/panels/amber_driver_guidance_bar.dart';
import '../tokens/color_tokens.dart';
import '../tokens/elevation_tokens.dart';
import '../tokens/icon_tokens.dart';
import '../tokens/spacing_tokens.dart';
import '../tokens/typography_tokens.dart';

/// Active trip screen for the driver during a live broadcast.
///
/// Runbook 155 / UI contract:
/// - Map shell (top region) with vehicle + next-stop markers
/// - Connection heartbeat widget (YAYINDASIN + pulse ring)
/// - Driver Guidance Lite: next stop name + crow-fly distance
/// - Slide-to-finish guard for the "Seferi Bitir" destructive action
/// - Heartbeat red → peripheral alarm (red border flash + haptic)
/// - No distracting UI elements. Single decision per screen.
class ActiveTripScreen extends StatefulWidget {
  const ActiveTripScreen({
    super.key,
    this.routeName = 'Darica -> GOSB',
    this.nextStopName = 'GOSB Giris',
    this.crowFlyDistanceMeters = 840,
    this.stopsRemaining = 4,
    this.passengersAtNextStop = 3,
    this.heartbeatState = HeartbeatState.green,
    this.lastHeartbeatAgo = '2 sn',
    this.onTripFinished,
    this.onEmergencyTap,
  });

  /// Active route display name.
  final String routeName;

  /// Name of the next scheduled stop. Null = all stops done.
  final String? nextStopName;

  /// Crow-fly distance to next stop in meters.
  final int? crowFlyDistanceMeters;

  /// Total remaining stops.
  final int? stopsRemaining;

  /// Passengers waiting at the next stop.
  final int? passengersAtNextStop;

  /// Current connection heartbeat state.
  final HeartbeatState heartbeatState;

  /// Human-readable time since last heartbeat, e.g. `5 sn`.
  final String? lastHeartbeatAgo;

  /// Fires when slide-to-finish confirms trip termination.
  final VoidCallback? onTripFinished;

  /// Fires when the emergency / SOS button is tapped.
  final VoidCallback? onEmergencyTap;

  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _alarmController;
  late Animation<double> _alarmOpacity;

  @override
  void initState() {
    super.initState();
    _alarmController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _alarmOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _alarmController, curve: Curves.easeInOut),
    );

    if (widget.heartbeatState == HeartbeatState.red) {
      _alarmController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant ActiveTripScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.heartbeatState == HeartbeatState.red &&
        oldWidget.heartbeatState != HeartbeatState.red) {
      _alarmController.repeat(reverse: true);
    } else if (widget.heartbeatState != HeartbeatState.red &&
        oldWidget.heartbeatState == HeartbeatState.red) {
      _alarmController
        ..stop()
        ..reset();
    }
  }

  @override
  void dispose() {
    _alarmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final isCompactDevice = mediaQuery.size.height < 700;

    return Scaffold(
      body: Stack(
        children: <Widget>[
          // Layer 0: Map shell (full screen background)
          Positioned.fill(
            child: _MapShell(
              routeName: widget.routeName,
              nextStopName: widget.nextStopName,
            ),
          ),

          // Layer 1: Top safe-area status overlay
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _TopStatusOverlay(
              routeName: widget.routeName,
              stopsRemaining: widget.stopsRemaining,
              heartbeatState: widget.heartbeatState,
              onEmergencyTap: widget.onEmergencyTap,
            ),
          ),

          // Layer 2: Bottom panel (guidance + heartbeat + slide-to-finish)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _BottomControlPanel(
              heartbeatState: widget.heartbeatState,
              lastHeartbeatAgo: widget.lastHeartbeatAgo,
              nextStopName: widget.nextStopName,
              crowFlyDistanceMeters: widget.crowFlyDistanceMeters,
              passengersAtNextStop: widget.passengersAtNextStop,
              onTripFinished: widget.onTripFinished,
              isCompactDevice: isCompactDevice,
            ),
          ),

          // Layer 3: Red alarm border (connection lost)
          if (widget.heartbeatState == HeartbeatState.red)
            Positioned.fill(
              child: IgnorePointer(
                child: AnimatedBuilder(
                  animation: _alarmOpacity,
                  builder: (context, _) {
                    return Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AmberColorTokens.danger
                              .withAlpha((_alarmOpacity.value * 120).round()),
                          width: 4,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// --- Internal Widgets ---

/// The map background shell. In V1.0 this renders a styled placeholder;
/// the actual Mapbox integration plugs in during FAZ G (step 320+).
class _MapShell extends StatelessWidget {
  const _MapShell({this.routeName, this.nextStopName});

  final String? routeName;
  final String? nextStopName;

  @override
  Widget build(BuildContext context) {
    // Placeholder until Mapbox widget lands in FAZ G.
    // Using a subtle gradient to represent map area without blank screen.
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[
            Color(0xFFE8EDE4), // Muted sage (map-like)
            Color(0xFFF2F4EF), // Light terrain
            Color(0xFFE0E5DA), // Slightly darker base
          ],
        ),
      ),
      child: Stack(
        children: <Widget>[
          // Simulated road grid lines
          ..._buildGridLines(),
          // Center marker: vehicle position
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AmberColorTokens.amber500,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AmberColorTokens.surface0,
                      width: 3,
                    ),
                    boxShadow: const <BoxShadow>[
                      BoxShadow(
                        color: Color(0x40000000),
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    AmberIconTokens.bus,
                    color: AmberColorTokens.surface0,
                    size: 24,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AmberColorTokens.ink900.withAlpha(200),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'Arac konumu',
                    style: TextStyle(
                      fontFamily: AmberTypographyTokens.bodyFamily,
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                      color: AmberColorTokens.surface0,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Next stop marker (offset to top-right as visual cue)
          if (nextStopName != null)
            Positioned(
              top: MediaQuery.of(context).size.height * 0.25,
              right: MediaQuery.of(context).size.width * 0.18,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AmberColorTokens.success,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AmberColorTokens.surface0,
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      AmberIconTokens.flag,
                      color: AmberColorTokens.surface0,
                      size: 16,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AmberColorTokens.ink900.withAlpha(180),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      nextStopName!,
                      style: const TextStyle(
                        fontFamily: AmberTypographyTokens.bodyFamily,
                        fontWeight: FontWeight.w600,
                        fontSize: 9,
                        color: AmberColorTokens.surface0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  /// Subtle horizontal/vertical grid lines simulating a map grid.
  List<Widget> _buildGridLines() {
    return <Widget>[
      for (int i = 1; i <= 6; i++)
        Positioned(
          top: 0,
          bottom: 0,
          left: i * 60.0,
          child: Container(
            width: 0.5,
            color: const Color(0x18000000),
          ),
        ),
      for (int i = 1; i <= 12; i++)
        Positioned(
          left: 0,
          right: 0,
          top: i * 70.0,
          child: Container(
            height: 0.5,
            color: const Color(0x18000000),
          ),
        ),
    ];
  }
}

/// Transparent overlay at top of screen with route info + emergency button.
class _TopStatusOverlay extends StatelessWidget {
  const _TopStatusOverlay({
    required this.routeName,
    this.stopsRemaining,
    required this.heartbeatState,
    this.onEmergencyTap,
  });

  final String routeName;
  final int? stopsRemaining;
  final HeartbeatState heartbeatState;
  final VoidCallback? onEmergencyTap;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Container(
      padding: EdgeInsets.only(
        top: topPadding + AmberSpacingTokens.space8,
        left: AmberSpacingTokens.space16,
        right: AmberSpacingTokens.space16,
        bottom: AmberSpacingTokens.space12,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[
            AmberColorTokens.surface0.withAlpha(230),
            AmberColorTokens.surface0.withAlpha(0),
          ],
        ),
      ),
      child: Row(
        children: <Widget>[
          // Route context
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  routeName,
                  style: const TextStyle(
                    fontFamily: AmberTypographyTokens.headingFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: AmberColorTokens.ink900,
                  ),
                ),
                if (stopsRemaining != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      '$stopsRemaining durak kaldi',
                      style: const TextStyle(
                        fontFamily: AmberTypographyTokens.bodyFamily,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                        color: AmberColorTokens.ink700,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Compact heartbeat status chip
          AmberStatusChip(
            label: _chipLabel(heartbeatState),
            tone: _chipTone(heartbeatState),
            compact: true,
          ),
        ],
      ),
    );
  }

  String _chipLabel(HeartbeatState state) {
    switch (state) {
      case HeartbeatState.green:
        return 'Canli';
      case HeartbeatState.yellow:
        return 'Dalgali';
      case HeartbeatState.red:
        return 'Baglanti yok';
    }
  }

  AmberStatusChipTone _chipTone(HeartbeatState state) {
    switch (state) {
      case HeartbeatState.green:
        return AmberStatusChipTone.green;
      case HeartbeatState.yellow:
        return AmberStatusChipTone.yellow;
      case HeartbeatState.red:
        return AmberStatusChipTone.red;
    }
  }
}

/// Bottom panel containing heartbeat, guidance, and slide-to-finish.
class _BottomControlPanel extends StatelessWidget {
  const _BottomControlPanel({
    required this.heartbeatState,
    this.lastHeartbeatAgo,
    this.nextStopName,
    this.crowFlyDistanceMeters,
    this.passengersAtNextStop,
    this.onTripFinished,
    required this.isCompactDevice,
  });

  final HeartbeatState heartbeatState;
  final String? lastHeartbeatAgo;
  final String? nextStopName;
  final int? crowFlyDistanceMeters;
  final int? passengersAtNextStop;
  final VoidCallback? onTripFinished;
  final bool isCompactDevice;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      padding: EdgeInsets.only(
        left: AmberSpacingTokens.space16,
        right: AmberSpacingTokens.space16,
        top: AmberSpacingTokens.space16,
        bottom: bottomPadding + AmberSpacingTokens.space16,
      ),
      decoration: const BoxDecoration(
        color: AmberColorTokens.surface0,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
        boxShadow: AmberElevationTokens.shadowLevel2,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // Drag handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AmberColorTokens.line200,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          SizedBox(height: isCompactDevice ? 12.0 : 16.0),

          // Heartbeat indicator (centered, prominent)
          AmberHeartbeatIndicator(
            state: heartbeatState,
            lastHeartbeatAgo: lastHeartbeatAgo,
          ),
          SizedBox(height: isCompactDevice ? 12.0 : 20.0),

          // Driver guidance bar
          AmberDriverGuidanceBar(
            nextStopName: nextStopName,
            crowFlyDistanceMeters: crowFlyDistanceMeters,
            passengersAtNextStop: passengersAtNextStop,
          ),
          SizedBox(height: isCompactDevice ? 12.0 : 16.0),

          // Slide-to-finish (destructive action guard)
          AmberSlideToFinish(
            onConfirmed: onTripFinished ?? () {},
            isEnabled: onTripFinished != null,
          ),
        ],
      ),
    );
  }
}
