import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;

import '../components/buttons/core_buttons.dart';
import '../components/buttons/core_slide_to_finish.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';
import '../tokens/icon_tokens.dart';
import 'driver_trips_models.dart';

class DriverTripDetailScreen extends StatefulWidget {
  const DriverTripDetailScreen({
    super.key,
    required this.loadData,
    this.googleMapsApiKey,
    this.onSendAnnouncementTap,
    this.onEditTripTap,
    this.onStartTripTap,
    this.onOpenNavigationTap,
  });

  final Future<DriverTripDetailData?> Function() loadData;
  final String? googleMapsApiKey;
  final ValueChanged<DriverTripDetailData>? onSendAnnouncementTap;
  final ValueChanged<DriverTripDetailData>? onEditTripTap;
  final ValueChanged<DriverTripDetailData>? onStartTripTap;
  final ValueChanged<DriverTripDetailData>? onOpenNavigationTap;

  @override
  State<DriverTripDetailScreen> createState() => _DriverTripDetailScreenState();
}

class _DriverTripDetailScreenState extends State<DriverTripDetailScreen> {
  bool _loading = true;
  String? _errorMessage;
  DriverTripDetailData? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final data = await widget.loadData();
      if (!mounted) {
        return;
      }
      setState(() {
        _data = data;
        if (data == null) {
          _errorMessage = 'Sefer detayi bulunamadi.';
        }
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Sefer detayi yuklenemedi.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF6F7F8),
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(CoreIconTokens.back),
          color: CoreColors.ink900,
          tooltip: 'Geri',
        ),
        title: const Text(
          'Sefer Detayi',
          style: TextStyle(
            fontFamily: CoreTypography.headingFamily,
            fontWeight: FontWeight.w700,
            fontSize: 22,
            color: CoreColors.ink900,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(
            CoreSpacing.space16,
            CoreSpacing.space12,
            CoreSpacing.space16,
            CoreSpacing.space20,
          ),
          children: <Widget>[
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_errorMessage != null)
              _DetailErrorCard(
                message: _errorMessage!,
                onRetryTap: _load,
              )
            else if (_data != null)
              _DriverTripDetailContent(
                data: _data!,
                googleMapsApiKey: widget.googleMapsApiKey,
                onSendAnnouncementTap: widget.onSendAnnouncementTap,
                onEditTripTap: widget.onEditTripTap,
                onStartTripTap: widget.onStartTripTap,
                onOpenNavigationTap: widget.onOpenNavigationTap,
              ),
          ],
        ),
      ),
    );
  }
}

class _DriverTripDetailContent extends StatelessWidget {
  const _DriverTripDetailContent({
    required this.data,
    this.googleMapsApiKey,
    this.onSendAnnouncementTap,
    this.onEditTripTap,
    this.onStartTripTap,
    this.onOpenNavigationTap,
  });

  final DriverTripDetailData data;
  final String? googleMapsApiKey;
  final ValueChanged<DriverTripDetailData>? onSendAnnouncementTap;
  final ValueChanged<DriverTripDetailData>? onEditTripTap;
  final ValueChanged<DriverTripDetailData>? onStartTripTap;
  final ValueChanged<DriverTripDetailData>? onOpenNavigationTap;

