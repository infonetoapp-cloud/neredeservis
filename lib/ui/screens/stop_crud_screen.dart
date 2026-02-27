import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_spacing.dart';
import '../tokens/form_validation_tokens.dart';

class StopCrudScreen extends StatefulWidget {
  const StopCrudScreen({
    super.key,
    this.initialRouteId,
    this.onUpsert,
    Future<void> Function(StopDeleteFormInput input)? onDelete,
    Future<void> Function(StopueleteFormInput input)? onuelete,
  }) : onDelete = onDelete ?? onuelete;

  final String? initialRouteId;
  final Future<void> Function(StopUpsertFormInput input)? onUpsert;
  final Future<void> Function(StopDeleteFormInput input)? onDelete;

  @override
  State<StopCrudScreen> createState() => _StopCrudScreenState();
}

class _StopCrudScreenState extends State<StopCrudScreen> {
  final _routeIdController = TextEditingController();
  final _stopIdController = TextEditingController();
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _orderController = TextEditingController(text: '0');

  bool _submitting = false;
  String? _validationError;
  _NamedMapPoint? _selectedPoint;

  static const List<_NamedMapPoint> _stopPointPresets = <_NamedMapPoint>[
    _NamedMapPoint(
      title: 'Levent Metro',
      address: 'Levent Metro Istanbul',
      lat: 41.0827,
      lng: 29.0127,
    ),
    _NamedMapPoint(
      title: 'Mecidiyekoy',
      address: 'Mecidiyekoy Meydan Istanbul',
      lat: 41.0665,
      lng: 28.9929,
    ),
    _NamedMapPoint(
      title: 'Besiktas Iskele',
      address: 'Besiktas Iskele Istanbul',
      lat: 41.0424,
      lng: 29.0079,
    ),
    _NamedMapPoint(
      title: 'Kadikoy Rhtm',
      address: 'Kadikoy Rhtm Istanbul',
      lat: 40.9912,
      lng: 29.0253,
    ),
    _NamedMapPoint(
      title: 'Uskudar Sahil',
      address: 'Uskudar Sahil Istanbul',
      lat: 41.0261,
      lng: 29.0169,
    ),
  ];

  static const _NamedMapPoint _currentLocationApprox = _NamedMapPoint(
    title: 'Konumum',
    address: 'Konumum (yaklaşık)',
    lat: 41.0151,
    lng: 28.9795,
  );

  @override
  void initState() {
    super.initState();
    final initialRouteId = widget.initialRouteId?.trim();
    if (initialRouteId != null && initialRouteId.isNotEmpty) {
      _routeIdController.text = initialRouteId;
    }
  }

  @override
  void dispose() {
    _routeIdController.dispose();
    _stopIdController.dispose();
    _nameController.dispose();
    _addressController.dispose();
    _orderController.dispose();
    super.dispose();
  }

  Future<void> _submitUpsert() async {
    final input = _buildUpsertInput();
    if (input == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });

    try {
      await widget.onUpsert?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  Future<void> _submituelete() async {
    final input = _buildueleteInput();
    if (input == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });

    try {
      await widget.onDelete?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  StopUpsertFormInput? _buildUpsertInput() {
    final routeId = _routeIdController.text.trim();
    if (routeId.isEmpty) {
      _setValidation(CoreFormValidationTokens.routeIdRequired);
      return null;
    }

    final name = _nameController.text.trim();
    if (name.length < 2) {
      _setValidation(CoreFormValidationTokens.stopNameMin2);
      return null;
    }

    final address = _addressController.text.trim();
    if (address.length < 3) {
      _setValidation('Durak adresi en az 3 karakter olmalıdır.');
      return null;
    }

    final order = int.tryParse(_orderController.text.trim());
    if (order == null || order < 0 || order > 500) {
      _setValidation(CoreFormValidationTokens.stopOrderRange);
      return null;
    }

    final point = _resolveInputPoint(address, _selectedPoint);
    final stopId = _stopIdController.text.trim();
    return StopUpsertFormInput(
      routeId: routeId,
      stopId: stopId.isEmpty ? null : stopId,
      name: name,
      lat: point.lat,
      lng: point.lng,
      order: order,
    );
  }

  StopueleteFormInput? _buildueleteInput() {
    final routeId = _routeIdController.text.trim();
    final stopId = _stopIdController.text.trim();
    if (routeId.isEmpty) {
      _setValidation(CoreFormValidationTokens.routeIdRequiredForDelete);
      return null;
    }
    if (stopId.isEmpty) {
      _setValidation(CoreFormValidationTokens.stopIdRequiredForDelete);
      return null;
    }
    return StopueleteFormInput(routeId: routeId, stopId: stopId);
  }

  _NamedMapPoint _resolveInputPoint(String address, _NamedMapPoint? selected) {
    if (selected != null &&
        _normalizeAddress(selected.address) == _normalizeAddress(address)) {
      return selected;
    }
    final preset = _matchPresetByAddress(address);
    if (preset != null) {
      return preset;
    }
    return _derivePointFromAddress(address);
  }

  _NamedMapPoint? _matchPresetByAddress(String rawAddress) {
    final normalized = _normalizeAddress(rawAddress);
    if (normalized.isEmpty) {
      return null;
    }
    for (final preset in _stopPointPresets) {
      if (normalized.contains(_normalizeAddress(preset.title)) ||
          normalized.contains(_normalizeAddress(preset.address))) {
        return preset;
      }
    }
    return null;
  }

  _NamedMapPoint _derivePointFromAddress(String address) {
    final normalized = _normalizeAddress(address);
    var hash = 0;
    for (final unit in normalized.codeUnits) {
      hash = ((hash * 29) + unit) & 0x7fffffff;
    }
    final latOffset = ((hash % 1600) / 1600.0) * 0.1;
    final lngOffset = (((hash ~/ 1600) % 1600) / 1600.0) * 0.14;
    return _NamedMapPoint(
      title: 'Durak Noktası',
      address: address,
      lat: _clamp(40.98 + latOffset, -90, 90),
      lng: _clamp(28.95 + lngOffset, -180, 180),
    );
  }

  double _clamp(double value, double min, double max) {
    return math.max(min, math.min(max, value));
  }

  String _normalizeAddress(String value) {
    return value.toLowerCase().replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  void _setValidation(String message) {
    setState(() {
      _validationError = message;
    });
  }

  Future<void> _pickPoint() async {
    final picked = await _showPointPickerSheet();
    if (picked == null || !mounted) {
      return;
    }
    setState(() {
      _selectedPoint = picked;
      _addressController.text = picked.address;
      _validationError = null;
    });
  }

  void _setCurrentLocation() {
    setState(() {
      _selectedPoint = _currentLocationApprox;
      _addressController.text = _currentLocationApprox.address;
      _validationError = null;
    });
  }

  Future<_NamedMapPoint?> _showPointPickerSheet() {
    return showModalBottomSheet<_NamedMapPoint>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Text(
                  'Durak konumu seç',
                  style: Theme.of(sheetContext).textTheme.titleMedium,
                ),
              ),
              ListTile(
                leading: const Icon(Icons.my_location_rounded),
                title: const Text('Konumumdan al'),
                subtitle:
                    const Text('GPS bagli degilse yaklaşık konum kullanir.'),
                onTap: () => Navigator.of(sheetContext).pop(
                  _currentLocationApprox,
                ),
              ),
              for (final preset in _stopPointPresets)
                ListTile(
                  leading: const Icon(Icons.place_outlined),
                  title: Text(preset.title),
                  subtitle: Text(preset.address),
                  onTap: () => Navigator.of(sheetContext).pop(preset),
                ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return CoreScreenScaffold(
      title: 'Durakları Yönet',
      subtitle: 'Bu rotaya durak ekle, düzenle, sil',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const _FlowTipCard(
            title: 'uusuk surtunme',
            description:
                'Koordinat girmeden durak oluştur. Adres seç, sistem konumu otomatik ayarlasın.',
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _routeIdController,
            enabled: !_submitting,
            decoration: const InputDecoration(labelText: 'Rota Kodu (zorunlu)'),
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _stopIdController,
            enabled: !_submitting,
            decoration: const InputDecoration(
              labelText: 'Durak Kodu (düzenleme/silme için)',
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _nameController,
            enabled: !_submitting,
            decoration: const InputDecoration(labelText: 'Durak Adı'),
          ),
          const SizedBox(height: CoreSpacing.space12),
          DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: Theme.of(context).colorScheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  TextField(
                    controller: _addressController,
                    enabled: !_submitting,
                    decoration:
                        const InputDecoration(labelText: 'Durak Adresi'),
                  ),
                  const SizedBox(height: CoreSpacing.space8),
                  Wrap(
                    spacing: CoreSpacing.space8,
                    runSpacing: CoreSpacing.space8,
                    children: <Widget>[
                      OutlinedButton.icon(
                        onPressed: _submitting ? null : _pickPoint,
                        icon: const Icon(Icons.map_outlined, size: 18),
                        label: const Text('Haritadan Sec'),
                      ),
                      OutlinedButton.icon(
                        onPressed: _submitting ? null : _setCurrentLocation,
                        icon: const Icon(Icons.my_location_rounded, size: 18),
                        label: const Text('Konumumdan Al'),
                      ),
                    ],
                  ),
                  if (_selectedPoint != null) ...<Widget>[
                    const SizedBox(height: CoreSpacing.space8),
                    Text(
                      'Secili: ${_selectedPoint!.title}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _orderController,
            enabled: !_submitting,
            keyboardType: TextInputType.number,
            decoration:
                const InputDecoration(labelText: 'Durak Sırası (0-500)'),
          ),
          if (_validationError != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            Text(
              _validationError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: CoreSpacing.space20),
          CorePrimaryButton(
            label: _submitting ? 'İşleniyor...' : 'Durağı Kaydet / Güncelle',
            onPressed: _submitting ? null : _submitUpsert,
          ),
          const SizedBox(height: CoreSpacing.space8),
          CoreDangerButton(
            label: 'Durağı Sil',
            onPressed: _submitting ? null : _submituelete,
          ),
        ],
      ),
    );
  }
}

class _FlowTipCard extends StatelessWidget {
  const _FlowTipCard({
    required this.title,
    required this.description,
  });

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: CoreSpacing.space4),
            Text(description),
          ],
        ),
      ),
    );
  }
}

class _NamedMapPoint {
  const _NamedMapPoint({
    required this.title,
    required this.address,
    required this.lat,
    required this.lng,
  });

  final String title;
  final String address;
  final double lat;
  final double lng;
}

class StopUpsertFormInput {
  const StopUpsertFormInput({
    required this.routeId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
    this.stopId,
  });

  final String routeId;
  final String? stopId;
  final String name;
  final double lat;
  final double lng;
  final int order;
}

class StopueleteFormInput {
  const StopueleteFormInput({
    required this.routeId,
    required this.stopId,
  });

  final String routeId;
  final String stopId;
}

typedef StopDeleteFormInput = StopueleteFormInput;
