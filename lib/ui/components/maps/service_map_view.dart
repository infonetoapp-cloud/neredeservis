import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../config/map_tile_config.dart';
import '../../tokens/core_colors.dart';
import '../../tokens/core_typography.dart';

@immutable
class ServiceMapPoint {
  const ServiceMapPoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;

  LatLng toLatLng() => LatLng(lat, lng);

  bool get isValid =>
      lat.isFinite &&
      lng.isFinite &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is ServiceMapPoint && other.lat == lat && other.lng == lng;
  }

  @override
  int get hashCode => Object.hash(lat, lng);
}

enum ServiceMapMarkerTone {
  start,
  end,
  stop,
  vehicle,
  user,
  neutral,
}

@immutable
class ServiceMapMarkerData {
  const ServiceMapMarkerData({
    required this.id,
    required this.point,
    this.label,
    this.subtitle,
    this.icon = Icons.place_rounded,
    this.tone = ServiceMapMarkerTone.neutral,
    this.size = 40,
  });

  final String id;
  final ServiceMapPoint point;
  final String? label;
  final String? subtitle;
  final IconData icon;
  final ServiceMapMarkerTone tone;
  final double size;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is ServiceMapMarkerData &&
        other.id == id &&
        other.point == point &&
        other.label == label &&
        other.subtitle == subtitle &&
        other.icon == icon &&
        other.tone == tone &&
        other.size == size;
  }

  @override
  int get hashCode => Object.hash(
        id,
        point,
        label,
        subtitle,
        icon,
        tone,
        size,
      );
}

@immutable
class ServiceMapPolylineData {
  const ServiceMapPolylineData({
    required this.id,
    required this.points,
    this.color = const Color(0xFFF5A000),
    this.strokeWidth = 5,
  });

  final String id;
  final List<ServiceMapPoint> points;
  final Color color;
  final double strokeWidth;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is ServiceMapPolylineData &&
        other.id == id &&
        listEquals(other.points, points) &&
        other.color == color &&
        other.strokeWidth == strokeWidth;
  }

  @override
  int get hashCode => Object.hash(
        id,
        Object.hashAll(points),
        color,
        strokeWidth,
      );
}

class ServiceMapController {
  ServiceMapController() : _controller = MapController();

  final MapController _controller;
  final List<void Function(MapController)> _pendingOps =
      <void Function(MapController)>[];
  bool _attached = false;

  MapController get rawController => _controller;

  void attach() {
    _attached = true;
    if (_pendingOps.isEmpty) {
      return;
    }
    final pending = List<void Function(MapController)>.from(_pendingOps);
    _pendingOps.clear();
    for (final op in pending) {
      op(_controller);
    }
  }

  void fitPoints(
    Iterable<ServiceMapPoint> points, {
    EdgeInsets padding = const EdgeInsets.all(48),
    double maxZoom = 16.2,
    double minZoom = 5,
    double singlePointZoom = 14.8,
  }) {
    final validPoints = points
        .where((point) => point.isValid)
        .map((point) => point.toLatLng())
        .toList(growable: false);
    if (validPoints.isEmpty) {
      return;
    }
    _run((controller) {
      if (validPoints.length == 1) {
        controller.move(validPoints.first, singlePointZoom);
        return;
      }
      controller.fitCamera(
        CameraFit.coordinates(
          coordinates: validPoints,
          padding: padding,
          maxZoom: maxZoom,
          minZoom: minZoom,
        ),
      );
    });
  }

  void moveTo(
    ServiceMapPoint point, {
    double zoom = 15.2,
  }) {
    if (!point.isValid) {
      return;
    }
    _run((controller) => controller.move(point.toLatLng(), zoom));
  }

  void dispose() {
    _pendingOps.clear();
    _controller.dispose();
  }

  void _run(void Function(MapController controller) operation) {
    if (_attached) {
      operation(_controller);
      return;
    }
    _pendingOps.add(operation);
  }
}

class ServiceMapView extends StatefulWidget {
  const ServiceMapView({
    super.key,
    this.controller,
    required this.markers,
    this.polylines = const <ServiceMapPolylineData>[],
    this.fitPoints = const <ServiceMapPoint>[],
    this.fallbackCenter = const ServiceMapPoint(lat: 40.7731, lng: 29.3739),
    this.initialZoom = 11.4,
    this.minZoom = 5,
    this.maxZoom = 19,
    this.fitPadding = const EdgeInsets.all(48),
    this.backgroundColor = const Color(0xFFE5EBEF),
    this.autoFitOnDataChange = false,
    this.interactive = true,
    this.onMapReady,
  });