  @override
  Widget build(BuildContext context) {
    final tripTimeLabel = data.scheduledTimeLabel?.trim();
    final scheduleDistanceNote = _buildTripScheduleDistanceNote(tripTimeLabel);
    final metaRows = <Widget>[
      _DetailMetaTile(
        icon: Icons.route_rounded,
        label: 'Rota',
        value: data.routeName,
      ),
      _DetailMetaTile(
        icon: Icons.schedule_rounded,
        label: 'Planlanan Saat',
        value: (tripTimeLabel == null || tripTimeLabel.isEmpty)
            ? 'Belirtilmedi'
            : tripTimeLabel,
      ),
      _DetailMetaTile(
        icon: Icons.groups_rounded,
        label: 'Kayıtlı Personel',
        value: '${data.passengerCount} kişi',
      ),
      if ((data.srvCode ?? '').trim().isNotEmpty)
        _DetailMetaTile(
          icon: Icons.password_rounded,
          label: 'Katılım Kodu',
          value: data.srvCode!.trim(),
        ),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        _BirdsEyeMapCard(
          data: data,
          googleMapsApiKey: googleMapsApiKey,
        ),
        const SizedBox(height: CoreSpacing.space12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE4E7EA)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      data.routeName,
                      style: const TextStyle(
                        fontFamily: CoreTypography.headingFamily,
                        fontWeight: FontWeight.w700,
                        fontSize: 21,
                        color: CoreColors.ink900,
                      ),
                    ),
                  ),
                  _DetailStatusChip(status: data.status),
                ],
              ),
              const SizedBox(height: 12),
              ...metaRows,
              const Divider(height: 20),
              _AddressLine(label: 'Başlangıç', value: data.startAddress),
              const SizedBox(height: 6),
              _AddressLine(label: 'Bitiş', value: data.endAddress),
              if (scheduleDistanceNote != null) ...<Widget>[
                const SizedBox(height: 10),
                _InfoNoteCard(message: scheduleDistanceNote),
              ],
              const SizedBox(height: 14),
              if (onEditTripTap != null) ...<Widget>[
                CoreSecondaryButton(
                  label: 'Seferi Duzenle',
                  onPressed: () => onEditTripTap?.call(data),
                ),
                const SizedBox(height: 8),
              ],
              if (onOpenNavigationTap != null) ...<Widget>[
                CoreSecondaryButton(
                  label: 'Google Maps ile Navigasyon',
                  onPressed: () => onOpenNavigationTap?.call(data),
                ),
                const SizedBox(height: 8),
              ],
              if (onStartTripTap != null &&
                  data.status != DriverTripCardStatus.live) ...<Widget>[
                CoreSlideToFinish(
                  onConfirmed: () => onStartTripTap?.call(data),
                  label: 'Sefere baslamak icin kaydir',
                  completedLabel: 'Sefer başlatıliyor...',
                  tone: CoreSlideActionTone.primary,
                ),
                const SizedBox(height: 8),
              ],
              CorePrimaryButton(
                label: 'Bu Sefere Duyuru Gönder',
                onPressed: onSendAnnouncementTap == null
                    ? null
                    : () => onSendAnnouncementTap?.call(data),
              ),
              if ((data.srvCode ?? '').trim().isNotEmpty) ...<Widget>[
                const SizedBox(height: 8),
                CoreSecondaryButton(
                  label: 'Kod / QR Goster',
                  onPressed: () => _showSrvCodeQrDialog(
                    context,
                    srvCode: data.srvCode!.trim(),
                    routeName: data.routeName,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: CoreSpacing.space12),
        _StopsPanel(stops: data.stops),
        const SizedBox(height: CoreSpacing.space12),
        _PassengersPanel(passengers: data.passengers),
      ],
    );
  }
}

class _BirdsEyeMapCard extends StatelessWidget {
  const _BirdsEyeMapCard({
    required this.data,
    this.googleMapsApiKey,
  });

  final DriverTripDetailData data;
  final String? googleMapsApiKey;

  @override
  Widget build(BuildContext context) {
    final hasApiKey = googleMapsApiKey?.trim().isNotEmpty == true;
    final isMobile = !kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS);
    return Container(
      height: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFDCE1E6)),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: isMobile && hasApiKey
          ? _TripPreviewGoogleMap(data: data)
          : const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: <Color>[Color(0xFFE9EEF2), Color(0xFFD7E0E7)],
                ),
              ),
              child: Center(
                child: Text(
                  'Harita önizlemesi kullanilamiyor',
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w600,
                    color: CoreColors.ink700,
                  ),
                ),
              ),
            ),
    );
  }
}

class _TripPreviewGoogleMap extends StatefulWidget {
  const _TripPreviewGoogleMap({required this.data});

  final DriverTripDetailData data;

  @override
  State<_TripPreviewGoogleMap> createState() => _TripPreviewGoogleMapState();
}

class _TripPreviewGoogleMapState extends State<_TripPreviewGoogleMap> {
  gmaps.GoogleMapController? _controller;

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final points = <gmaps.LatLng>[
      gmaps.LatLng(data.startPoint.lat, data.startPoint.lng),
      ...data.stops.map((stop) => gmaps.LatLng(stop.point.lat, stop.point.lng)),
      gmaps.LatLng(data.endPoint.lat, data.endPoint.lng),
    ];
    final polylinePoints = _decodePolylineOrNull(data.routePolylineEncoded)
            ?.map(_toGmapsLatLng)
            .toList(growable: false) ??
        points;

