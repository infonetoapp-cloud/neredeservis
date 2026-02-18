import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/elevation_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../../tokens/typography_tokens.dart';
import '../banners/amber_stale_status_banner.dart';

/// Data class representing a single stop in the route.
class PassengerStopInfo {
  const PassengerStopInfo({
    required this.name,
    required this.isPassed,
    this.isNext = false,
    this.passengersWaiting,
  });

  /// Display name, e.g. `GOSB Giris`.
  final String name;

  /// Whether the driver has already passed this stop.
  final bool isPassed;

  /// Whether this is the next scheduled stop.
  final bool isNext;

  /// Number of passengers waiting at this stop (optional).
  final int? passengersWaiting;
}

/// Stale freshness level for the driver's location signal.
///
/// Runbook 328: 4-level stale system (0-30s, 31-120s, 121-300s, 300+s).
enum LocationFreshness {
  /// 0-30 seconds: live signal.
  live,

  /// 31-120 seconds: mildly stale.
  mild,

  /// 121-300 seconds: stale.
  stale,

  /// 300+ seconds: critically stale / lost.
  lost,
}

/// A draggable bottom sheet for passengers to track the service vehicle.
///
/// Runbook 156 / Design rule 3.4 line 93:
/// - ETA + stale + sofor notu tek sheet'te.
/// - Late departure label when `now > scheduledTime + 10 dk`.
/// - Single sheet on passenger screen (runbook 175).
///
/// This widget is designed to be used inside a [DraggableScrollableSheet]
/// or directly as a panel overlay on the passenger tracking screen.
class PassengerMapSheet extends StatelessWidget {
  const PassengerMapSheet({
    super.key,
    this.estimatedMinutes,
    this.etaSourceLabel,
    this.freshness = LocationFreshness.live,
    this.lastSeenAgo,
    this.driverNote,
    this.stops = const <PassengerStopInfo>[],
    this.isLate = false,
    this.routeName,
    this.scheduledTime,
  });

  /// Estimated time of arrival in minutes (crow-fly × 1.3 fallback).
  /// Null when ETA cannot be calculated (no driver location).
  final int? estimatedMinutes;

  /// Source label for ETA, e.g. `Kus ucusu` or `Directions API`.
  final String? etaSourceLabel;

  /// Current freshness of the driver's location signal.
  final LocationFreshness freshness;

  /// Human-readable time since last location update, e.g. `2 dk once`.
  final String? lastSeenAgo;

  /// Latest driver announcement note (single line).
  final String? driverNote;

  /// Ordered list of stops along the route.
  final List<PassengerStopInfo> stops;

  /// Whether the trip is late (now > scheduledTime + 10 min, no active trip).
  final bool isLate;

  /// Route display name, e.g. `Darica -> GOSB`.
  final String? routeName;

  /// Scheduled departure time label, e.g. `07:30`.
  final String? scheduledTime;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AmberColorTokens.surface0,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AmberRadiusTokens.radius28Value),
        ),
        boxShadow: AmberElevationTokens.shadowLevel2,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // Drag handle
          Padding(
            padding: const EdgeInsets.only(top: AmberSpacingTokens.space12),
            child: Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AmberColorTokens.line200,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),

          // ETA hero section
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AmberSpacingTokens.space16,
            ),
            child: _EtaHeroSection(
              estimatedMinutes: estimatedMinutes,
              etaSourceLabel: etaSourceLabel,
              routeName: routeName,
            ),
          ),

          // Late departure warning
          if (isLate)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AmberSpacingTokens.space16,
                AmberSpacingTokens.space12,
                AmberSpacingTokens.space16,
                0,
              ),
              child: _LateDepatureBanner(scheduledTime: scheduledTime),
            ),

          // Stale location warning
          if (freshness != LocationFreshness.live)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AmberSpacingTokens.space16,
                AmberSpacingTokens.space12,
                AmberSpacingTokens.space16,
                0,
              ),
              child: _StaleLocationBanner(
                freshness: freshness,
                lastSeenAgo: lastSeenAgo,
              ),
            ),

          // Driver note
          if (driverNote != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AmberSpacingTokens.space16,
                AmberSpacingTokens.space12,
                AmberSpacingTokens.space16,
                0,
              ),
              child: _DriverNoteCard(note: driverNote!),
            ),

          // Stop list
          if (stops.isNotEmpty) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space16),
            const _SectionDivider(),
            _StopListSection(stops: stops),
          ],

          // Bottom safe area padding
          SizedBox(
            height: MediaQuery.of(context).padding.bottom +
                AmberSpacingTokens.space16,
          ),
        ],
      ),
    );
  }
}

