import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class RouteUpdateScreen extends StatefulWidget {
  const RouteUpdateScreen({
    super.key,
    this.onSubmit,
  });

  final Future<void> Function(RouteUpdateFormInput input)? onSubmit;

  @override
  State<RouteUpdateScreen> createState() => _RouteUpdateScreenState();
}

class _RouteUpdateScreenState extends State<RouteUpdateScreen> {
  final _routeIdController = TextEditingController();
  final _nameController = TextEditingController();
  final _startAddressController = TextEditingController();
  final _startLatController = TextEditingController();
  final _startLngController = TextEditingController();
  final _endAddressController = TextEditingController();
  final _endLatController = TextEditingController();
  final _endLngController = TextEditingController();
  final _scheduledTimeController = TextEditingController();
  final _authorizedDriverIdsController = TextEditingController();
  final _vacationUntilController = TextEditingController();

  bool _submitting = false;
  String? _validationError;
  String _timeSlot = '';
  _OptionalBool _allowGuestTracking = _OptionalBool.noChange;
  _OptionalBool _isArchived = _OptionalBool.noChange;
  bool _clearVacationUntil = false;

  @override
  void dispose() {
    _routeIdController.dispose();
    _nameController.dispose();
    _startAddressController.dispose();
    _startLatController.dispose();
    _startLngController.dispose();
    _endAddressController.dispose();
    _endLatController.dispose();
    _endLngController.dispose();
    _scheduledTimeController.dispose();
    _authorizedDriverIdsController.dispose();
    _vacationUntilController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final input = _buildInput();
    if (input == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });

    try {
      await widget.onSubmit?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  RouteUpdateFormInput? _buildInput() {
    final routeId = _routeIdController.text.trim();
    if (routeId.isEmpty) {
      _setValidation('Route ID zorunlu.');
      return null;
    }

    final name = _optionalText(_nameController.text);
    if (name != null && name.length < 2) {
      _setValidation('Rota adi en az 2 karakter olmali.');
      return null;
    }

    final startAddress = _optionalText(_startAddressController.text);
    if (startAddress != null && startAddress.length < 3) {
      _setValidation('Baslangic adresi en az 3 karakter olmali.');
      return null;
    }

    final endAddress = _optionalText(_endAddressController.text);
    if (endAddress != null && endAddress.length < 3) {
      _setValidation('Bitis adresi en az 3 karakter olmali.');
      return null;
    }

    final scheduledTime = _optionalText(_scheduledTimeController.text);
    if (scheduledTime != null && !_isValidTime(scheduledTime)) {
      _setValidation('Saat HH:mm formatinda olmali.');
      return null;
    }

    final startPoint = _parseOptionalPoint(
      latRaw: _startLatController.text,
      lngRaw: _startLngController.text,
      fieldLabel: 'Baslangic',
    );
    if (startPoint == null && _validationError != null) {
      return null;
    }

    final endPoint = _parseOptionalPoint(
      latRaw: _endLatController.text,
      lngRaw: _endLngController.text,
      fieldLabel: 'Bitis',
    );
    if (endPoint == null && _validationError != null) {
      return null;
    }

    final authorizedDriverIdsRaw =
        _optionalText(_authorizedDriverIdsController.text);
    final authorizedDriverIds = authorizedDriverIdsRaw
        ?.split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);

    String? vacationUntil;
    if (_clearVacationUntil) {
      vacationUntil = null;
    } else {
      final vacationRaw = _optionalText(_vacationUntilController.text);
      if (vacationRaw != null) {
        final parsedVacation = DateTime.tryParse(vacationRaw);
        if (parsedVacation == null) {
          _setValidation('Tatil bitis tarihi ISO-8601 formatinda olmali.');
          return null;
        }
        vacationUntil = parsedVacation.toUtc().toIso8601String();
      }
    }

    final timeSlot = _timeSlot.isEmpty ? null : _timeSlot;
    final allowGuestTracking = _allowGuestTracking.asNullableBool;
    final isArchived = _isArchived.asNullableBool;

    final hasAnyPatch = name != null ||
        startAddress != null ||
        startPoint != null ||
        endAddress != null ||
        endPoint != null ||
        scheduledTime != null ||
        timeSlot != null ||
        allowGuestTracking != null ||
        isArchived != null ||
        authorizedDriverIdsRaw != null ||
        _clearVacationUntil ||
        vacationUntil != null;

    if (!hasAnyPatch) {
      _setValidation('En az bir alan guncellenmeli.');
      return null;
    }

    return RouteUpdateFormInput(
      routeId: routeId,
      name: name,
      startPoint: startPoint,
      startAddress: startAddress,
      endPoint: endPoint,
      endAddress: endAddress,
      scheduledTime: scheduledTime,
      timeSlot: timeSlot,
      allowGuestTracking: allowGuestTracking,
      authorizedDriverIds: authorizedDriverIds,
      isArchived: isArchived,
      clearVacationUntil: _clearVacationUntil,
      vacationUntil: vacationUntil,
    );
  }

  RoutePointInput? _parseOptionalPoint({
    required String latRaw,
    required String lngRaw,
    required String fieldLabel,
  }) {
    final latText = latRaw.trim();
    final lngText = lngRaw.trim();
    if (latText.isEmpty && lngText.isEmpty) {
      return null;
    }
    if (latText.isEmpty || lngText.isEmpty) {
      _setValidation('$fieldLabel koordinatlari birlikte girilmeli.');
      return null;
    }

    final lat = double.tryParse(latText);
    final lng = double.tryParse(lngText);
    if (lat == null || lng == null) {
      _setValidation('$fieldLabel koordinatlari sayisal olmali.');
      return null;
    }
    if (!_isWithinLatLng(lat, lng)) {
      _setValidation('$fieldLabel koordinatlari gecerli aralikta olmali.');
      return null;
    }

    return RoutePointInput(lat: lat, lng: lng);
  }

