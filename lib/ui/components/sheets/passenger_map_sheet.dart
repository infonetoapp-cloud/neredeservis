import 'package:flutter/material.dart';

import '../../../features/domain/data/phone_masking_helper.dart';
import '../../tokens/core_colors.dart';
import '../../tokens/core_elevations.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import '../../tokens/core_typography.dart';
import '../../tokens/empty_state_tokens.dart';
import '../../tokens/icon_tokens.dart';
import '../banners/core_stale_status_banner.dart';
import '../buttons/black_action_button.dart';
import '../buttons/core_buttons.dart';

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

class PassengerDriverSnapshotInfo {
  const PassengerDriverSnapshotInfo({
    required this.name,
    required this.plate,
    required this.phone,
  });

  final String name;
  final String plate;
  final String? phone;
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
/// - ETA + stale + şoför notu tek sheet'te.
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
    this.lastEtaSourceLabel,
    this.freshness = LocationFreshness.live,
    this.lastSeenAgo,
    this.driverNote,
    this.stops = const <PassengerStopInfo>[],
    this.isLate = false,
    this.routeName,
    this.scheduledTime,
    this.morningReminderNote,
    this.vacationModeNote,
    this.driverSnapshot,
    this.isSoftLockMode = false,
    this.onKeepNotificationsTap,
    this.onBackToServicesTap,
    this.onSkipTodayTap,
    this.onMessageDriverTap,
  });

  /// Estimated time of arrival in minutes (crow-fly × 1.3 fallback).
  /// Null when ETA cannot be calculated (no driver location).
  final int? estimatedMinutes;

  /// Source label for ETA, e.g. `Kus ucusu` or `Directions API`.
  final String? etaSourceLabel;

  /// Last ETA computation source shown as a compact diagnostic label.
  final String? lastEtaSourceLabel;

  /// Current freshness of the driver's location signal.
  final LocationFreshness freshness;

  /// iuman-readable time since last location update, e.g. `2 dk once`.
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

  /// Morning reminder note shown near departure window.
  final String? morningReminderNote;

  /// Route vacation mode note (if route is temporarily paused).
  final String? vacationModeNote;

  /// Driver snapshot captured on trip start.
  final PassengerDriverSnapshotInfo? driverSnapshot;

  /// Whether route feed is forced to low-priority (soft-lock) mode.
  final bool isSoftLockMode;

  /// CTA action for "Bildirim Açık Kalsın".
  final VoidCallback? onKeepNotificationsTap;

  /// CTA action for "Servislerim'e Don".
  final VoidCallback? onBackToServicesTap;

  /// CTA action for "Bugun Binmiyorum".
  final VoidCallback? onSkipTodayTap;

  /// CTA action for "Şoföre Mesaj Gönder".
  final VoidCallback? onMessageDriverTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: CoreColors.surface0,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(CoreRadii.radius28Value),
        ),
        boxShadow: CoreElevations.shadowLevel2,
        border: Border.fromBorderSide(
          BorderSide(color: CoreColors.line200),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // Drag handle
          Padding(
            padding: const EdgeInsets.only(top: CoreSpacing.space12),
            child: Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: CoreColors.ink500.withAlpha(80),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),

          // ETA hero section
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: CoreSpacing.space16,
            ),
            child: _EtaieroSection(
              estimatedMinutes: estimatedMinutes,
              etaSourceLabel: etaSourceLabel,
              lastEtaSourceLabel: lastEtaSourceLabel,
              routeName: routeName,
              freshness: freshness,
            ),
          ),

          // Late departure warning
          if (isLate)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space12,
                CoreSpacing.space16,
                0,
              ),
              child: _LateDepatureBanner(
                scheduledTime: scheduledTime,
                onKeepNotificationsTap: onKeepNotificationsTap,
                onBackToServicesTap: onBackToServicesTap,
              ),
            ),

          if (morningReminderNote != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space12,
                CoreSpacing.space16,
                0,
              ),
              child: _MorningReminderCard(note: morningReminderNote!),
            ),

          if (vacationModeNote != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space12,
                CoreSpacing.space16,
                0,
              ),
              child: CoreStaleStatusBanner(
                message: vacationModeNote!,
                severity: CoreStaleSeverity.warning,
              ),
            ),

          // Stale location warning
          if (freshness != LocationFreshness.live)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space12,
                CoreSpacing.space16,
                0,
              ),
              child: _StaleLocationBanner(
                freshness: freshness,
                lastSeenAgo: lastSeenAgo,
                showSoftLockLabel: isSoftLockMode,
              ),
            ),

          // Driver note
          if (driverNote != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space12,
                CoreSpacing.space16,
                0,
              ),
              child: _DriverNoteCard(note: driverNote!),
            ),

          if (driverSnapshot != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space12,
                CoreSpacing.space16,
                0,
              ),
              child: _DriverSnapshotCard(
                snapshot: driverSnapshot!,
                routeName: routeName,
                onSkipTodayTap: onSkipTodayTap,
                onMessageDriverTap: onMessageDriverTap,
              ),
            )
          else if (onSkipTodayTap != null || onMessageDriverTap != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoreSpacing.space16,
                CoreSpacing.space12,
                CoreSpacing.space16,
                0,
              ),
              child: _PassengerQuickActionsCard(
                onSkipTodayTap: onSkipTodayTap,
                onMessageDriverTap: onMessageDriverTap,
              ),
            ),

          // Stop list
          if (stops.isNotEmpty) ...<Widget>[
            const SizedBox(height: CoreSpacing.space16),
            const _SectionDivider(),
            _StopListSection(stops: stops),
          ] else ...<Widget>[
            const SizedBox(height: CoreSpacing.space16),
            const _SectionDivider(),
            const _StopListEmptyState(),
          ],

          // Bottom safe area padding
          SizedBox(
            height: MediaQuery.of(context).padding.bottom +
                CoreSpacing.space16,
          ),
        ],
      ),
    );
  }
}