// --- Internal Widgets (< 300 lines each) ---

/// ETA hero: large minute display + source label + route name.
class _EtaHeroSection extends StatelessWidget {
  const _EtaHeroSection({
    this.estimatedMinutes,
    this.etaSourceLabel,
    this.routeName,
  });

  final int? estimatedMinutes;
  final String? etaSourceLabel;
  final String? routeName;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (routeName != null)
          Text(
            routeName!,
            style: const TextStyle(
              fontFamily: AmberTypographyTokens.bodyFamily,
              fontWeight: FontWeight.w500,
              fontSize: 13,
              color: AmberColorTokens.ink700,
            ),
          ),
        const SizedBox(height: 4),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: <Widget>[
            if (estimatedMinutes != null) ...<Widget>[
              Text(
                '~$estimatedMinutes',
                style: const TextStyle(
                  fontFamily: AmberTypographyTokens.headingFamily,
                  fontWeight: FontWeight.w800,
                  fontSize: 36,
                  color: AmberColorTokens.ink900,
                  height: 1.1,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                'dk',
                style: TextStyle(
                  fontFamily: AmberTypographyTokens.headingFamily,
                  fontWeight: FontWeight.w600,
                  fontSize: 18,
                  color: AmberColorTokens.ink700,
                ),
              ),
            ] else
              const Text(
                'Hesaplaniyor...',
                style: TextStyle(
                  fontFamily: AmberTypographyTokens.headingFamily,
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                  color: AmberColorTokens.ink700,
                ),
              ),
            const Spacer(),
            // Freshness dot
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: AmberColorTokens.success,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            const Text(
              'Canli',
              style: TextStyle(
                fontFamily: AmberTypographyTokens.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: AmberColorTokens.success,
              ),
            ),
          ],
        ),
        if (etaSourceLabel != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              etaSourceLabel!,
              style: TextStyle(
                fontFamily: AmberTypographyTokens.bodyFamily,
                fontWeight: FontWeight.w400,
                fontSize: 11,
                color: AmberColorTokens.ink700.withAlpha(160),
              ),
            ),
          ),
      ],
    );
  }
}

/// Late departure warning banner.
///
/// Runbook line 94: `now > scheduledTime + 10 dk` → show label.
class _LateDepatureBanner extends StatelessWidget {
  const _LateDepatureBanner({this.scheduledTime});

  final String? scheduledTime;

  @override
  Widget build(BuildContext context) {
    final timeContext =
        scheduledTime != null ? ' (Planlanan: $scheduledTime)' : '';
    return AmberStaleStatusBanner(
      message: 'Sofor henuz baslatmadi (Olasi Gecikme)$timeContext',
      severity: AmberStaleSeverity.warning,
    );
  }
}

/// Stale location banner with severity mapping.
///
/// Runbook 328: 4-level stale (0-30s live, 31-120s mild, 121-300s stale, 300+s lost).
class _StaleLocationBanner extends StatelessWidget {
  const _StaleLocationBanner({required this.freshness, this.lastSeenAgo});

  final LocationFreshness freshness;
  final String? lastSeenAgo;

  @override
  Widget build(BuildContext context) {
    final severity = freshness == LocationFreshness.lost
        ? AmberStaleSeverity.critical
        : AmberStaleSeverity.warning;

    final timeLabel = lastSeenAgo ?? '';
    final message = switch (freshness) {
      LocationFreshness.live => '',
      LocationFreshness.mild => 'Son konum bilgisi $timeLabel',
      LocationFreshness.stale =>
        'Konum bilgisi gecikiyor ($timeLabel). Servis baglantisi zayif olabilir.',
      LocationFreshness.lost =>
        'Sofor baglantisi kesildi ($timeLabel). Son bilinen konum gosteriliyor.',
    };

    if (message.isEmpty) return const SizedBox.shrink();

    return AmberStaleStatusBanner(
      message: message,
      severity: severity,
    );
  }
}

