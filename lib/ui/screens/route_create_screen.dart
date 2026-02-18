import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class RouteCreateScreen extends StatefulWidget {
  const RouteCreateScreen({
    super.key,
    this.onCreate,
  });

  final Future<void> Function(RouteCreateFormInput input)? onCreate;

  @override
  State<RouteCreateScreen> createState() => _RouteCreateScreenState();
}

class _RouteCreateScreenState extends State<RouteCreateScreen> {
  final _nameController = TextEditingController();
  final _startAddressController = TextEditingController();
  final _startLatController = TextEditingController(text: '40.7700');
  final _startLngController = TextEditingController(text: '29.4000');
  final _endAddressController = TextEditingController();
  final _endLatController = TextEditingController(text: '40.9700');
  final _endLngController = TextEditingController(text: '29.2000');
  final _scheduledTimeController = TextEditingController(text: '07:00');

  RouteCreateMode _mode = RouteCreateMode.quickPin;
  String _selectedTimeSlot = 'morning';
  bool _allowGuestTracking = true;
  bool _submitting = false;
  String? _validationError;

  @override
  void dispose() {
    _nameController.dispose();
    _startAddressController.dispose();
    _startLatController.dispose();
    _startLngController.dispose();
    _endAddressController.dispose();
    _endLatController.dispose();
    _endLngController.dispose();
    _scheduledTimeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_mode == RouteCreateMode.ghostDrive) {
      _setValidation('Ghost Drive modu 307B adiminda acilacak.');
      return;
    }