// --- Internal Widgets (< 300 lines each) ---

/// ETA hero: large minute display + source label + route name.
class _EtaieroSection extends StatelessWidget {
  const _EtaieroSection({
    this.estimatedMinutes,
    this.etaSourceLabel,
    this.lastEtaSourceLabel,
    this.routeName,
    required this.freshness,
  });

  final int? estimatedMinutes;
  final String? etaSourceLabel;
  final String? lastEtaSourceLabel;
  final String? routeName;
  final LocationFreshness freshness;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (routeName != null)
          Text(
            routeName!,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w500,
              fontSize: 13,
              color: CoreColors.ink700,
            ),
          ),
        const SizedBox(height: 6),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: <Widget>[
            if (estimatedMinutes != null) ...<Widget>[
              Text(
                '~$estimatedMinutes',
                style: const TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w800,
                  fontSize: 38,
                  color: CoreColors.ink900,
                  height: 1.1,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                'dk',
                style: TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w700,
                  fontSize: 17,
                  color: CoreColors.ink700,
                ),
              ),
            ] else
              const Text(
                'iesaplaniyor...',
                style: TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                  color: CoreColors.ink700,
                ),
              ),
            const Spacer(),
            // Freshness dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: _freshnessColor(freshness),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              _freshnessLabel(freshness),
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: _freshnessColor(freshness),
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
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w500,
                fontSize: 11,
                color: CoreColors.ink700.withAlpha(160),
              ),
            ),
          ),
        if (lastEtaSourceLabel != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              'Son ETA kaynağı: $lastEtaSourceLabel',
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 11,
                color: CoreColors.ink700.withAlpha(180),
              ),
            ),
          ),
      ],
    );
  }

  Color _freshnessColor(LocationFreshness freshness) {
    return switch (freshness) {
      LocationFreshness.live => CoreColors.success,
      LocationFreshness.mild => CoreColors.warning,
      LocationFreshness.stale => CoreColors.amber500,
      LocationFreshness.lost => CoreColors.dangerStrong,
    };
  }

  String _freshnessLabel(LocationFreshness freshness) {
    return switch (freshness) {
      LocationFreshness.live => 'Canlı',
      LocationFreshness.mild => 'Gecikme',
      LocationFreshness.stale => 'Eski veri',
      LocationFreshness.lost => 'Bağlantı yok',
    };
  }
}

/// Late departure warning banner.
///
/// Runbook line 94: `now > scheduledTime + 10 dk` → show label.
class _LateDepatureBanner extends StatelessWidget {
  const _LateDepatureBanner({
    this.scheduledTime,
    this.onKeepNotificationsTap,
    this.onBackToServicesTap,
  });

  final String? scheduledTime;
  final VoidCallback? onKeepNotificationsTap;
  final VoidCallback? onBackToServicesTap;

