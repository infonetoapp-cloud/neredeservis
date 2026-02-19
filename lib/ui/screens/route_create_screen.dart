import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class RouteCreateScreen extends StatefulWidget {
  const RouteCreateScreen({
    super.key,
    this.onCreate,
    this.onCreateFromGhostDrive,
    this.onGhostDriveCaptureStart,
  });

  final Future<void> Function(RouteCreateFormInput input)? onCreate;
  final Future<void> Function(RouteCreateGhostFormInput input)?
      onCreateFromGhostDrive;
  final Future<bool> Function()? onGhostDriveCaptureStart;

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

  bool _isGhostRecording = false;
  bool _ghostPreviewVisible = false;
  final List<RouteTracePointInput> _ghostTracePoints = <RouteTracePointInput>[];
  List<RouteStopSuggestion> _ghostStopSuggestions = <RouteStopSuggestion>[];
  bool _ghostSuggestionsApproved = false;

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

  Future<void> _submitQuickPin() async {
    final input = _buildQuickPinInput();
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

  Future<void> _submitGhostDrive() async {
    final input = _buildGhostDriveInput();
    if (input == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });

    try {
      await widget.onCreateFromGhostDrive?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  RouteCreateFormInput? _buildQuickPinInput() {
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

  RouteCreateGhostFormInput? _buildGhostDriveInput() {
    final name = _nameController.text.trim();
    final scheduledTime = _scheduledTimeController.text.trim();
    if (name.length < 2) {
      _setValidation('Rota adi en az 2 karakter olmali.');
      return null;
    }
    if (!_isValidTime(scheduledTime)) {
      _setValidation('Saat HH:mm formatinda olmali.');
      return null;
    }
    if (_isGhostRecording) {
      _setValidation('Kaydi once bitirmen gerekiyor.');
      return null;
    }
    if (_ghostTracePoints.length < 2) {
      _setValidation('Ghost Drive icin en az 2 nokta kaydedilmeli.');
      return null;
    }
    if (!_ghostSuggestionsApproved) {
      _setValidation(
          'Kayit oncesi baslangic/bitis ve durak onerilerini onayla.');
      return null;
    }

    return RouteCreateGhostFormInput(
      name: name,
      tracePoints: List<RouteTracePointInput>.from(_ghostTracePoints),
      scheduledTime: scheduledTime,
      timeSlot: _selectedTimeSlot,
      allowGuestTracking: _allowGuestTracking,
    );
  }

  Future<void> _startGhostCapture() async {
    if (_isGhostRecording) {
      return;
    }
    if (widget.onGhostDriveCaptureStart != null) {
      final canStart = await widget.onGhostDriveCaptureStart!.call();
      if (!mounted || !canStart) {
        return;
      }
    }
    final startLat = _parseOrDefault(_startLatController.text, 40.7700);
    final startLng = _parseOrDefault(_startLngController.text, 29.4000);
    setState(() {
      _ghostTracePoints
        ..clear()
        ..add(
          RouteTracePointInput(
            lat: startLat,
            lng: startLng,
            accuracy: 12,
            sampledAtMs: DateTime.now().millisecondsSinceEpoch,
          ),
        );
      _ghostPreviewVisible = false;
      _ghostStopSuggestions = <RouteStopSuggestion>[];
      _ghostSuggestionsApproved = false;
      _validationError = null;
      _isGhostRecording = true;
    });
  }

  void _stopGhostCapture() {
    if (!_isGhostRecording) {
      return;
    }
    final endLat = _parseOrDefault(_endLatController.text, 40.9700);
    final endLng = _parseOrDefault(_endLngController.text, 29.2000);
    setState(() {
      _ghostTracePoints.add(
        RouteTracePointInput(
          lat: endLat,
          lng: endLng,
          accuracy: 15,
          sampledAtMs: DateTime.now().millisecondsSinceEpoch,
        ),
      );
      _ghostStopSuggestions = _deriveGhostStopSuggestions(_ghostTracePoints);
      _isGhostRecording = false;
      _validationError = null;
    });
  }

  void _toggleGhostPreview() {
    setState(() {
      _ghostPreviewVisible = !_ghostPreviewVisible;
      _validationError = null;
    });
  }

  double _parseOrDefault(String raw, double fallback) {
    return double.tryParse(raw.trim()) ?? fallback;
  }

  List<RouteStopSuggestion> _deriveGhostStopSuggestions(
    List<RouteTracePointInput> points,
  ) {
    if (points.length < 2) {
      return const <RouteStopSuggestion>[];
    }
    final suggestions = <RouteStopSuggestion>[];
    if (points.length >= 3) {
      final middlePoint = points[(points.length / 2).floor()];
      suggestions.add(
        RouteStopSuggestion(
          label: 'Durak Adayi 1',
          lat: middlePoint.lat,
          lng: middlePoint.lng,
        ),
      );
    } else {
      final start = points.first;
      final end = points.last;
      suggestions.add(
        RouteStopSuggestion(
          label: 'Durak Adayi 1',
          lat: (start.lat + end.lat) / 2,
          lng: (start.lng + end.lng) / 2,
        ),
      );
    }
    return suggestions;
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
      subtitle: 'Callable: createRoute / createRouteFromGhostDrive',
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
            ..._buildGhostDriveForm(),
          if (_validationError != null) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              _validationError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: AmberSpacingTokens.space20),
          AmberPrimaryButton(
            label: _submitting
                ? 'Isleniyor...'
                : _mode == RouteCreateMode.quickPin
                    ? 'Rotayi Olustur'
                    : 'Ghost Drive Ile Kaydet',
            onPressed: _submitting
                ? null
                : _mode == RouteCreateMode.quickPin
                    ? _submitQuickPin
                    : _submitGhostDrive,
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

  List<Widget> _buildGhostDriveForm() {
    return <Widget>[
      TextField(
        controller: _nameController,
        enabled: !_submitting,
        decoration: const InputDecoration(labelText: 'Rota Adi'),
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
      const SizedBox(height: AmberSpacingTokens.space8),
      DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Padding(
          padding: EdgeInsets.all(12),
          child: Text(
            'Ghost Drive kaydinda adimlar: kaydi baslat, kaydi bitir, onizle, kaydet.',
          ),
        ),
      ),
      const SizedBox(height: AmberSpacingTokens.space12),
      AmberSecondaryButton(
        label: _isGhostRecording ? 'Kayit Suruyor' : 'Kaydi Baslat',
        onPressed: _submitting || _isGhostRecording
            ? null
            : () => _startGhostCapture(),
      ),
      const SizedBox(height: AmberSpacingTokens.space8),
      AmberSecondaryButton(
        label: 'Kaydi Bitir',
        onPressed: _submitting || !_isGhostRecording ? null : _stopGhostCapture,
      ),
      const SizedBox(height: AmberSpacingTokens.space8),
      AmberSecondaryButton(
        label: _ghostPreviewVisible ? 'Onizlemeyi Gizle' : 'Onizleme',
        onPressed: _submitting ? null : _toggleGhostPreview,
      ),
      if (_ghostPreviewVisible) ...<Widget>[
        const SizedBox(height: AmberSpacingTokens.space8),
        _GhostDrivePreview(
          points: _ghostTracePoints,
          suggestions: _ghostStopSuggestions,
        ),
        const SizedBox(height: AmberSpacingTokens.space8),
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          value: _ghostSuggestionsApproved,
          onChanged: _submitting
              ? null
              : (value) {
                  setState(() {
                    _ghostSuggestionsApproved = value;
                    _validationError = null;
                  });
                },
          title: const Text(
              'Otomatik baslangic/bitis ve durak onerilerini onayliyorum'),
          subtitle: const Text('Onay olmadan Ghost Drive kaydi tamamlanmaz.'),
        ),
      ],
    ];
  }
}

class _GhostDrivePreview extends StatelessWidget {
  const _GhostDrivePreview({
    required this.points,
    required this.suggestions,
  });

  final List<RouteTracePointInput> points;
  final List<RouteStopSuggestion> suggestions;

  @override
  Widget build(BuildContext context) {
    final first = points.isEmpty ? null : points.first;
    final last = points.isEmpty ? null : points.last;
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Kayitli nokta: ${points.length}'),
            if (first != null)
              Text(
                'Baslangic: ${first.lat.toStringAsFixed(5)}, '
                '${first.lng.toStringAsFixed(5)}',
              ),
            if (last != null)
              Text(
                'Bitis: ${last.lat.toStringAsFixed(5)}, '
                '${last.lng.toStringAsFixed(5)}',
              ),
            if (suggestions.isNotEmpty) ...<Widget>[
              const SizedBox(height: 8),
              const Text('Durak adaylari:'),
              for (final suggestion in suggestions)
                Text(
                  '- ${suggestion.label}: '
                  '${suggestion.lat.toStringAsFixed(5)}, '
                  '${suggestion.lng.toStringAsFixed(5)}',
                ),
            ],
          ],
        ),
      ),
    );
  }
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

class RouteCreateGhostFormInput {
  const RouteCreateGhostFormInput({
    required this.name,
    required this.tracePoints,
    required this.scheduledTime,
    required this.timeSlot,
    required this.allowGuestTracking,
  });

  final String name;
  final List<RouteTracePointInput> tracePoints;
  final String scheduledTime;
  final String timeSlot;
  final bool allowGuestTracking;
}

class RouteTracePointInput {
  const RouteTracePointInput({
    required this.lat,
    required this.lng,
    required this.accuracy,
    required this.sampledAtMs,
  });

  final double lat;
  final double lng;
  final double accuracy;
  final int sampledAtMs;
}

class RouteStopSuggestion {
  const RouteStopSuggestion({
    required this.label,
    required this.lat,
    required this.lng,
  });

  final String label;
  final double lat;
  final double lng;
}

enum RouteCreateMode {
  quickPin,
  ghostDrive,
}