/// Compact driver note card.
class _DriverNoteCard extends StatelessWidget {
  const _DriverNoteCard({required this.note});

  final String note;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AmberSpacingTokens.space12),
      decoration: BoxDecoration(
        color: AmberColorTokens.amber100,
        borderRadius: AmberRadiusTokens.radius14,
        border: Border.all(color: AmberColorTokens.amber400.withAlpha(60)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Icon(
            Icons.campaign_rounded,
            color: AmberColorTokens.amber500,
            size: 18,
          ),
          const SizedBox(width: AmberSpacingTokens.space8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text(
                  'Sofor Notu',
                  style: TextStyle(
                    fontFamily: AmberTypographyTokens.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    color: AmberColorTokens.amber500,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  note,
                  style: const TextStyle(
                    fontFamily: AmberTypographyTokens.bodyFamily,
                    fontWeight: FontWeight.w500,
                    fontSize: 13,
                    color: AmberColorTokens.ink900,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Thin divider between major sheet sections.
class _SectionDivider extends StatelessWidget {
  const _SectionDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space16,
      ),
      color: AmberColorTokens.line200,
    );
  }
}

/// Scrollable stop list with progress markers.
class _StopListSection extends StatelessWidget {
  const _StopListSection({required this.stops});

  final List<PassengerStopInfo> stops;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space16,
        vertical: AmberSpacingTokens.space12,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Duraklar',
            style: TextStyle(
              fontFamily: AmberTypographyTokens.headingFamily,
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: AmberColorTokens.ink900,
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          ...stops.map(
            (stop) => _StopRow(
              stop: stop,
              isLast: stop == stops.last,
            ),
          ),
        ],
      ),
    );
  }
}

/// Single stop row with timeline indicator.
class _StopRow extends StatelessWidget {
  const _StopRow({required this.stop, required this.isLast});

  final PassengerStopInfo stop;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final dotColor = stop.isPassed
        ? AmberColorTokens.success
        : stop.isNext
            ? AmberColorTokens.amber500
            : AmberColorTokens.line200;

    final nameColor = stop.isPassed
        ? AmberColorTokens.ink700
        : stop.isNext
            ? AmberColorTokens.ink900
            : AmberColorTokens.ink700;

    final nameWeight = stop.isNext ? FontWeight.w600 : FontWeight.w500;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          // Timeline column
          SizedBox(
            width: 24,
            child: Column(
              children: <Widget>[
                Container(
                  width: stop.isNext ? 14 : 10,
                  height: stop.isNext ? 14 : 10,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                    border: stop.isNext
                        ? Border.all(
                            color: AmberColorTokens.amber400,
                            width: 2,
                          )
                        : null,
                  ),
                  child: stop.isPassed
                      ? const Icon(
                          Icons.check,
                          size: 8,
                          color: AmberColorTokens.surface0,
                        )
                      : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: stop.isPassed
                          ? AmberColorTokens.success.withAlpha(100)
                          : AmberColorTokens.line200,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AmberSpacingTokens.space8),
          // Stop info
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(
                bottom: AmberSpacingTokens.space12,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    stop.name,
                    style: TextStyle(
                      fontFamily: AmberTypographyTokens.bodyFamily,
                      fontWeight: nameWeight,
                      fontSize: 14,
                      color: nameColor,
                      decoration: stop.isPassed
                          ? TextDecoration.lineThrough
                          : TextDecoration.none,
                    ),
                  ),
                  if (stop.isNext && stop.passengersWaiting != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        '${stop.passengersWaiting} yolcu bekliyor',
                        style: const TextStyle(
                          fontFamily: AmberTypographyTokens.bodyFamily,
                          fontWeight: FontWeight.w400,
                          fontSize: 12,
                          color: AmberColorTokens.ink700,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