  bool _isValidTime(String value) {
    final matcher = RegExp(r'^([01]\d|2[0-3]):[0-5]\d$');
    return matcher.hasMatch(value);
  }

  bool _isWithinLatLng(double lat, double lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  String? _optionalText(String raw) {
    final trimmed = raw.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  void _setValidation(String message) {
    setState(() {
      _validationError = message;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: 'Route Guncelle',
      subtitle: 'Callable: updateRoute',
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
            controller: _nameController,
            enabled: !_submitting,
            decoration:
                const InputDecoration(labelText: 'Rota Adi (opsiyonel)'),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _startAddressController,
            enabled: !_submitting,
            decoration: const InputDecoration(
                labelText: 'Baslangic Adresi (opsiyonel)'),
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
                  decoration: const InputDecoration(
                    labelText: 'Baslangic Lat',
                  ),
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
                  decoration: const InputDecoration(
                    labelText: 'Baslangic Lng',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _endAddressController,
            enabled: !_submitting,
            decoration:
                const InputDecoration(labelText: 'Bitis Adresi (opsiyonel)'),
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
            decoration:
                const InputDecoration(labelText: 'Saat (HH:mm, opsiyonel)'),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          DropdownButtonFormField<String>(
            initialValue: _timeSlot,
            items: const <DropdownMenuItem<String>>[
              DropdownMenuItem(
                  value: '', child: Text('Zaman dilimi degistirme')),
              DropdownMenuItem(value: 'morning', child: Text('Sabah')),
              DropdownMenuItem(value: 'midday', child: Text('Oglen')),
              DropdownMenuItem(value: 'evening', child: Text('Aksam')),
              DropdownMenuItem(value: 'custom', child: Text('Ozel')),
            ],
            onChanged: _submitting
                ? null
                : (value) {
                    setState(() {
                      _timeSlot = value ?? '';
                    });
                  },
            decoration: const InputDecoration(labelText: 'Zaman Dilimi'),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          DropdownButtonFormField<_OptionalBool>(
            initialValue: _allowGuestTracking,
            items: _OptionalBool.values
                .map(
                  (value) => DropdownMenuItem<_OptionalBool>(
                    value: value,
                    child: Text(value.allowGuestTrackingLabel),
                  ),
                )
                .toList(growable: false),
            onChanged: _submitting
                ? null
                : (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _allowGuestTracking = value;
                    });
                  },
            decoration: const InputDecoration(labelText: 'Misafir Takip Izni'),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          DropdownButtonFormField<_OptionalBool>(
            initialValue: _isArchived,
            items: _OptionalBool.values
                .map(
                  (value) => DropdownMenuItem<_OptionalBool>(
                    value: value,
                    child: Text(value.archiveStateLabel),
                  ),
                )
                .toList(growable: false),
            onChanged: _submitting
                ? null
                : (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _isArchived = value;
                    });
                  },
            decoration: const InputDecoration(labelText: 'Arsiv Durumu'),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _authorizedDriverIdsController,
            enabled: !_submitting,
            decoration: const InputDecoration(
              labelText: 'Yetkili sofor UID listesi (virgullu, opsiyonel)',
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _vacationUntilController,
            enabled: !_submitting && !_clearVacationUntil,
            decoration: const InputDecoration(
              labelText: 'Tatil bitisi ISO-8601 (opsiyonel)',
            ),
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _clearVacationUntil,
            onChanged: _submitting
                ? null
                : (value) {
                    setState(() {
                      _clearVacationUntil = value;
                    });
                  },
            title: const Text('Tatil bitisini temizle'),
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
            label: _submitting ? 'Isleniyor...' : 'Guncellemeyi Kaydet',
            onPressed: _submitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}

class RouteUpdateFormInput {
  const RouteUpdateFormInput({
    required this.routeId,
    this.name,
    this.startPoint,
    this.startAddress,
    this.endPoint,
    this.endAddress,
    this.scheduledTime,
    this.timeSlot,
    this.allowGuestTracking,
    this.authorizedDriverIds,
    this.isArchived,
    this.vacationUntil,
    this.clearVacationUntil = false,
  });

  final String routeId;
  final String? name;
  final RoutePointInput? startPoint;
  final String? startAddress;
  final RoutePointInput? endPoint;
  final String? endAddress;
  final String? scheduledTime;
  final String? timeSlot;
  final bool? allowGuestTracking;
  final List<String>? authorizedDriverIds;
  final bool? isArchived;
  final String? vacationUntil;
  final bool clearVacationUntil;
}

class RoutePointInput {
  const RoutePointInput({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

enum _OptionalBool {
  noChange,
  yes,
  no;

  bool? get asNullableBool {
    return switch (this) {
      _OptionalBool.noChange => null,
      _OptionalBool.yes => true,
      _OptionalBool.no => false,
    };
  }

  String get allowGuestTrackingLabel {
    return switch (this) {
      _OptionalBool.noChange => 'Misafir izni degistirme',
      _OptionalBool.yes => 'Misafir takibini ac',
      _OptionalBool.no => 'Misafir takibini kapat',
    };
  }

  String get archiveStateLabel {
    return switch (this) {
      _OptionalBool.noChange => 'Arsiv durumunu degistirme',
      _OptionalBool.yes => 'Route arsivlensin',
      _OptionalBool.no => 'Route arsivden ciksin',
    };
  }
}
