import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/icon_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../../tokens/typography_tokens.dart';

/// Heartbeat connection states for driver active trip.
///
/// - [green]: Live broadcasting, connection healthy.
/// - [yellow]: Intermittent connection, signal fluctuating.
/// - [red]: Broadcast stopped, connection lost.
enum HeartbeatState {
  green,
  yellow,
  red,
}

/// A pulsing connection indicator for the driver's active trip screen.
///
/// Displays a colored ring with pulse animation and a status label.
/// Triggers distinct haptic patterns on state transitions.
///
/// UI contract (Runbook 3.4 / 324A-324BE):
/// - green = `YAYINDASIN` + pulse ring
/// - yellow = `Baglanti dalgali` + amber ring
/// - red = `Yayin durdu` + danger flash ring + repeating haptic
///
/// OLED burn-in mitigation: the indicator micro-shifts 2-3 px every 60 s
/// (Runbook 324BD).
class AmberHeartbeatIndicator extends StatefulWidget {
  const AmberHeartbeatIndicator({
    super.key,
    required this.state,
    this.lastHeartbeatAgo,
  });

  static const Duration burnInShiftDuration = Duration(seconds: 60);
  static const Offset burnInShiftOffset = Offset(2.5, 1.5);

  /// Current heartbeat / connection state.
  final HeartbeatState state;

  /// Human-readable time since last successful heartbeat, e.g. `5 sn`.
  /// Shown as secondary info below the status label.
  final String? lastHeartbeatAgo;

  @override
  State<AmberHeartbeatIndicator> createState() =>
      _AmberHeartbeatIndicatorState();
}

class _AmberHeartbeatIndicatorState extends State<AmberHeartbeatIndicator>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _burnInController;
  late Animation<double> _pulseAnimation;
  late Animation<Offset> _microShift;

  HeartbeatState? _previousState;

  @override
  void initState() {
    super.initState();

    // Pulse ring animation: scale 1.0 → 1.35 → 1.0
    _pulseController = AnimationController(
      vsync: this,
      duration: _pulseDurationFor(widget.state),
    )..repeat();
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.35).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // OLED burn-in micro-shift: 2-3 px movement every 60 s
    _burnInController = AnimationController(
      vsync: this,
      duration: AmberHeartbeatIndicator.burnInShiftDuration,
    )..repeat(reverse: true);
    _microShift = Tween<Offset>(
      begin: Offset.zero,
      end: AmberHeartbeatIndicator.burnInShiftOffset,
    ).animate(
      CurvedAnimation(parent: _burnInController, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(covariant AmberHeartbeatIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state) {
      _previousState = oldWidget.state;
      _pulseController.duration = _pulseDurationFor(widget.state);
      _pulseController
        ..stop()
        ..repeat();
      _triggerStateTransitionFeedback(widget.state);
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _burnInController.dispose();
    super.dispose();
  }

  Duration _pulseDurationFor(HeartbeatState state) {
    switch (state) {
      case HeartbeatState.green:
        return const Duration(milliseconds: 1600);
      case HeartbeatState.yellow:
        return const Duration(milliseconds: 1000);
      case HeartbeatState.red:
        return const Duration(milliseconds: 600);
    }
  }

  void _triggerStateTransitionFeedback(HeartbeatState newState) {
    switch (newState) {
      case HeartbeatState.red:
        // Red-state repeating alarm haptic is driven by ActiveTripScreen (324BA).
        return;
      case HeartbeatState.green:
        if (_previousState == HeartbeatState.red ||
            _previousState == HeartbeatState.yellow) {
          _fireAndForgetHaptic(HapticFeedback.mediumImpact);
        }
        return;
      case HeartbeatState.yellow:
        _fireAndForgetHaptic(HapticFeedback.lightImpact);
        return;
    }
  }

  void _fireAndForgetHaptic(Future<void> Function() hapticCall) {
    unawaited(_invokeHaptic(hapticCall));
  }

  Future<void> _invokeHaptic(Future<void> Function() hapticCall) async {
    try {
      await hapticCall();
    } on MissingPluginException {
      // Platform channel may be unavailable in tests.
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = _paletteFor(widget.state);
    final label = _labelFor(widget.state);

    return AnimatedBuilder(
      animation: _microShift,
      builder: (context, child) {
        return Transform.translate(
          key: const Key('heartbeat_micro_shift_transform'),
          offset: _microShift.value,
          child: child,
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          SizedBox(
            width: 72,
            height: 72,
            child: Stack(
              alignment: Alignment.center,
              children: <Widget>[
                // Outer pulse ring
                AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, _) {
                    return Transform.scale(
                      scale: _pulseAnimation.value,
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: palette.ring.withAlpha(
                              (100 * (1 - (_pulseAnimation.value - 1) / 0.35))
                                  .round(),
                            ),
                            width: 2.5,
                          ),
                        ),
                      ),
                    );
                  },
                ),
                // Inner solid circle
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: palette.core,
                    boxShadow: <BoxShadow>[
                      BoxShadow(
                        color: palette.core.withAlpha(80),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Icon(
                    AmberIconTokens.heartbeat,
                    size: 22,
                    color: AmberColorTokens.surface0,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          Text(
            label,
            style: TextStyle(
              fontFamily: AmberTypographyTokens.headingFamily,
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: palette.core,
              letterSpacing: 1.2,
            ),
          ),
          if (widget.lastHeartbeatAgo != null) ...<Widget>[
            const SizedBox(height: 2),
            Text(
              widget.lastHeartbeatAgo!,
              style: TextStyle(
                fontFamily: AmberTypographyTokens.bodyFamily,
                fontWeight: FontWeight.w500,
                fontSize: 12,
                color: palette.core.withAlpha(180),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _labelFor(HeartbeatState state) {
    switch (state) {
      case HeartbeatState.green:
        return 'YAYINDASIN';
      case HeartbeatState.yellow:
        return 'DALGALI';
      case HeartbeatState.red:
        return 'YAYIN DURDU';
    }
  }

  _HeartbeatPalette _paletteFor(HeartbeatState state) {
    switch (state) {
      case HeartbeatState.green:
        return const _HeartbeatPalette(
          core: AmberColorTokens.success,
          ring: AmberColorTokens.success,
        );
      case HeartbeatState.yellow:
        return const _HeartbeatPalette(
          core: AmberColorTokens.amber500,
          ring: AmberColorTokens.amber400,
        );
      case HeartbeatState.red:
        return const _HeartbeatPalette(
          core: AmberColorTokens.danger,
          ring: AmberColorTokens.danger,
        );
    }
  }
}

class _HeartbeatPalette {
  const _HeartbeatPalette({required this.core, required this.ring});
  final Color core;
  final Color ring;
}
