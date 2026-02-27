import 'package:flutter/material.dart';

import '../components/indicators/core_heartbeat_indicator.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';

/// Temporary compatibility surface for legacy map-mode tests.
///
/// The current screen renders a placeholder map, but older tests still verify
/// the driver gesture lock policy contract.
class DriverLockedGesturesSettings {
  const DriverLockedGesturesSettings({
    required this.rotateEnabled,
    required this.pinchToZoomEnabled,
    required this.scrollEnabled,
    required this.pitchEnabled,
    required this.doubleTapToZoomInEnabled,
    required this.doubleTouchToZoomOutEnabled,
    required this.quickZoomEnabled,
    required this.pinchPanEnabled,
  });

  final bool rotateEnabled;
  final bool pinchToZoomEnabled;
  final bool scrollEnabled;
  final bool pitchEnabled;
  final bool doubleTapToZoomInEnabled;
  final bool doubleTouchToZoomOutEnabled;
  final bool quickZoomEnabled;
  final bool pinchPanEnabled;
}

DriverLockedGesturesSettings buildDriverLockedGesturesSettings() {
  return const DriverLockedGesturesSettings(
    rotateEnabled: false,
    pinchToZoomEnabled: false,
    scrollEnabled: false,
    pitchEnabled: false,
    doubleTapToZoomInEnabled: false,
    doubleTouchToZoomOutEnabled: false,
    quickZoomEnabled: false,
    pinchPanEnabled: false,
  );
}

class ActiveTripMapPoint {
  const ActiveTripMapPoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class ActiveTripPassengerEntry {
  const ActiveTripPassengerEntry({
    this.passengerUid = '',
    required this.name,
    required this.isSkipToday,
    this.isGuest = false,
  });

  final String passengerUid;
  final String name;
  final bool isSkipToday;
  final bool isGuest;
}

class ActiveTripScreen extends StatelessWidget {
  const ActiveTripScreen({
    super.key,
    this.routeName = 'Darica -> GOSB',
    this.nextStopName = 'GOSB Giris',
    this.crowFlyDistanceMeters = 840,
    this.stopsRemaining = 4,
    this.passengersAtNextStop = 3,
    this.passengerEntries = const <ActiveTripPassengerEntry>[],
    this.heartbeatState = HeartbeatState.green,
    this.lastHeartbeatAgo = '2 sn',
    this.routePathPoints = const <ActiveTripMapPoint>[],
    this.vehiclePoint,
    this.nextStopPoint,
    this.syncStateLabel,
    this.manualInterventionMessage,
    this.offlineBannerLabel,
    this.latencyIndicatorLabel,
    this.mapboxPublicToken,
    this.onRetrySyncTap,
    this.onReportIssueTap,
    this.onTripFinished,
    this.onEmergencyTap,
    this.onPassengerMessageTap,
  });

  final String routeName;
  final String? nextStopName;
  final int? crowFlyDistanceMeters;
  final int? stopsRemaining;
  final int? passengersAtNextStop;
  final List<ActiveTripPassengerEntry> passengerEntries;
  final HeartbeatState heartbeatState;
  final String? lastHeartbeatAgo;
  final List<ActiveTripMapPoint> routePathPoints;
  final ActiveTripMapPoint? vehiclePoint;
  final ActiveTripMapPoint? nextStopPoint;
  final String? syncStateLabel;
  final String? manualInterventionMessage;
  final String? offlineBannerLabel;
  final String? latencyIndicatorLabel;
  final String? mapboxPublicToken;
  final VoidCallback? onRetrySyncTap;
  final VoidCallback? onReportIssueTap;
  final VoidCallback? onTripFinished;
  final VoidCallback? onEmergencyTap;
  final ValueChanged<ActiveTripPassengerEntry>? onPassengerMessageTap;