  final ServiceMapController? controller;
  final List<ServiceMapMarkerData> markers;
  final List<ServiceMapPolylineData> polylines;
  final List<ServiceMapPoint> fitPoints;
  final ServiceMapPoint fallbackCenter;
  final double initialZoom;
  final double minZoom;
  final double maxZoom;
  final EdgeInsets fitPadding;
  final Color backgroundColor;
  final bool autoFitOnDataChange;
  final bool interactive;
  final VoidCallback? onMapReady;

  @override
  State<ServiceMapView> createState() => _ServiceMapViewState();
}

class _ServiceMapViewState extends State<ServiceMapView> {
  late final ServiceMapController _ownedController;
  late ServiceMapController _controller;
  late bool _ownsController;

  @override
  void initState() {
    super.initState();
    _bindController();
  }

  @override
  void didUpdateWidget(covariant ServiceMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      if (_ownsController) {
        _ownedController.dispose();
      }
      _bindController();
    }

    if (!widget.autoFitOnDataChange) {
      return;
    }
    final fitChanged = !listEquals(oldWidget.fitPoints, widget.fitPoints);
    final markersChanged = !listEquals(oldWidget.markers, widget.markers);
    final polylinesChanged = !listEquals(oldWidget.polylines, widget.polylines);
    if (fitChanged || markersChanged || polylinesChanged) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) {
          return;
        }
        _controller.fitPoints(
          widget.fitPoints,
          padding: widget.fitPadding,
          maxZoom: widget.maxZoom,
          minZoom: widget.minZoom,
        );
      });
    }
  }

  @override
  void dispose() {
    if (_ownsController) {
      _ownedController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final validFitPoints = widget.fitPoints
        .where((point) => point.isValid)
        .map((point) => point.toLatLng())
        .toList(growable: false);
    final fallbackCenter = widget.fallbackCenter.isValid
        ? widget.fallbackCenter.toLatLng()
        : const LatLng(40.7731, 29.3739);
    final initialCenter =
        validFitPoints.isNotEmpty ? validFitPoints.first : fallbackCenter;
    final initialCameraFit = validFitPoints.length >= 2
        ? CameraFit.coordinates(
            coordinates: validFitPoints,
            padding: widget.fitPadding,
            maxZoom: widget.maxZoom,
            minZoom: widget.minZoom,
          )
        : null;

    return FlutterMap(
      mapController: _controller.rawController,
      options: MapOptions(
        initialCenter: initialCenter,
        initialZoom: widget.initialZoom,
        initialCameraFit: initialCameraFit,
        minZoom: widget.minZoom,
        maxZoom: widget.maxZoom,
        backgroundColor: widget.backgroundColor,
        interactionOptions: InteractionOptions(
          flags: widget.interactive
              ? InteractiveFlag.all & ~InteractiveFlag.rotate
              : InteractiveFlag.none,
        ),
        onMapReady: _handleMapReady,
      ),
      children: <Widget>[
        TileLayer(
          urlTemplate: MapTileConfig.urlTemplate,
          userAgentPackageName: MapTileConfig.userAgentPackageName,
          maxNativeZoom: MapTileConfig.maxZoom,
          maxZoom: MapTileConfig.maxZoom.toDouble(),
          subdomains:
              MapTileConfig.usesSubdomains ? MapTileConfig.subdomains : const <String>[],
        ),
        if (widget.polylines.isNotEmpty)
          PolylineLayer(
            polylines: widget.polylines
                .map(
                  (polyline) => Polyline(
                    points: polyline.points
                        .where((point) => point.isValid)
                        .map((point) => point.toLatLng())
                        .toList(growable: false),
                    color: polyline.color,
                    strokeWidth: polyline.strokeWidth,
                    borderStrokeWidth: 1.5,
                    borderColor: Colors.white.withValues(alpha: 0.85),
                  ),
                )
                .toList(growable: false),
          ),
        if (widget.markers.isNotEmpty)
          MarkerLayer(
            markers: widget.markers
                .where((marker) => marker.point.isValid)
                .map(_buildMarker)
                .toList(growable: false),
          ),
        RichAttributionWidget(
          popupInitialDisplayDuration: const Duration(seconds: 3),
          showFlutterMapAttribution: false,
          attributions: <SourceAttribution>[
            TextSourceAttribution(
              MapTileConfig.attribution,
              prependCopyright: false,
            ),
          ],
        ),
      ],
    );
  }

  void _bindController() {
    final providedController = widget.controller;
    if (providedController != null) {
      _controller = providedController;
      _ownsController = false;
      return;
    }
    _ownedController = ServiceMapController();
    _controller = _ownedController;
    _ownsController = true;
  }

  void _handleMapReady() {
    _controller.attach();
    if (widget.autoFitOnDataChange && widget.fitPoints.isNotEmpty) {
      scheduleMicrotask(() {
        _controller.fitPoints(
          widget.fitPoints,
          padding: widget.fitPadding,
          maxZoom: widget.maxZoom,
          minZoom: widget.minZoom,
        );
      });
    }
    widget.onMapReady?.call();
  }

  Marker _buildMarker(ServiceMapMarkerData marker) {
    final hasLabel = (marker.label ?? '').trim().isNotEmpty;
    return Marker(
      key: ValueKey<String>(marker.id),
      point: marker.point.toLatLng(),
      width: hasLabel ? 128 : 64,
      height: hasLabel ? marker.size + 32 : marker.size + 12,
      alignment: Alignment.topCenter,
      child: _ServiceMapMarkerPin(marker: marker),
    );
  }
}

