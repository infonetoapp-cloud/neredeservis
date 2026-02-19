import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../components/indicators/amber_status_chip.dart';
import '../components/sheets/passenger_map_sheet.dart';
import '../tokens/color_tokens.dart';
import '../tokens/icon_tokens.dart';
import '../tokens/spacing_tokens.dart';
import '../tokens/typography_tokens.dart';

/// Passenger tracking screen: full-screen map shell + draggable bottom sheet.
///
/// Runbook 156: Passenger map bottom-sheet ekranini amber stile gore kodla.
/// Runbook 175: Passenger ekranda tek sheet kuralini sabitle.
///
/// Architecture:
/// - Layer 0: Mapbox (token/platform yoksa placeholder fallback)
/// - Layer 1: Top route info bar (transparent overlay)
/// - Layer 2: DraggableScrollableSheet with PassengerMapSheet content
class PassengerTrackingScreen extends StatelessWidget {
  const PassengerTrackingScreen({
    super.key,
    this.routeName = 'Darica -> GOSB',
    this.estimatedMinutes = 12,
    this.etaSourceLabel = 'Kus ucusu tahmini',
    this.freshness = LocationFreshness.live,
    this.lastSeenAgo,
    this.driverNote,
    this.stops = const <PassengerStopInfo>[],
    this.isLate = false,
    this.scheduledTime,
    this.driverName,
    this.mapboxPublicToken,
    this.onLeaveRouteTap,
  });

  /// Route display name.
  final String routeName;

  /// Estimated arrival in minutes.
  final int? estimatedMinutes;

  /// ETA calculation source label.
  final String? etaSourceLabel;

  /// Driver location freshness level.
  final LocationFreshness freshness;

  /// Human-readable last seen time.
  final String? lastSeenAgo;

  /// Latest driver announcement.
  final String? driverNote;

  /// Ordered list of stops on the route.
  final List<PassengerStopInfo> stops;

  /// Whether trip is late (no active trip, past scheduled + 10 min).
  final bool isLate;

  /// Scheduled departure time label.
  final String? scheduledTime;

  /// Driver's display name (for the map marker label).
  final String? driverName;

  /// Public Mapbox token supplied via `--dart-define MAPBOX_PUBLIC_TOKEN=pk...`.
  final String? mapboxPublicToken;

  /// Optional leave action for joined passengers.
  final VoidCallback? onLeaveRouteTap;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: <Widget>[
          // Layer 0: Map shell
          Positioned.fill(
            child: _PassengerMapShell(
              mapboxPublicToken: mapboxPublicToken,
            ),
          ),

          // Layer 1: Top status bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _TopBar(
              routeName: routeName,
              freshness: freshness,
              onLeaveRouteTap: onLeaveRouteTap,
            ),
          ),

          // Layer 2: Draggable bottom sheet
          _PassengerDraggableSheet(
            routeName: routeName,
            estimatedMinutes: estimatedMinutes,
            etaSourceLabel: etaSourceLabel,
            freshness: freshness,
            lastSeenAgo: lastSeenAgo,
            driverNote: driverNote,
            stops: stops,
            isLate: isLate,
            scheduledTime: scheduledTime,
          ),
        ],
      ),
    );
  }
}

// --- Internal Widgets ---

/// Map background placeholder for the passenger view.
/// Falls back to mock shell if token/platform is not ready.
class _PassengerMapShell extends StatelessWidget {
  const _PassengerMapShell({
    required this.mapboxPublicToken,
  });

  final String? mapboxPublicToken;

  bool get _isMobilePlatform {
    return !kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS);
  }

  bool get _hasToken {
    final token = mapboxPublicToken?.trim();
    return token != null && token.isNotEmpty;
  }

  @override
  Widget build(BuildContext context) {
    if (!_isMobilePlatform) {
      return const _PassengerMapPlaceholder(
        infoLabel: 'Mapbox yalnizca Android/iOS destekler.',
      );
    }
    if (!_hasToken) {
      return const _PassengerMapPlaceholder(
        infoLabel: 'MAPBOX_PUBLIC_TOKEN tanimli degil.',
      );
    }
    return const mapbox.MapWidget(styleUri: mapbox.MapboxStyles.STANDARD);
  }
}

/// Mock map shell shown when Mapbox cannot be rendered.
class _PassengerMapPlaceholder extends StatelessWidget {
  const _PassengerMapPlaceholder({required this.infoLabel});

