import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../../tokens/typography_tokens.dart';

/// A destructive-action guard that requires a horizontal slide gesture
/// to confirm the "Seferi Bitir" (Finish Trip) action.
///
/// Runbook contract:
/// - Slide-to-finish must travel ≥ 80 % of the track width to trigger.
/// - On threshold breach: heavy haptic + 200 ms scale bounce → callback fires.
/// - On incomplete slide: spring-back animation to origin.
/// - Visual: danger-red track with arrow chevrons + contrasting drag handle.
/// - A11y: semantics label "Seferi bitirmek icin kaydir" + double-tap fallback.
class AmberSlideToFinish extends StatefulWidget {
  const AmberSlideToFinish({
    super.key,
    required this.onConfirmed,
    this.label = 'Seferi bitirmek icin kaydir',
    this.isEnabled = true,
  });

  /// Called when the slide successfully completes (≥ 80 % threshold).
  final VoidCallback onConfirmed;

  /// Instructional label shown inside the track.
  final String label;

  /// When false, the slider is visually dimmed and drag is ignored.
  final bool isEnabled;

  @override
  State<AmberSlideToFinish> createState() => _AmberSlideToFinishState();
}

class _AmberSlideToFinishState extends State<AmberSlideToFinish>
    with SingleTickerProviderStateMixin {
  static const double _handleDiameter = 52;
  static const double _trackHeight = 58;
  static const double _triggerThreshold = 0.80;

  double _dragFraction = 0;
  bool _hasTriggered = false;

  late AnimationController _resetController;
  late Animation<double> _resetAnimation;

  @override
  void initState() {
    super.initState();
    _resetController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _resetAnimation = CurvedAnimation(
      parent: _resetController,
      curve: Curves.elasticOut,
    );
    _resetController.addListener(() {
      if (mounted) {
        setState(() {
          _dragFraction = _resetAnimation.value;
        });
      }
    });
  }

  @override
  void dispose() {
    _resetController.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails details, double maxTravel) {
    if (!widget.isEnabled || _hasTriggered) return;
    setState(() {
      _dragFraction =
          (_dragFraction + details.delta.dx / maxTravel).clamp(0.0, 1.0);
    });
  }

  void _onDragEnd(DragEndDetails details) {
    if (!widget.isEnabled) return;
    if (_dragFraction >= _triggerThreshold) {
      _trigger();
    } else {
      _springBack();
    }
  }

  void _trigger() {
    setState(() {
      _hasTriggered = true;
      _dragFraction = 1.0;
    });
    HapticFeedback.heavyImpact();
    Future<void>.delayed(const Duration(milliseconds: 200), () {
      if (mounted) {
        widget.onConfirmed();
      }
    });
  }

  void _springBack() {
    final from = _dragFraction;
    _resetAnimation = Tween<double>(begin: from, end: 0).animate(
      CurvedAnimation(parent: _resetController, curve: Curves.elasticOut),
    );
    _resetController
      ..reset()
      ..forward();
    HapticFeedback.selectionClick();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: widget.label,
      button: true,
      enabled: widget.isEnabled,
      onTap: widget.isEnabled ? _trigger : null,
      child: Opacity(
        opacity: widget.isEnabled ? 1.0 : 0.4,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final trackWidth = constraints.maxWidth;
            final maxTravel = trackWidth - _handleDiameter;
            final handleOffset = _dragFraction * maxTravel;

            return Container(
              height: _trackHeight,
              decoration: BoxDecoration(
                color: _hasTriggered
                    ? AmberColorTokens.danger
                    : AmberColorTokens.danger.withAlpha(30),
                borderRadius: AmberRadiusTokens.radius28,
                border: Border.all(
                  color: AmberColorTokens.danger.withAlpha(100),
                ),
              ),
              child: Stack(
                alignment: Alignment.centerLeft,
                children: <Widget>[
                  // Instruction label
                  if (!_hasTriggered)
                    Center(
                      child: _AnimatedChevronLabel(
                        label: widget.label,
                        progress: _dragFraction,
                      ),
                    ),

                  // Completed label
                  if (_hasTriggered)
                    const Center(
                      child: Text(
                        'Sefer sonlandiriliyor...',
                        style: TextStyle(
                          fontFamily: AmberTypographyTokens.bodyFamily,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: AmberColorTokens.surface0,
                        ),
                      ),
                    ),

                  // Drag handle
                  if (!_hasTriggered)
                    Positioned(
                      left: handleOffset + 3,
                      child: GestureDetector(
                        onHorizontalDragUpdate: (d) =>
                            _onDragUpdate(d, maxTravel),
                        onHorizontalDragEnd: _onDragEnd,
                        child: Container(
                          width: _handleDiameter,
                          height: _handleDiameter,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AmberColorTokens.danger,
                            boxShadow: <BoxShadow>[
                              BoxShadow(
                                color: AmberColorTokens.danger.withAlpha(90),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.chevron_right_rounded,
                            color: AmberColorTokens.surface0,
                            size: 28,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

/// Animated instructional label with fading chevrons that hint drag direction.
class _AnimatedChevronLabel extends StatelessWidget {
  const _AnimatedChevronLabel({required this.label, required this.progress});

  final String label;
  final double progress;

  @override
  Widget build(BuildContext context) {
    // Fade out label as user drags
    final labelOpacity = (1.0 - progress * 2.5).clamp(0.0, 1.0);

    return Opacity(
      opacity: labelOpacity,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const SizedBox(width: AmberSpacingTokens.space32),
          Text(
            label,
            style: const TextStyle(
              fontFamily: AmberTypographyTokens.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: AmberColorTokens.danger,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(width: AmberSpacingTokens.space8),
          Icon(
            Icons.double_arrow_rounded,
            size: 18,
            color: AmberColorTokens.danger.withAlpha(140),
          ),
        ],
      ),
    );
  }
}