    final markers = <gmaps.Marker>{
      gmaps.Marker(
        markerId: const gmaps.MarkerId('start'),
        position: points.first,
        infoWindow: const gmaps.InfoWindow(title: 'Başlangıç'),
        icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
          gmaps.BitmapDescriptor.hueGreen,
        ),
      ),
      gmaps.Marker(
        markerId: const gmaps.MarkerId('end'),
        position: points.last,
        infoWindow: const gmaps.InfoWindow(title: 'Bitiş'),
        icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
          gmaps.BitmapDescriptor.hueRed,
        ),
      ),
      ...data.stops.map(
        (stop) => gmaps.Marker(
          markerId: gmaps.MarkerId('stop_${stop.stopId}'),
          position: gmaps.LatLng(stop.point.lat, stop.point.lng),
          infoWindow: gmaps.InfoWindow(title: stop.name),
          icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
            gmaps.BitmapDescriptor.hueOrange,
          ),
        ),
      ),
    };

    return gmaps.GoogleMap(
      initialCameraPosition:
          gmaps.CameraPosition(target: points.first, zoom: 11),
      markers: markers,
      polylines: <gmaps.Polyline>{
        gmaps.Polyline(
          polylineId: const gmaps.PolylineId('route_preview'),
          points: polylinePoints,
          width: 5,
          color: const Color(0xFFF5A000),
        ),
      },
      zoomControlsEnabled: false,
      myLocationButtonEnabled: false,
      myLocationEnabled: false,
      mapToolbarEnabled: false,
      compassEnabled: false,
      onMapCreated: (controller) {
        _controller = controller;
        unawaited(_fitBounds(points));
      },
    );
  }

  Future<void> _fitBounds(List<gmaps.LatLng> points) async {
    final controller = _controller;
    if (controller == null || points.isEmpty) {
      return;
    }
    try {
      if (points.length == 1) {
        await controller.animateCamera(
          gmaps.CameraUpdate.newLatLngZoom(points.first, 13.5),
        );
        return;
      }
      final bounds = _buildBounds(points);
      await controller.animateCamera(
        gmaps.CameraUpdate.newLatLngBounds(bounds, 48),
      );
    } catch (_) {
      // GoogleMap channels are unavailable in widget tests.
    }
  }

  gmaps.LatLngBounds _buildBounds(List<gmaps.LatLng> points) {
    var minLat = points.first.latitude;
    var maxLat = points.first.latitude;
    var minLng = points.first.longitude;
    var maxLng = points.first.longitude;
    for (final point in points.skip(1)) {
      if (point.latitude < minLat) {
        minLat = point.latitude;
      }
      if (point.latitude > maxLat) {
        maxLat = point.latitude;
      }
      if (point.longitude < minLng) {
        minLng = point.longitude;
      }
      if (point.longitude > maxLng) {
        maxLng = point.longitude;
      }
    }
    if (minLat == maxLat) {
      minLat -= 0.0025;
      maxLat += 0.0025;
    }
    if (minLng == maxLng) {
      minLng -= 0.0025;
      maxLng += 0.0025;
    }
    return gmaps.LatLngBounds(
      southwest: gmaps.LatLng(minLat, minLng),
      northeast: gmaps.LatLng(maxLat, maxLng),
    );
  }
}