  @override
  Widget build(BuildContext context) {
    final timeContext =
        scheduledTime != null ? ' (Planlanan: $scheduledTime)' : '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        CoreStaleStatusBanner(
          message: 'Şoför henüz başlatmadı (Olası Gecikme)$timeContext',
          severity: CoreStaleSeverity.warning,
        ),
        if (onKeepNotificationsTap != null ||
            onBackToServicesTap != null) ...<Widget>[
          const SizedBox(height: CoreSpacing.space8),
          Wrap(
            spacing: CoreSpacing.space8,
            runSpacing: CoreSpacing.space8,
            children: <Widget>[
              if (onKeepNotificationsTap != null)
                CoreSecondaryButton(
                  label: 'Bildirim Açık Kalsın',
                  onPressed: onKeepNotificationsTap,
                  fullWidth: false,
                ),
              if (onBackToServicesTap != null)
                CoreSecondaryButton(
                  label: "Servislerime Dön",
                  onPressed: onBackToServicesTap,
                  fullWidth: false,
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _MorningReminderCard extends StatelessWidget {
  const _MorningReminderCard({required this.note});

  final String note;

  @override
  Widget build(BuildContext context) {
    return CoreStaleStatusBanner(
      message: note,
      severity: CoreStaleSeverity.warning,
    );
  }
}

/// Stale location banner with severity mapping.
///
/// Runbook 328: 4-level stale (0-30s live, 31-120s mild, 121-300s stale, 300+s lost).
class _StaleLocationBanner extends StatelessWidget {
  const _StaleLocationBanner({
    required this.freshness,
    this.lastSeenAgo,
    this.showSoftLockLabel = false,
  });

  final LocationFreshness freshness;
  final String? lastSeenAgo;
  final bool showSoftLockLabel;

  @override
  Widget build(BuildContext context) {
    final severity = switch (freshness) {
      LocationFreshness.live => CoreStaleSeverity.warning,
      LocationFreshness.mild => CoreStaleSeverity.warning,
      LocationFreshness.stale => CoreStaleSeverity.elevated,
      LocationFreshness.lost => CoreStaleSeverity.critical,
    };

    final timeLabel = lastSeenAgo ?? '';
    final baseMessage = switch (freshness) {
      LocationFreshness.live => '',
      LocationFreshness.mild => 'Son konum bilgisi $timeLabel',
      LocationFreshness.stale =>
        'Konum bilgisi gecikiyor ($timeLabel). Servis bağlantısı zayıf olabilir.',
      LocationFreshness.lost =>
        'Şoför bağlantısı kesildi ($timeLabel). Son bilinen konum gösteriliyor.',
    };
    final message = showSoftLockLabel
        ? '$baseMessage\nServis Bağlantısı: Düşük Öncelik Modu'
        : baseMessage;

    if (message.isEmpty) return const SizedBox.shrink();

    return CoreStaleStatusBanner(
      message: message,
      severity: severity,
    );
  }
}

class _DriverSnapshotCard extends StatelessWidget {
  const _DriverSnapshotCard({
    required this.snapshot,
    this.routeName,
    this.onSkipTodayTap,
    this.onMessageDriverTap,
  });

  final PassengerDriverSnapshotInfo snapshot;
  final String? routeName;
  final VoidCallback? onSkipTodayTap;
  final VoidCallback? onMessageDriverTap;

  @override
  Widget build(BuildContext context) {
    final maskedPhone = PhoneMaskingHelper.mask(snapshot.phone);
    final hasVisiblePhone = maskedPhone.isNotEmpty;
    final phoneLabel =
        hasVisiblePhone ? 'Iletisim: $maskedPhone' : 'Telefon paylasimi kapali';
    final maskingPolicyLabel = hasVisiblePhone
        ? 'Gizlilik: Telefon bilgisi maskeli paylasilir.'
        : 'Gizlilik: Telefon bilgisi yolculara kapali.';
    final effectiveRouteName = routeName?.trim();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(CoreSpacing.space12),
      decoration: BoxDecoration(
        color: CoreColors.surface50,
        borderRadius: CoreRadii.radius12,
        border: Border.all(color: CoreColors.line200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Şoför Özeti',
            style: TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 11,
              color: CoreColors.ink700,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: CoreColors.surface0,
                  shape: BoxShape.circle,
                  border: Border.all(color: CoreColors.line200),
                ),
                child: const Icon(
                  CoreIconTokens.user,
                  color: CoreColors.ink700,
                  size: 24,
                ),
              ),
              const SizedBox(width: CoreSpacing.space12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      snapshot.name,
                      style: const TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w700,
                        fontSize: 20,
                        color: CoreColors.ink900,
                        height: 1.1,
                      ),
                    ),
                    if (effectiveRouteName != null &&
                        effectiveRouteName.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 2),
                      Text(
                        effectiveRouteName,
                        style: const TextStyle(
                          fontFamily: CoreTypography.bodyFamily,
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                          color: CoreColors.ink700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: CoreSpacing.space10,
                  vertical: CoreSpacing.space8,
                ),
                decoration: BoxDecoration(
                  color: CoreColors.surface0,
                  borderRadius: CoreRadii.radius12,
                  border: Border.all(color: CoreColors.line200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const Text(
                      'PLAKA',
                      style: TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                        color: CoreColors.ink500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      snapshot.plate,
                      style: const TextStyle(
                        fontFamily: CoreTypography.headingFamily,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: CoreColors.ink900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            phoneLabel,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w500,
              fontSize: 12,
              color: CoreColors.ink700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            maskingPolicyLabel,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w400,
              fontSize: 11,
              color: CoreColors.ink700,
            ),
          ),
          if (onSkipTodayTap != null || onMessageDriverTap != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space12),
            if (onSkipTodayTap != null)
              BlackPrimaryButton(
                label: 'Bugun Binmiyorum',
                onPressed: onSkipTodayTap,
              ),
            if (onSkipTodayTap != null && onMessageDriverTap != null)
              const SizedBox(height: CoreSpacing.space8),
            if (onMessageDriverTap != null)
              BlackPrimaryButton(
                label: 'Şoföre Mesaj Gönder',
                onPressed: onMessageDriverTap,
              ),
          ],
        ],
      ),
    );
  }
}

class _PassengerQuickActionsCard extends StatelessWidget {
  const _PassengerQuickActionsCard({
    this.onSkipTodayTap,
    this.onMessageDriverTap,
  });

  final VoidCallback? onSkipTodayTap;
  final VoidCallback? onMessageDriverTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(CoreSpacing.space12),
      decoration: BoxDecoration(
        color: CoreColors.surface50,
        borderRadius: CoreRadii.radius12,
        border: Border.all(color: CoreColors.line200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const Text(
            'Hızlı İşlemler',
            style: TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: CoreColors.ink700,
            ),
          ),
          if (onSkipTodayTap != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            BlackPrimaryButton(
              label: 'Bugun Binmiyorum',
              onPressed: onSkipTodayTap,
            ),
          ],
          if (onSkipTodayTap != null && onMessageDriverTap != null)
            const SizedBox(height: CoreSpacing.space8),
          if (onMessageDriverTap != null)
            BlackPrimaryButton(
              label: 'Şoföre Mesaj Gönder',
              onPressed: onMessageDriverTap,
            ),
        ],
      ),
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
      padding: const EdgeInsets.all(CoreSpacing.space12),
      decoration: BoxDecoration(
        color: CoreColors.amber100,
        borderRadius: CoreRadii.radius12,
        border: Border.all(color: CoreColors.amber400.withAlpha(60)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Icon(
            CoreIconTokens.megaphone,
            color: CoreColors.amber500,
            size: 18,
          ),
          const SizedBox(width: CoreSpacing.space8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text(
                  'Şoför Notu',
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    color: CoreColors.amber500,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  note,
                  style: const TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w500,
                    fontSize: 13,
                    color: CoreColors.ink900,
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
        horizontal: CoreSpacing.space16,
      ),
      color: CoreColors.line200,
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
        horizontal: CoreSpacing.space16,
        vertical: CoreSpacing.space12,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Duraklar',
            style: TextStyle(
              fontFamily: CoreTypography.headingFamily,
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: CoreColors.ink900,
            ),
          ),
          const SizedBox(height: CoreSpacing.space8),
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

class _StopListEmptyState extends StatelessWidget {
  const _StopListEmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space16,
        vertical: CoreSpacing.space12,
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(CoreSpacing.space12),
        decoration: BoxDecoration(
          color: CoreColors.surface50,
          borderRadius: CoreRadii.radius12,
          border: Border.all(color: CoreColors.line200),
        ),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              CoreEmptyStateTokens.passengerStopsTitle,
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: CoreColors.ink900,
              ),
            ),
            SizedBox(height: 4),
            Text(
              CoreEmptyStateTokens.passengerStopsDescription,
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w500,
                fontSize: 12,
                color: CoreColors.ink700,
              ),
            ),
          ],
        ),
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
        ? CoreColors.success
        : stop.isNext
            ? CoreColors.amber500
            : CoreColors.line200;

    final nameColor = stop.isPassed
        ? CoreColors.ink700
        : stop.isNext
            ? CoreColors.ink900
            : CoreColors.ink700;

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
                            color: CoreColors.amber400,
                            width: 2,
                          )
                        : null,
                  ),
                  child: stop.isPassed
                      ? const Icon(
                          CoreIconTokens.check,
                          size: 8,
                          color: CoreColors.surface0,
                        )
                      : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: stop.isPassed
                          ? CoreColors.success.withAlpha(100)
                          : CoreColors.line200,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: CoreSpacing.space8),
          // Stop info
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(
                bottom: CoreSpacing.space12,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    stop.name,
                    style: TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
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
                          fontFamily: CoreTypography.bodyFamily,
                          fontWeight: FontWeight.w400,
                          fontSize: 12,
                          color: CoreColors.ink700,
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