class _ServiceMapMarkerPin extends StatelessWidget {
  const _ServiceMapMarkerPin({required this.marker});

  final ServiceMapMarkerData marker;

  @override
  Widget build(BuildContext context) {
    final label = marker.label?.trim();
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (label != null && label.isNotEmpty) ...<Widget>[
          Container(
            constraints: const BoxConstraints(maxWidth: 120),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xF7121212),
              borderRadius: BorderRadius.circular(999),
              boxShadow: const <BoxShadow>[
                BoxShadow(
                  color: Color(0x22000000),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w700,
                fontSize: 11,
                color: CoreColors.surface0,
              ),
            ),
          ),
          const SizedBox(height: 4),
        ],
        if (marker.tone == ServiceMapMarkerTone.user)
          _UserDotMarker(size: marker.size)
        else
          _PinMarker(marker: marker),
      ],
    );
  }
}

class _PinMarker extends StatelessWidget {
  const _PinMarker({required this.marker});

  final ServiceMapMarkerData marker;

  @override
  Widget build(BuildContext context) {
    final color = _toneColor(marker.tone);
    final iconSize = marker.size.clamp(28, 52).toDouble();
    return SizedBox(
      width: iconSize,
      height: iconSize + 10,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: <Widget>[
          Icon(
            Icons.location_pin,
            size: iconSize,
            color: color,
            shadows: const <Shadow>[
              Shadow(
                color: Color(0x22000000),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          Positioned(
            top: iconSize * 0.18,
            child: Container(
              width: iconSize * 0.42,
              height: iconSize * 0.42,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Icon(
                marker.icon,
                size: iconSize * 0.2,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _toneColor(ServiceMapMarkerTone tone) {
    switch (tone) {
      case ServiceMapMarkerTone.start:
        return const Color(0xFF2F9E44);
      case ServiceMapMarkerTone.end:
        return const Color(0xFFD94841);
      case ServiceMapMarkerTone.stop:
        return const Color(0xFFF08C00);
      case ServiceMapMarkerTone.vehicle:
        return const Color(0xFF1C7ED6);
      case ServiceMapMarkerTone.user:
        return const Color(0xFF1C7ED6);
      case ServiceMapMarkerTone.neutral:
        return const Color(0xFF34495E);
    }
  }
}

class _UserDotMarker extends StatelessWidget {
  const _UserDotMarker({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    final outerSize = size.clamp(18, 30).toDouble();
    return Container(
      width: outerSize,
      height: outerSize,
      decoration: const BoxDecoration(
        color: Color(0x331C7ED6),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Container(
        width: outerSize * 0.46,
        height: outerSize * 0.46,
        decoration: BoxDecoration(
          color: const Color(0xFF1C7ED6),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
        ),
      ),
    );
  }
}