Future<void> _showSrvCodeQrDialog(
  BuildContext context, {
  required String srvCode,
  required String routeName,
}) async {
  final normalizedCode = srvCode.trim().toUpperCase();
  if (normalizedCode.isEmpty) {
    return;
  }
  await showDialog<void>(
    context: context,
    builder: (dialogContext) {
      final qrPayload = normalizedCode;
      final qrImageUrl =
          'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${Uri.encodeComponent(qrPayload)}';
      return AlertDialog(
        title: const Text('Katılım Kodu / QR'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              routeName,
              style: Theme.of(dialogContext).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            Center(
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE0E0E0)),
                ),
                child: Image.network(
                  qrImageUrl,
                  width: 180,
                  height: 180,
                  fit: BoxFit.contain,
                  loadingBuilder: (context, child, progress) {
                    if (progress == null) {
                      return child;
                    }
                    return const SizedBox(
                      width: 180,
                      height: 180,
                      child: Center(child: CircularProgressIndicator()),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return const SizedBox(
                      width: 180,
                      height: 180,
                      child: Center(
                        child: Text(
                          'QR gorseli yuklenemedi',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: CoreTypography.bodyFamily,
                            fontWeight: FontWeight.w600,
                            color: CoreColors.ink700,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Yolcu katılımi icin kod:',
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: CoreColors.ink700,
              ),
            ),
            const SizedBox(height: 6),
            SelectableText(
              normalizedCode,
              style: Theme.of(dialogContext).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ],
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: normalizedCode));
              if (!dialogContext.mounted) {
                return;
              }
              Navigator.of(dialogContext).pop();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('SRV kodu kopyalandi.')),
                );
              }
            },
            child: const Text('Kopyala'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Kapat'),
          ),
        ],
      );
    },
  );
}

List<_PolylinePoint>? _decodePolylineOrNull(String? encodedRaw) {
  final encoded = encodedRaw?.trim() ?? '';
  if (encoded.isEmpty) {
    return null;
  }
  try {
    final decoded = _decodePolyline1e5(encoded);
    return decoded.isEmpty ? null : decoded;
  } catch (_) {
    return null;
  }
}

gmaps.LatLng _toGmapsLatLng(_PolylinePoint point) =>
    gmaps.LatLng(point.lat, point.lng);

class _PolylinePoint {
  const _PolylinePoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

List<_PolylinePoint> _decodePolyline1e5(String encoded) {
  final points = <_PolylinePoint>[];
  var index = 0;
  var lat = 0;
  var lng = 0;

  while (index < encoded.length) {
    final latChunk = _decodePolylineChunk(encoded, index);
    if (latChunk == null) {
      break;
    }
    index = latChunk.nextIndex;
    lat += latChunk.delta;

    final lngChunk = _decodePolylineChunk(encoded, index);
    if (lngChunk == null) {
      break;
    }
    index = lngChunk.nextIndex;
    lng += lngChunk.delta;

    points.add(
      _PolylinePoint(
        lat: lat / 1e5,
        lng: lng / 1e5,
      ),
    );
  }

  return points;
}

_PolylineChunk? _decodePolylineChunk(String encoded, int startIndex) {
  var result = 0;
  var shift = 0;
  var index = startIndex;

  while (index < encoded.length) {
    final byte = encoded.codeUnitAt(index) - 63;
    result |= (byte & 0x1F) << shift;
    shift += 5;
    index++;
    if (byte < 0x20) {
      final delta = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      return _PolylineChunk(delta: delta, nextIndex: index);
    }
  }
  return null;
}

class _PolylineChunk {
  const _PolylineChunk({
    required this.delta,
    required this.nextIndex,
  });

  final int delta;
  final int nextIndex;
}

String? _buildTripScheduleDistanceNote(String? scheduledTimeLabel) {
  final normalized = scheduledTimeLabel?.trim() ?? '';
  if (normalized.isEmpty) {
    return null;
  }
  final match = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(normalized);
  if (match == null) {
    return null;
  }
  final hour = int.tryParse(match.group(1) ?? '');
  final minute = int.tryParse(match.group(2) ?? '');
  if (hour == null || minute == null) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  final now = DateTime.now();
  final scheduled = DateTime(now.year, now.month, now.day, hour, minute);
  final deltaMinutes = now.difference(scheduled).inMinutes;
  final absMinutes = deltaMinutes.abs();
  if (absMinutes < 120) {
    return null;
  }
  final hourPart = absMinutes ~/ 60;
  final minutePart = absMinutes % 60;
  final distanceLabel = minutePart == 0
      ? '$hourPart saat'
      : '$hourPart saat ${minutePart.toString().padLeft(2, '0')} dk';
  if (deltaMinutes < 0) {
    return 'Planlanan saate daha $distanceLabel var. Gerekirse yine sefer başlatılabilir.';
  }
  return 'Planlanan saat geçmiş ($distanceLabel). Şoför isterse yine sefer başlatabilir.';
}

class _InfoNoteCard extends StatelessWidget {
  const _InfoNoteCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F7F8),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E7EC)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Icon(
            Icons.info_outline_rounded,
            size: 18,
            color: CoreColors.ink700,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: CoreColors.ink700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailMetaTile extends StatelessWidget {
  const _DetailMetaTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: <Widget>[
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F4F7),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: CoreColors.ink900),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  label,
                  style: const TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: CoreColors.ink700,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: CoreColors.ink900,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AddressLine extends StatelessWidget {
  const _AddressLine({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        SizedBox(
          width: 72,
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: CoreColors.ink700,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value.trim().isEmpty ? '-' : value,
            style: const TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: CoreColors.ink900,
            ),
          ),
        ),
      ],
    );
  }
}