  @override
  Widget build(BuildContext context) {
    final nextStopLabel = (nextStopName ?? '').trim().isEmpty
        ? 'Tüm duraklar tamamlandı'
        : nextStopName!;
    final distanceLabel = crowFlyDistanceMeters == null
        ? 'Mesafe bilgisi yok'
        : '$crowFlyDistanceMeters m';
    final heartbeatLabel = switch (heartbeatState) {
      HeartbeatState.green => 'Yayın aktif',
      HeartbeatState.yellow => 'Bağlantı zayıf',
      HeartbeatState.red => 'Bağlantı kesik',
    };

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F8),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  CoreSpacing.space16,
                  CoreSpacing.space12,
                  CoreSpacing.space16,
                  CoreSpacing.space12,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    _TopBar(
                      routeName: routeName,
                      heartbeatLabel: heartbeatLabel,
                      heartbeatState: heartbeatState,
                      onEmergencyTap: onEmergencyTap,
                    ),
                    if (_hasText(offlineBannerLabel)) ...<Widget>[
                      const SizedBox(height: 10),
                      _InfoBanner(
                        text: offlineBannerLabel!,
                        tone: const Color(0xFFFCECEC),
                        textColor: const Color(0xFFB42318),
                      ),
                    ],
                    if (_hasText(manualInterventionMessage)) ...<Widget>[
                      const SizedBox(height: 10),
                      _InfoBanner(
                        text: manualInterventionMessage!,
                        tone: const Color(0xFFFFF7E8),
                        textColor: const Color(0xFF9A6700),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Expanded(
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF0F6),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFDCE5EE)),
                        ),
                        child: Stack(
                          children: <Widget>[
                            const Positioned.fill(child: _MapPlaceholderPattern()),
                            Positioned(
                              top: 14,
                              left: 14,
                              right: 14,
                              child: _TripGuidanceCard(
                                nextStopLabel: nextStopLabel,
                                distanceLabel: distanceLabel,
                                stopsRemaining: stopsRemaining,
                                passengersAtNextStop: passengersAtNextStop,
                                lastHeartbeatAgo: lastHeartbeatAgo,
                                latencyIndicatorLabel: latencyIndicatorLabel,
                                syncStateLabel: syncStateLabel,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            _BottomPanel(
              passengerEntries: passengerEntries,
              onPassengerMessageTap: onPassengerMessageTap,
              onRetrySyncTap: onRetrySyncTap,
              onReportIssueTap: onReportIssueTap,
              onTripFinished: onTripFinished,
            ),
          ],
        ),
      ),
    );
  }

  bool _hasText(String? value) => value != null && value.trim().isNotEmpty;
}

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.routeName,
    required this.heartbeatLabel,
    required this.heartbeatState,
    this.onEmergencyTap,
  });

  final String routeName;
  final String heartbeatLabel;
  final HeartbeatState heartbeatState;
  final VoidCallback? onEmergencyTap;

  @override
  Widget build(BuildContext context) {
    final heartbeatColor = switch (heartbeatState) {
      HeartbeatState.green => const Color(0xFF138F3E),
      HeartbeatState.yellow => const Color(0xFFF59E0B),
      HeartbeatState.red => const Color(0xFFDC2626),
    };
    return Row(
      children: <Widget>[
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                routeName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w800,
                  fontSize: 20,
                  color: CoreColors.ink900,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: <Widget>[
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: heartbeatColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    heartbeatLabel,
                    style: const TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: CoreColors.ink700,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (onEmergencyTap != null)
          FilledButton.tonalIcon(
            onPressed: onEmergencyTap,
            icon: const Icon(Icons.warning_amber_rounded),
            label: const Text('Acil'),
          ),
      ],
    );
  }
}

class _TripGuidanceCard extends StatelessWidget {
  const _TripGuidanceCard({
    required this.nextStopLabel,
    required this.distanceLabel,
    required this.stopsRemaining,
    required this.passengersAtNextStop,
    required this.lastHeartbeatAgo,
    required this.latencyIndicatorLabel,
    required this.syncStateLabel,
  });

