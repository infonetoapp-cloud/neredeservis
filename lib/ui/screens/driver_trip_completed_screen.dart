import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../components/buttons/black_action_button.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';
import '../tokens/icon_tokens.dart';

class DriverTripCompletedStopItem {
  const DriverTripCompletedStopItem({
    required this.name,
    required this.timeLabel,
    this.passengerCount,
    this.isStart = false,
    this.isEnd = false,
  });

  final String name;
  final String timeLabel;
  final int? passengerCount;
  final bool isStart;
  final bool isEnd;
}

class DriverTripCompletedScreen extends StatelessWidget {
  const DriverTripCompletedScreen({
    super.key,
    required this.routeName,
    required this.totalDistanceKm,
    required this.totalDurationMinutes,
    required this.totalPassengers,
    required this.stops,
    required this.onBackHomeTap,
  });

  final String routeName;
  final double totalDistanceKm;
  final int totalDurationMinutes;
  final int totalPassengers;
  final List<DriverTripCompletedStopItem> stops;
  final VoidCallback onBackHomeTap;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F3F3),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFFF3F3F3),
        foregroundColor: CoreColors.ink900,
        leading: IconButton(
          onPressed: onBackHomeTap,
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        title: const Text(
          'SEFER DETAYI',
          style: TextStyle(
            fontFamily: CoreTypography.bodyFamily,
            fontWeight: FontWeight.w700,
            fontSize: 21,
            color: CoreColors.ink900,
            letterSpacing: 0.6,
          ),
        ),
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            CoreSpacing.space16,
            CoreSpacing.space16,
            CoreSpacing.space16,
            CoreSpacing.space24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Center(
                child: Container(
                  width: 68,
                  height: 68,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF0E9DA),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: CircleAvatar(
                      radius: 16,
                      backgroundColor: CoreColors.warning,
                      child: Icon(
                        CoreIconTokens.check,
                        color: CoreColors.surface0,
                        size: 16,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: CoreSpacing.space20),
              const Text(
                'Sefer Tamamlandi!',
                style: TextStyle(
                  fontFamily: CoreTypography.headingFamily,
                  fontWeight: FontWeight.w700,
                  fontSize: 42,
                  color: CoreColors.ink900,
                ),
              ),
              const SizedBox(height: CoreSpacing.space8),
              Text(
                '$routeName seferi basariyla tamamlandi.',
                style: const TextStyle(
                  fontFamily: CoreTypography.bodyFamily,
                  fontWeight: FontWeight.w500,
                  fontSize: 15,
                  color: CoreColors.ink700,
                ),
              ),
              const SizedBox(height: CoreSpacing.space16),
              _MetricCard(
                icon: CoreIconTokens.navigation,
                label: 'TOPLAM MESAFE',
                value: '${totalDistanceKm.toStringAsFixed(1)} km',
              ),
              const SizedBox(height: CoreSpacing.space12),
              _MetricCard(
                icon: CoreIconTokens.clock,
                label: 'TOPLAM SURE',
                value: '$totalDurationMinutes Dakika',
              ),
              const SizedBox(height: CoreSpacing.space12),
              _MetricCard(
                icon: Icons.groups_2_rounded,
                label: 'TASINAN YOLCU',
                value: '$totalPassengers',
              ),
              const SizedBox(height: CoreSpacing.space16),
              const _MiniRoutePreview(),
              const SizedBox(height: CoreSpacing.space20),
              const Row(
                children: <Widget>[
                  Icon(
                    Icons.format_list_bulleted_rounded,
                    size: 20,
                    color: CoreColors.ink900,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Durak Detayları',
                    style: TextStyle(
                      fontFamily: CoreTypography.headingFamily,
                      fontWeight: FontWeight.w700,
                      fontSize: 24,
                      color: CoreColors.ink900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CoreSpacing.space12),
              if (stops.isEmpty)
                const Text(
                  'Durak kaydi bulunamadi.',
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                    color: CoreColors.ink700,
                  ),
                )
              else
                ...stops.map(
                  (stop) => _StopTimelineRow(
                    stop: stop,
                    isLast: stop == stops.last,
                  ),
                ),
              const SizedBox(height: CoreSpacing.space16),
              BlackPrimaryButton(
                label: 'Ana Sayfaya Don',
                onPressed: onBackHomeTap,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(CoreSpacing.space16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F8F8),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 18, color: CoreColors.warning),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              color: CoreColors.ink500,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontFamily: CoreTypography.headingFamily,
              fontWeight: FontWeight.w700,
              fontSize: 24,
              color: CoreColors.ink900,
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniRoutePreview extends StatelessWidget {
  const _MiniRoutePreview();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 170,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[Color(0xFFDDE7ED), Color(0xFFCDE0EA)],
        ),
      ),
      child: Stack(
        children: <Widget>[
          Positioned.fill(
            child: CustomPaint(
              painter: _MiniRoutePainter(),
            ),
          ),
          Positioned(
            right: 10,
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: CoreColors.surface0.withAlpha(235),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text(
                'ROTA IZLENDI',
                style: TextStyle(
                  fontFamily: CoreTypography.bodyFamily,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                  color: CoreColors.ink900,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniRoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()..color = const Color(0x18000000);
    for (var index = 0; index < 9; index++) {
      final x = (size.width / 8) * index;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (var index = 0; index < 7; index++) {
      final y = (size.height / 6) * index;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
    final routePaint = Paint()
      ..color = CoreColors.warning
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..moveTo(size.width * 0.84, size.height * 0.14)
      ..quadraticBezierTo(
        size.width * 0.55,
        size.height * 0.42,
        size.width * 0.45,
        size.height * 0.86,
      );
    canvas.drawPath(path, routePaint);

    final markerPaint = Paint()..color = CoreColors.surface0;
    final markerStroke = Paint()
      ..color = CoreColors.warning
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    final point = Offset(size.width * 0.45, size.height * 0.86);
    canvas.drawCircle(point, 7, markerPaint);
    canvas.drawCircle(point, 7, markerStroke);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _StopTimelineRow extends StatelessWidget {
  const _StopTimelineRow({
    required this.stop,
    required this.isLast,
  });

  final DriverTripCompletedStopItem stop;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final dotColor = stop.isStart || stop.isEnd
        ? CoreColors.warning
        : const Color(0xFFD0D0D0);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          SizedBox(
            width: 24,
            child: Column(
              children: <Widget>[
                Container(
                  width: stop.isStart || stop.isEnd ? 14 : 11,
                  height: stop.isStart || stop.isEnd ? 14 : 11,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: CoreColors.surface0,
                    border: Border.all(color: dotColor, width: 3),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: const Color(0xFFDADADA),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          stop.name,
                          style: const TextStyle(
                            fontFamily: CoreTypography.headingFamily,
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                            color: CoreColors.ink900,
                          ),
                        ),
                      ),
                      if (stop.passengerCount != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE9E9E9),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '${math.max(0, stop.passengerCount!)} Yolcu',
                            style: const TextStyle(
                              fontFamily: CoreTypography.bodyFamily,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                              color: CoreColors.ink900,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    stop.timeLabel,
                    style: const TextStyle(
                      fontFamily: CoreTypography.bodyFamily,
                      fontWeight: FontWeight.w500,
                      fontSize: 15,
                      color: CoreColors.ink500,
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