class _DetailStatusChip extends StatelessWidget {
  const _DetailStatusChip({required this.status});

  final DriverTripCardStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, background, foreground) = switch (status) {
      DriverTripCardStatus.live => (
          'CANLI',
          const Color(0xFF111111),
          const Color(0xFFFFB11A),
        ),
      DriverTripCardStatus.planned => (
          'PLANLI',
          const Color(0xFFF2F4F6),
          CoreColors.ink900,
        ),
      DriverTripCardStatus.completed => (
          'TAMAMLANDI',
          const Color(0xFFE9F7EC),
          const Color(0xFF138F3E),
        ),
      DriverTripCardStatus.canceled => (
          'IPTAL',
          const Color(0xFFFCEDEC),
          const Color(0xFFB42318),
        ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: CoreTypography.bodyFamily,
          fontWeight: FontWeight.w800,
          fontSize: 11,
          letterSpacing: 0.4,
          color: foreground,
        ),
      ),
    );
  }
}

class _StopsPanel extends StatelessWidget {
  const _StopsPanel({required this.stops});

  final List<DriverTripDetailStopItem> stops;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE4E7EA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Duraklar',
            style: TextStyle(
              fontFamily: CoreTypography.headingFamily,
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: CoreColors.ink900,
            ),
          ),
          const SizedBox(height: 10),
          if (stops.isEmpty)
            const Text(
              'Bu rota icin durak kaydi yok.',
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                color: CoreColors.ink700,
              ),
            )
          else
            ...stops.map(
              (stop) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: <Widget>[
                    Container(
                      width: 22,
                      height: 22,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF4DC),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${stop.order + 1}',
                        style: const TextStyle(
                          fontFamily: CoreTypography.bodyFamily,
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                          color: Color(0xFFB97100),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        stop.name,
                        style: const TextStyle(
                          fontFamily: CoreTypography.bodyFamily,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: CoreColors.ink900,
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

class _PassengersPanel extends StatelessWidget {
  const _PassengersPanel({required this.passengers});

  final List<DriverTripDetailPassengerItem> passengers;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE4E7EA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Kayıtlı Personeller',
            style: TextStyle(
              fontFamily: CoreTypography.headingFamily,
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: CoreColors.ink900,
            ),
          ),
          const SizedBox(height: 10),
          if (passengers.isEmpty)
            const Text(
              'Bu seferde görüntülenecek personel yok.',
              style: TextStyle(
                fontFamily: CoreTypography.bodyFamily,
                fontWeight: FontWeight.w600,
                color: CoreColors.ink700,
              ),
            )
          else
            ...passengers.map(
              (passenger) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: <Widget>[
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F4F7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        size: 18,
                        color: CoreColors.ink900,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            passenger.name,
                            style: const TextStyle(
                              fontFamily: CoreTypography.bodyFamily,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: CoreColors.ink900,
                            ),
                          ),
                          if (passenger.boardingArea != null &&
                              passenger.boardingArea!.trim().isNotEmpty)
                            Text(
                              passenger.boardingArea!,
                              style: const TextStyle(
                                fontFamily: CoreTypography.bodyFamily,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                                color: CoreColors.ink700,
                              ),
                            ),
                        ],
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

class _DetailErrorCard extends StatelessWidget {
  const _DetailErrorCard({
    required this.message,
    required this.onRetryTap,
  });

  final String message;
  final VoidCallback onRetryTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE4E7EA)),
      ),
      child: Column(
        children: <Widget>[
          Text(message),
          const SizedBox(height: 10),
          TextButton(onPressed: onRetryTap, child: const Text('Tekrar dene')),
        ],
      ),
    );
  }
}