    final input = _buildInput();
    if (input == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });

    try {
      await widget.onCreate?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  RouteCreateFormInput? _buildInput() {
    final name = _nameController.text.trim();
    final startAddress = _startAddressController.text.trim();
    final endAddress = _endAddressController.text.trim();
    final scheduledTime = _scheduledTimeController.text.trim();

    final startLat = double.tryParse(_startLatController.text.trim());
    final startLng = double.tryParse(_startLngController.text.trim());
    final endLat = double.tryParse(_endLatController.text.trim());
    final endLng = double.tryParse(_endLngController.text.trim());

    if (name.length < 2) {
      _setValidation('Rota adi en az 2 karakter olmali.');
      return null;
    }
    if (startAddress.length < 3 || endAddress.length < 3) {
      _setValidation('Baslangic ve bitis adresi en az 3 karakter olmali.');
      return null;
    }
    if (!_isValidTime(scheduledTime)) {
      _setValidation('Saat HH:mm formatinda olmali.');
      return null;
    }
    if (startLat == null ||
        startLng == null ||
        endLat == null ||
        endLng == null) {
      _setValidation('Tum koordinat alanlari sayisal olmali.');
      return null;
    }
    if (!_isWithinLatLng(startLat, startLng) ||
        !_isWithinLatLng(endLat, endLng)) {
      _setValidation('Koordinatlar gecerli aralikta olmali.');
      return null;
    }

    return RouteCreateFormInput(
      name: name,
      startAddress: startAddress,
      endAddress: endAddress,
      startLat: startLat,
      startLng: startLng,
      endLat: endLat,
      endLng: endLng,
      scheduledTime: scheduledTime,
      timeSlot: _selectedTimeSlot,
      allowGuestTracking: _allowGuestTracking,
    );
  }

  bool _isValidTime(String value) {
    final matcher = RegExp(r'^([01]\d|2[0-3]):[0-5]\d$');
    return matcher.hasMatch(value);
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
      title: 'Rota Olustur',
      subtitle: 'Callable: createRoute',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          SegmentedButton<RouteCreateMode>(
            segments: const <ButtonSegment<RouteCreateMode>>[
              ButtonSegment<RouteCreateMode>(
                value: RouteCreateMode.quickPin,
                label: Text('Hizli (pin)'),
              ),
              ButtonSegment<RouteCreateMode>(
                value: RouteCreateMode.ghostDrive,
                label: Text('Ghost Drive'),
              ),
            ],
            selected: <RouteCreateMode>{_mode},
            onSelectionChanged: _submitting
                ? null
                : (selection) {
                    setState(() {
                      _mode = selection.first;
                      _validationError = null;
                    });
                  },
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          if (_mode == RouteCreateMode.quickPin)
            ..._buildQuickPinForm()
          else
            _buildGhostDriveMode(),
          if (_validationError != null) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              _validationError!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
          ],
          const SizedBox(height: AmberSpacingTokens.space20),
          AmberPrimaryButton(
            label: _submitting
                ? 'Isleniyor...'
                : _mode == RouteCreateMode.quickPin
                    ? 'Rotayi Olustur'
                    : 'Ghost Drive Hazirla',
            onPressed: _submitting ? null : _submit,
          ),
        ],
      ),
    );
  }

  List<Widget> _buildQuickPinForm() {
    return <Widget>[
      TextField(
        controller: _nameController,
        enabled: !_submitting,
        decoration: const InputDecoration(labelText: 'Rota Adi'),
      ),
      const SizedBox(height: AmberSpacingTokens.space12),
      TextField(
        controller: _startAddressController,
        enabled: !_submitting,
        decoration: const InputDecoration(labelText: 'Baslangic Adresi'),
      ),
      const SizedBox(height: AmberSpacingTokens.space8),
      Row(
        children: <Widget>[
          Expanded(
            child: TextField(
              controller: _startLatController,
              enabled: !_submitting,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
                signed: true,
              ),
              decoration: const InputDecoration(labelText: 'Baslangic Lat'),
            ),
          ),
          const SizedBox(width: AmberSpacingTokens.space8),
          Expanded(
            child: TextField(
              controller: _startLngController,
              enabled: !_submitting,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
                signed: true,
              ),
              decoration: const InputDecoration(labelText: 'Baslangic Lng'),
            ),
          ),
        ],
      ),
      const SizedBox(height: AmberSpacingTokens.space12),
      TextField(
        controller: _endAddressController,
        enabled: !_submitting,
        decoration: const InputDecoration(labelText: 'Bitis Adresi'),
      ),
      const SizedBox(height: AmberSpacingTokens.space8),
      Row(
        children: <Widget>[
          Expanded(
            child: TextField(
              controller: _endLatController,
              enabled: !_submitting,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
                signed: true,
              ),
              decoration: const InputDecoration(labelText: 'Bitis Lat'),
            ),
          ),
          const SizedBox(width: AmberSpacingTokens.space8),
          Expanded(
            child: TextField(
              controller: _endLngController,
              enabled: !_submitting,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
                signed: true,
              ),
              decoration: const InputDecoration(labelText: 'Bitis Lng'),
            ),
          ),
        ],
      ),
      const SizedBox(height: AmberSpacingTokens.space12),
      TextField(
        controller: _scheduledTimeController,
        enabled: !_submitting,
        decoration: const InputDecoration(labelText: 'Planlanan Saat (HH:mm)'),
      ),
      const SizedBox(height: AmberSpacingTokens.space12),
      DropdownButtonFormField<String>(
        initialValue: _selectedTimeSlot,
        items: const <DropdownMenuItem<String>>[
          DropdownMenuItem(value: 'morning', child: Text('Sabah')),
          DropdownMenuItem(value: 'midday', child: Text('Oglen')),
          DropdownMenuItem(value: 'evening', child: Text('Aksam')),
          DropdownMenuItem(value: 'custom', child: Text('Ozel')),
        ],
        onChanged: _submitting
            ? null
            : (value) {
                if (value == null) {
                  return;
                }
                setState(() {
                  _selectedTimeSlot = value;
                });
              },
        decoration: const InputDecoration(labelText: 'Zaman Dilimi'),
      ),
      const SizedBox(height: AmberSpacingTokens.space8),
      SwitchListTile.adaptive(
        contentPadding: EdgeInsets.zero,
        value: _allowGuestTracking,
        onChanged: _submitting
            ? null
            : (value) {
                setState(() {
                  _allowGuestTracking = value;
                });
              },
        title: const Text('Misafir takip izni'),
        subtitle: const Text('Acil durumlarda misafir takip acik olabilir.'),
      ),
    ];
  }

  Widget _buildGhostDriveMode() {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Padding(
        padding: EdgeInsets.all(12),
        child: Text(
          'Ghost Drive modu ile rotayi surus sirasinda kaydedeceksin. '
          'Bu adimda sadece mod secimi acildi; capture adimlari 307B ile baglanacak.',
        ),
      ),
    );
  }
}

enum RouteCreateMode {
  quickPin,
  ghostDrive,
}

class RouteCreateFormInput {
  const RouteCreateFormInput({
    required this.name,
    required this.startAddress,
    required this.endAddress,
    required this.startLat,
    required this.startLng,
    required this.endLat,
    required this.endLng,
    required this.scheduledTime,
    required this.timeSlot,
    required this.allowGuestTracking,
  });

  final String name;
  final String startAddress;
  final String endAddress;
  final double startLat;
  final double startLng;
  final double endLat;
  final double endLng;
  final String scheduledTime;
  final String timeSlot;
  final bool allowGuestTracking;
}
