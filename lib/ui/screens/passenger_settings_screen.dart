import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class PassengerSettingsScreen extends StatefulWidget {
  const PassengerSettingsScreen({
    super.key,
    required this.routeId,
    this.routeName,
    this.initialPhone,
    this.initialShowPhoneToDriver = false,
    this.initialBoardingArea,
    this.initialNotificationTime = '07:00',
    this.initialVirtualStop,
    this.initialVirtualStopLabel,
    this.onSave,
  });

  final String routeId;
  final String? routeName;
  final String? initialPhone;
  final bool initialShowPhoneToDriver;
  final String? initialBoardingArea;
  final String initialNotificationTime;
  final PassengerVirtualStopInput? initialVirtualStop;
  final String? initialVirtualStopLabel;
  final Future<void> Function(PassengerSettingsFormInput input)? onSave;

  @override
  State<PassengerSettingsScreen> createState() =>
      _PassengerSettingsScreenState();
}

class _PassengerSettingsScreenState extends State<PassengerSettingsScreen> {
  late final TextEditingController _phoneController;
  late final TextEditingController _boardingAreaController;
  late final TextEditingController _notificationTimeController;
  late final TextEditingController _virtualStopLabelController;
  late final TextEditingController _virtualStopLatController;
  late final TextEditingController _virtualStopLngController;

  late bool _showPhoneToDriver;
  late bool _useVirtualStop;
  bool _submitting = false;
  String? _validationError;

