import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_elevations.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import '../../tokens/core_typography.dart';
import '../../tokens/icon_tokens.dart';

/// A compact guidance bar for the driver during an active trip.
///
/// Runbook 155 / 324C:
/// - Shows the next stop name and crow-fly distance in meters.
/// - When no stops remain, shows a "Sefer tamamlandi" message.
/// - Corner-radius and elevation match Core card standard.
/// - Content: icon + stop name left | distance badge right.
class CoreDriverGuidanceBar extends StatelessWidget {
  const CoreDriverGuidanceBar({
    super.key,
    this.nextStopName,
    this.crowFlyDistanceMeters,
    this.stopsRemaining,
    this.passengersAtNextStop,
  });

  /// Name of the next scheduled stop, e.g. `GOSB Giris`.
  /// When null, the bar displays a completion message.
  final String? nextStopName;

  /// Crow-fly (Haversine) distance to next stop in meters.
  final int? crowFlyDistanceMeters;

  /// Total remaining stops (used for secondary info).
  final int? stopsRemaining;

  /// Passengers waiting at the next stop.
  final int? passengersAtNextStop;

  /// Whether the trip is effectively at its final state.
  bool get _isComplete => nextStopName == null;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space16,
        vertical: CoreSpacing.space12,
      ),
      decoration: const BoxDecoration(
        color: CoreColors.surface0,
        borderRadius: CoreRadii.radius12,
        boxShadow: CoreElevations.shadowLevel1,
      ),
      child: _isComplete ? _buildCompletionRow() : _buildGuidanceRow(),
    );
  }

  Widget _buildGuidanceRow() {
    return Row(
      children: <Widget>[
        // Leading icon
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: CoreColors.amber100,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            CoreIconTokens.navigation,
            color: CoreColors.amber500,
            size: 20,
          ),
        ),
        const SizedBox(width: CoreSpacing.space12),
        // Stop info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              const Text(
                'Siradaki Durak',
                style: TextStyle(
                  fontFamily: CoreTypography.bodyFamily,
                  fontWeight: FontWeight.w400,
                  fontSize: 11,
                  color: CoreColors.ink700,
                  letterSpacing: 0.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                nextStopName!,
                style: const TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  color: CoreColors.ink900,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (passengersAtNextStop != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    '$passengersAtNextStop yolcu bekliyor',
                    style: const TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w500,
                      fontSize: 12,
                      color: CoreColors.ink700,
                    ),
                  ),
                ),
            ],
          ),
        ),
        // Distance badge
        if (crowFlyDistanceMeters != null) ...<Widget>[
          const SizedBox(width: CoreSpacing.space8),
          _DistanceBadge(distanceMeters: crowFlyDistanceMeters!),
        ],
      ],
    );
  }

  Widget _buildCompletionRow() {
    return Row(
      children: <Widget>[
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: const Color(0x1F3DA66A),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            CoreIconTokens.checkCircle,
            color: CoreColors.success,
            size: 20,
          ),
        ),
        const SizedBox(width: CoreSpacing.space12),
        const Expanded(
          child: Text(
            'Tum duraklar tamamlandi',
            style: TextStyle(
              fontFamily: CoreTypography.headingFamily,
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: CoreColors.success,
            ),
          ),
        ),
      ],
    );
  }
}

/// A compact badge displaying crow-fly distance in meters or kilometers.
class _DistanceBadge extends StatelessWidget {
  const _DistanceBadge({required this.distanceMeters});

  final int distanceMeters;

  String get _formattedDistance {
    if (distanceMeters >= 1000) {
      final km = distanceMeters / 1000;
      return '${km.toStringAsFixed(1)} km';
    }
    return '$distanceMeters m';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space8,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: CoreColors.amber100,
        borderRadius: CoreRadii.radius28,
        border: Border.all(color: CoreColors.amber400.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            CoreIconTokens.ruler,
            size: 14,
            color: CoreColors.amber500,
          ),
          const SizedBox(width: 4),
          Text(
            _formattedDistance,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: CoreColors.amber500,
            ),
          ),
        ],
      ),
    );
  }
}
