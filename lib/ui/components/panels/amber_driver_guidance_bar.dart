import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/elevation_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../../tokens/typography_tokens.dart';

/// A compact guidance bar for the driver during an active trip.
///
/// Runbook 155 / 324C:
/// - Shows the next stop name and crow-fly distance in meters.
/// - When no stops remain, shows a "Sefer tamamlandi" message.
/// - Corner-radius and elevation match Amber card standard.
/// - Content: icon + stop name left | distance badge right.
class AmberDriverGuidanceBar extends StatelessWidget {
  const AmberDriverGuidanceBar({
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
        horizontal: AmberSpacingTokens.space16,
        vertical: AmberSpacingTokens.space12,
      ),
      decoration: const BoxDecoration(
        color: AmberColorTokens.surface0,
        borderRadius: AmberRadiusTokens.radius14,
        boxShadow: AmberElevationTokens.shadowLevel1,
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
            color: AmberColorTokens.amber100,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.near_me_rounded,
            color: AmberColorTokens.amber500,
            size: 20,
          ),
        ),
        const SizedBox(width: AmberSpacingTokens.space12),
        // Stop info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              const Text(
                'Siradaki Durak',
                style: TextStyle(
                  fontFamily: AmberTypographyTokens.bodyFamily,
                  fontWeight: FontWeight.w400,
                  fontSize: 11,
                  color: AmberColorTokens.ink700,
                  letterSpacing: 0.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                nextStopName!,
                style: const TextStyle(
                  fontFamily: AmberTypographyTokens.headingFamily,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  color: AmberColorTokens.ink900,
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
                      fontFamily: AmberTypographyTokens.bodyFamily,
                      fontWeight: FontWeight.w500,
                      fontSize: 12,
                      color: AmberColorTokens.ink700,
                    ),
                  ),
                ),
            ],
          ),
        ),
        // Distance badge
        if (crowFlyDistanceMeters != null) ...<Widget>[
          const SizedBox(width: AmberSpacingTokens.space8),
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
            Icons.check_circle_outline_rounded,
            color: AmberColorTokens.success,
            size: 20,
          ),
        ),
        const SizedBox(width: AmberSpacingTokens.space12),
        const Expanded(
          child: Text(
            'Tum duraklar tamamlandi',
            style: TextStyle(
              fontFamily: AmberTypographyTokens.headingFamily,
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: AmberColorTokens.success,
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
        horizontal: AmberSpacingTokens.space8,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: AmberColorTokens.amber100,
        borderRadius: AmberRadiusTokens.radius28,
        border: Border.all(color: AmberColorTokens.amber400.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            Icons.straighten_rounded,
            size: 14,
            color: AmberColorTokens.amber500,
          ),
          const SizedBox(width: 4),
          Text(
            _formattedDistance,
            style: const TextStyle(
              fontFamily: AmberTypographyTokens.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: AmberColorTokens.amber500,
            ),
          ),
        ],
      ),
    );
  }
}