  @override
  void initState() {
    super.initState();
    _showPhoneToDriver = widget.initialShowPhoneToDriver;
    _useVirtualStop = widget.initialVirtualStop != null;
    _phoneController = TextEditingController(text: widget.initialPhone ?? '');
    _boardingAreaController = TextEditingController(
      text: widget.initialBoardingArea ?? '',
    );
    _notificationTimeController = TextEditingController(
      text: widget.initialNotificationTime,
    );
    _virtualStopLabelController = TextEditingController(
      text: widget.initialVirtualStopLabel ?? '',
    );
    _virtualStopLatController = TextEditingController(
      text: widget.initialVirtualStop == null
          ? ''
          : widget.initialVirtualStop!.lat.toStringAsFixed(5),
    );
    _virtualStopLngController = TextEditingController(
      text: widget.initialVirtualStop == null
          ? ''
          : widget.initialVirtualStop!.lng.toStringAsFixed(5),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _boardingAreaController.dispose();
    _notificationTimeController.dispose();
    _virtualStopLabelController.dispose();
    _virtualStopLatController.dispose();
    _virtualStopLngController.dispose();
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
      await widget.onSave?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  PassengerSettingsFormInput? _buildInput() {
    final routeId = widget.routeId.trim();
    if (routeId.isEmpty) {
      _setValidation('Route ID zorunlu.');
      return null;
    }

    final phoneRaw = _phoneController.text.trim();
    final phone = phoneRaw.isEmpty ? null : phoneRaw;
    if (phone != null && phone.length < 7) {
      _setValidation('Telefon en az 7 karakter olmali.');
      return null;
    }

    final boardingArea = _boardingAreaController.text.trim();
    if (boardingArea.isEmpty) {
      _setValidation('Binis alani zorunlu.');
      return null;
    }

    final notificationTime = _notificationTimeController.text.trim();
    if (!_isValidTime(notificationTime)) {
      _setValidation('Bildirim saati HH:mm formatinda olmali.');
      return null;
    }

    PassengerVirtualStopInput? virtualStop;
    if (_useVirtualStop) {
      final lat = double.tryParse(_virtualStopLatController.text.trim());
      final lng = double.tryParse(_virtualStopLngController.text.trim());
      if (lat == null || lng == null) {
        _setValidation('Sanal durak koordinatlari sayisal olmali.');
        return null;
      }
      if (!_isWithinLatLng(lat, lng)) {
        _setValidation('Sanal durak koordinatlari gecerli aralikta olmali.');
        return null;
      }
      virtualStop = PassengerVirtualStopInput(lat: lat, lng: lng);
    }

    final virtualStopLabelRaw = _virtualStopLabelController.text.trim();
    final virtualStopLabel =
        virtualStopLabelRaw.isEmpty ? null : virtualStopLabelRaw;

    return PassengerSettingsFormInput(
      routeId: routeId,
      routeName: widget.routeName,
      phone: phone,
      showPhoneToDriver: _showPhoneToDriver,
      boardingArea: boardingArea,
      notificationTime: notificationTime,
      virtualStop: virtualStop,
      virtualStopLabel: virtualStopLabel,
    );
  }

  bool _isValidTime(String value) {
    return RegExp(r'^([01]\d|2[0-3]):[0-5]\d$').hasMatch(value);
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
      title: 'Yolcu Ayarlari',
      subtitle: 'Callable: updatePassengerSettings',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          if (widget.routeName != null && widget.routeName!.trim().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: AmberSpacingTokens.space8),
              child: Text(
                'Route: ${widget.routeName}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
          TextField(
            enabled: false,
            decoration: InputDecoration(
              labelText: 'Route ID',
              hintText: widget.routeId,
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          TextField(
            controller: _phoneController,
            enabled: !_submitting,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Telefon (opsiyonel)',
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _showPhoneToDriver,
            onChanged: _submitting
                ? null
                : (value) {
                    setState(() {
                      _showPhoneToDriver = value;
                    });
                  },
            title: const Text('Telefonumu sofor gorebilsin'),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          TextField(
            controller: _boardingAreaController,
            enabled: !_submitting,
            decoration: const InputDecoration(
              labelText: 'Binis Alani',
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          TextField(
            controller: _notificationTimeController,
            enabled: !_submitting,
            decoration: const InputDecoration(
              labelText: 'Bildirim Saati (HH:mm)',
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _useVirtualStop,
            onChanged: _submitting
                ? null
                : (value) {
                    setState(() {
                      _useVirtualStop = value;
                    });
                  },
            title: const Text('Sanal Durak kullan (opsiyonel)'),
            subtitle: const Text(
              'Sanal durak yoksa ETA Binis Alani/route baslangicina gore hesaplanir.',
            ),
          ),
          if (_useVirtualStop) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space8),
            TextField(
              controller: _virtualStopLabelController,
              enabled: !_submitting,
              decoration: const InputDecoration(
                labelText: 'Sanal Durak Etiketi (opsiyonel)',
              ),
            ),
            const SizedBox(height: AmberSpacingTokens.space8),
            Row(
              children: <Widget>[
                Expanded(
                  child: TextField(
                    controller: _virtualStopLatController,
                    enabled: !_submitting,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                      signed: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Sanal Durak Lat',
                    ),
                  ),
                ),
                const SizedBox(width: AmberSpacingTokens.space8),
                Expanded(
                  child: TextField(
                    controller: _virtualStopLngController,
                    enabled: !_submitting,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                      signed: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Sanal Durak Lng',
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (_validationError != null) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              _validationError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: AmberSpacingTokens.space20),
          AmberPrimaryButton(
            label: _submitting ? 'Isleniyor...' : 'Ayarlarimi Kaydet',
            onPressed: _submitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}

class PassengerSettingsFormInput {
  const PassengerSettingsFormInput({
    required this.routeId,
    required this.showPhoneToDriver,
    required this.boardingArea,
    required this.notificationTime,
    this.routeName,
    this.phone,
    this.virtualStop,
    this.virtualStopLabel,
  });

  final String routeId;
  final String? routeName;
  final String? phone;
  final bool showPhoneToDriver;
  final String boardingArea;
  final String notificationTime;
  final PassengerVirtualStopInput? virtualStop;
  final String? virtualStopLabel;
}

class PassengerVirtualStopInput {
  const PassengerVirtualStopInput({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}