  final String nextStopLabel;
  final String distanceLabel;
  final int? stopsRemaining;
  final int? passengersAtNextStop;
  final String? lastHeartbeatAgo;
  final String? latencyIndicatorLabel;
  final String? syncStateLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 12,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Sonraki Durak',
            style: TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              color: CoreColors.ink700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            nextStopLabel,
            style: const TextStyle(
              fontFamily: CoreTypography.headingFamily,
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: CoreColors.ink900,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              _MiniChip(icon: Icons.near_me_rounded, label: distanceLabel),
              if (stopsRemaining != null)
                _MiniChip(
                  icon: Icons.route_rounded,
                  label: '$stopsRemaining durak kaldı',
                ),
              if (passengersAtNextStop != null)
                _MiniChip(
                  icon: Icons.groups_rounded,
                  label: '$passengersAtNextStop kişi bekliyor',
                ),
            ],
          ),
          if ((lastHeartbeatAgo ?? '').trim().isNotEmpty ||
              (latencyIndicatorLabel ?? '').trim().isNotEmpty ||
              (syncStateLabel ?? '').trim().isNotEmpty) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              [
                if ((lastHeartbeatAgo ?? '').trim().isNotEmpty)
                  'Son sinyal: ${lastHeartbeatAgo!.trim()}',
                if ((latencyIndicatorLabel ?? '').trim().isNotEmpty)
                  latencyIndicatorLabel!.trim(),
                if ((syncStateLabel ?? '').trim().isNotEmpty)
                  syncStateLabel!.trim(),
              ].join(' · '),
              style: const TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: CoreColors.ink700,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BottomPanel extends StatelessWidget {
  const _BottomPanel({
    required this.passengerEntries,
    this.onPassengerMessageTap,
    this.onRetrySyncTap,
    this.onReportIssueTap,
    this.onTripFinished,
  });

  final List<ActiveTripPassengerEntry> passengerEntries;
  final ValueChanged<ActiveTripPassengerEntry>? onPassengerMessageTap;
  final VoidCallback? onRetrySyncTap;
  final VoidCallback? onReportIssueTap;
  final VoidCallback? onTripFinished;

  @override
  Widget build(BuildContext context) {
    final visibleEntries = passengerEntries.take(6).toList(growable: false);
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 14,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: CoreColors.line200,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Yolcu Listesi',
                style: TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w700,
                  fontSize: 17,
                  color: CoreColors.ink900,
                ),
              ),
              const SizedBox(height: 8),
              if (visibleEntries.isEmpty)
                const Text(
                  'Yolcu bilgisi yok.',
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: CoreColors.ink700,
                  ),
                )
              else
                ...visibleEntries.map(
                  (entry) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      radius: 16,
                      backgroundColor: entry.isSkipToday
                          ? const Color(0xFFF1F5F9)
                          : const Color(0xFFFFF4DB),
                      child: Icon(
                        entry.isGuest ? Icons.person_outline : Icons.person,
                        size: 18,
                        color: entry.isSkipToday
                            ? const Color(0xFF64748B)
                            : const Color(0xFF9A6700),
                      ),
                    ),
                    title: Text(
                      entry.name,
                      style: const TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: CoreColors.ink900,
                      ),
                    ),
                    subtitle: Text(
                      entry.isSkipToday ? 'Bugün yok' : 'Aktif yolcu',
                      style: const TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                        color: CoreColors.ink700,
                      ),
                    ),
                    trailing: onPassengerMessageTap == null
                        ? null
                        : IconButton(
                            onPressed: () => onPassengerMessageTap!(entry),
                            icon: const Icon(Icons.chat_bubble_outline_rounded),
                          ),
                  ),
                ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: <Widget>[
                  if (onRetrySyncTap != null)
                    OutlinedButton.icon(
                      onPressed: onRetrySyncTap,
                      icon: const Icon(Icons.sync_rounded),
                      label: const Text('Tekrar senkronize et'),
                    ),
                  if (onReportIssueTap != null)
                    OutlinedButton.icon(
                      onPressed: onReportIssueTap,
                      icon: const Icon(Icons.support_agent_rounded),
                      label: const Text('Sorun bildir'),
                    ),
                ],
              ),
              if (onTripFinished != null) ...<Widget>[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: onTripFinished,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'Seferi Bitir',
                      style: TextStyle(
                        fontFamily: CoreTypography.bodyFamily,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({
    required this.text,
    required this.tone,
    required this.textColor,
  });

  final String text;
  final Color tone;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: tone,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: CoreTypography.bodyFamily,
          fontWeight: FontWeight.w700,
          fontSize: 13,
          color: textColor,
        ),
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  const _MiniChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F6F8),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 14, color: const Color(0xFF64748B)),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              color: Color(0xFF334155),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapPlaceholderPattern extends StatelessWidget {
  const _MapPlaceholderPattern();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _MapPlaceholderPainter(),
      child: const SizedBox.expand(),
    );
  }
}

class _MapPlaceholderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = const Color(0xFFD9E4EE)
      ..strokeWidth = 1;
    for (double x = 24; x < size.width; x += 38) {
      canvas.drawLine(Offset(x, 0), Offset(x - 20, size.height), gridPaint);
    }
    for (double y = 20; y < size.height; y += 34) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y - 8), gridPaint);
    }

    final routePaint = Paint()
      ..color = const Color(0xFFF59E0B)
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final routeShadow = Paint()
      ..color = const Color(0x33F59E0B)
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..moveTo(size.width * 0.45, size.height * 0.9)
      ..quadraticBezierTo(
        size.width * 0.55,
        size.height * 0.65,
        size.width * 0.42,
        size.height * 0.46,
      )
      ..quadraticBezierTo(
        size.width * 0.35,
        size.height * 0.28,
        size.width * 0.52,
        size.height * 0.1,
      );
    canvas.drawPath(path, routeShadow);
    canvas.drawPath(path, routePaint);

    final pointPaint = Paint()..color = Colors.white;
    final pointBorder = Paint()
      ..color = const Color(0xFFF59E0B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;
    final point = Offset(size.width * 0.47, size.height * 0.62);
    canvas.drawCircle(point, 10, pointPaint);
    canvas.drawCircle(point, 10, pointBorder);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
