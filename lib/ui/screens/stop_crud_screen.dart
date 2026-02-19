import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class StopCrudScreen extends StatefulWidget {
  const StopCrudScreen({
    super.key,
    this.onUpsert,
    this.onDelete,
  });

  final Future<void> Function(StopUpsertFormInput input)? onUpsert;
  final Future<void> Function(StopDeleteFormInput input)? onDelete;

  @override
  State<StopCrudScreen> createState() => _StopCrudScreenState();
}

class _StopCrudScreenState extends State<StopCrudScreen> {
  final _routeIdController = TextEditingController();
  final _stopIdController = TextEditingController();
  final _nameController = TextEditingController();
  final _latController = TextEditingController();
  final _lngController = TextEditingController();
  final _orderController = TextEditingController(text: '0');

  bool _submitting = false;
  String? _validationError;

  @override
  void dispose() {
    _routeIdController.dispose();
    _stopIdController.dispose();
    _nameController.dispose();
    _latController.dispose();
    _lngController.dispose();
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

  Future<void> _submitDelete() async {
    final input = _buildDeleteInput();
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
      _setValidation('Route ID zorunlu.');
      return null;
    }

    final name = _nameController.text.trim();
    if (name.length < 2) {
      _setValidation('Durak adi en az 2 karakter olmali.');
      return null;
    }

    final lat = double.tryParse(_latController.text.trim());
    final lng = double.tryParse(_lngController.text.trim());
    if (lat == null || lng == null) {
      _setValidation('Durak koordinatlari sayisal olmali.');
      return null;
    }
    if (!_isWithinLatLng(lat, lng)) {
      _setValidation('Durak koordinatlari gecerli aralikta olmali.');
      return null;
    }

    final order = int.tryParse(_orderController.text.trim());
    if (order == null || order < 0 || order > 500) {
      _setValidation('Durak sirasi 0-500 araliginda tam sayi olmali.');
      return null;
    }

    final stopId = _stopIdController.text.trim();
    return StopUpsertFormInput(
      routeId: routeId,
      stopId: stopId.isEmpty ? null : stopId,
      name: name,
      lat: lat,
      lng: lng,
      order: order,
    );
  }

  StopDeleteFormInput? _buildDeleteInput() {
    final routeId = _routeIdController.text.trim();
    final stopId = _stopIdController.text.trim();
    if (routeId.isEmpty) {
      _setValidation('Silme icin Route ID zorunlu.');
      return null;
    }
    if (stopId.isEmpty) {
      _setValidation('Silme icin Stop ID zorunlu.');
      return null;
    }
    return StopDeleteFormInput(routeId: routeId, stopId: stopId);
  }

  bool _isWithinLatLng(double lat, double lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  void _setValidation(String message) {
    setState(() {
      _validationError = message;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: 'Durak CRUD',
      subtitle: 'Callable: upsertStop / deleteStop',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          TextField(
            controller: _routeIdController,
            enabled: !_submitting,
            decoration: const InputDecoration(labelText: 'Route ID (zorunlu)'),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _stopIdController,
            enabled: !_submitting,
            decoration: const InputDecoration(
              labelText: 'Stop ID (upsert icin opsiyonel, silme icin zorunlu)',
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _nameController,
            enabled: !_submitting,
            decoration: const InputDecoration(labelText: 'Durak Adi'),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          Row(
            children: <Widget>[
              Expanded(
                child: TextField(
                  controller: _latController,
                  enabled: !_submitting,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                    signed: true,
                  ),
                  decoration: const InputDecoration(labelText: 'Lat'),
                ),
              ),
              const SizedBox(width: AmberSpacingTokens.space8),
              Expanded(
                child: TextField(
                  controller: _lngController,
                  enabled: !_submitting,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                    signed: true,
                  ),
                  decoration: const InputDecoration(labelText: 'Lng'),
                ),
              ),
            ],
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _orderController,
            enabled: !_submitting,
            keyboardType: TextInputType.number,
            decoration:
                const InputDecoration(labelText: 'Durak Sirasi (0-500)'),
          ),
          if (_validationError != null) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              _validationError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: AmberSpacingTokens.space20),
          AmberPrimaryButton(
            label: _submitting ? 'Isleniyor...' : 'Duragi Kaydet / Guncelle',
            onPressed: _submitting ? null : _submitUpsert,
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          AmberDangerButton(
            label: 'Duragi Sil',
            onPressed: _submitting ? null : _submitDelete,
          ),
        ],
      ),
    );
  }
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

class StopDeleteFormInput {
  const StopDeleteFormInput({
    required this.routeId,
    required this.stopId,
  });

  final String routeId;
  final String stopId;
}