  final String infoLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[
            Color(0xFFE8EDE4),
            Color(0xFFF2F4EF),
            Color(0xFFEAEFE6),
          ],
        ),
      ),
      child: Stack(
        children: <Widget>[
          // Subtle grid lines (map simulation)
          ..._buildGridLines(),

          // Driver vehicle marker (center-ish)
          Positioned(
            top: MediaQuery.of(context).size.height * 0.3,
            left: MediaQuery.of(context).size.width * 0.4,
            child: _VehicleMarker(),
          ),

          // Route polyline hint (simple dashed line)
          Positioned(
            top: MediaQuery.of(context).size.height * 0.15,
            left: MediaQuery.of(context).size.width * 0.25,
            right: MediaQuery.of(context).size.width * 0.15,
            bottom: MediaQuery.of(context).size.height * 0.55,
            child: CustomPaint(
              painter: _RouteHintPainter(),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 220,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AmberColorTokens.ink900.withAlpha(185),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                infoLabel,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: AmberTypographyTokens.bodyFamily,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AmberColorTokens.surface0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildGridLines() {
    return <Widget>[
      for (int i = 1; i <= 6; i++)
        Positioned(
          top: 0,
          bottom: 0,
          left: i * 65.0,
          child: Container(
            width: 0.5,
            color: const Color(0x14000000),
          ),
        ),
      for (int i = 1; i <= 10; i++)
        Positioned(
          left: 0,
          right: 0,
          top: i * 75.0,
          child: Container(
            height: 0.5,
            color: const Color(0x14000000),
          ),
        ),
    ];
  }
}

/// Vehicle marker on the placeholder map.
class _VehicleMarker extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AmberColorTokens.amber500,
            shape: BoxShape.circle,
            border: Border.all(color: AmberColorTokens.surface0, width: 3),
            boxShadow: const <BoxShadow>[
              BoxShadow(
                color: Color(0x30000000),
                blurRadius: 8,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: const Icon(
            AmberIconTokens.bus,
            color: AmberColorTokens.surface0,
            size: 22,
          ),
        ),
        const SizedBox(height: 3),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AmberColorTokens.ink900.withAlpha(200),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Text(
            'Servis',
            style: TextStyle(
              fontFamily: AmberTypographyTokens.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 9,
              color: AmberColorTokens.surface0,
            ),
          ),
        ),
      ],
    );
  }
}

/// Subtle route hint painter (diagonal dash line from top-right to vehicle).
class _RouteHintPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AmberColorTokens.amber500.withAlpha(80)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(size.width * 0.8, 0)
      ..quadraticBezierTo(
        size.width * 0.5,
        size.height * 0.5,
        size.width * 0.3,
        size.height,
      );

    // Draw dashed
    const dashLength = 8.0;
    const gapLength = 6.0;
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      var distance = 0.0;
      while (distance < metric.length) {
        final end = (distance + dashLength).clamp(0.0, metric.length);
        final extracted = metric.extractPath(distance, end);
        canvas.drawPath(extracted, paint);
        distance += dashLength + gapLength;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Transparent top bar with route name and connection status.
class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.routeName,
    required this.freshness,
    this.onLeaveRouteTap,
  });

  final String routeName;
  final LocationFreshness freshness;
  final VoidCallback? onLeaveRouteTap;

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
          Expanded(
            child: Text(
              routeName,
              style: const TextStyle(
                fontFamily: AmberTypographyTokens.headingFamily,
                fontWeight: FontWeight.w700,
                fontSize: 16,
                color: AmberColorTokens.ink900,
              ),
            ),
          ),
          AmberStatusChip(
            label: _freshnessLabel(freshness),
            tone: _freshnessTone(freshness),
            compact: true,
          ),
          if (onLeaveRouteTap != null) ...<Widget>[
            const SizedBox(width: AmberSpacingTokens.space8),
            IconButton(
              tooltip: 'Rota\'dan Ayril',
              onPressed: onLeaveRouteTap,
              icon: const Icon(AmberIconTokens.signOut),
            ),
          ],
        ],
      ),
    );
  }

  String _freshnessLabel(LocationFreshness freshness) {
    return switch (freshness) {
      LocationFreshness.live => 'Canli',
      LocationFreshness.mild => 'Gecikme',
      LocationFreshness.stale => 'Eski veri',
      LocationFreshness.lost => 'Baglanti yok',
    };
  }

  AmberStatusChipTone _freshnessTone(LocationFreshness freshness) {
    return switch (freshness) {
      LocationFreshness.live => AmberStatusChipTone.green,
      LocationFreshness.mild => AmberStatusChipTone.yellow,
      LocationFreshness.stale => AmberStatusChipTone.yellow,
      LocationFreshness.lost => AmberStatusChipTone.red,
    };
  }
}

/// Wraps PassengerMapSheet inside a DraggableScrollableSheet.
class _PassengerDraggableSheet extends StatelessWidget {
  const _PassengerDraggableSheet({
    required this.routeName,
    this.estimatedMinutes,
    this.etaSourceLabel,
    required this.freshness,
    this.lastSeenAgo,
    this.driverNote,
    required this.stops,
    required this.isLate,
    this.scheduledTime,
  });

  final String routeName;
  final int? estimatedMinutes;
  final String? etaSourceLabel;
  final LocationFreshness freshness;
  final String? lastSeenAgo;
  final String? driverNote;
  final List<PassengerStopInfo> stops;
  final bool isLate;
  final String? scheduledTime;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.35,
      minChildSize: 0.15,
      maxChildSize: 0.85,
      snap: true,
      snapSizes: const <double>[0.15, 0.35, 0.6, 0.85],
      builder: (context, scrollController) {
        return SingleChildScrollView(
          controller: scrollController,
          child: PassengerMapSheet(
            routeName: routeName,
            estimatedMinutes: estimatedMinutes,
            etaSourceLabel: etaSourceLabel,
            freshness: freshness,
            lastSeenAgo: lastSeenAgo,
            driverNote: driverNote,
            stops: stops,
            isLate: isLate,
            scheduledTime: scheduledTime,
          ),
        );
      },
    );
  }
}
