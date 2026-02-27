import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_spacing.dart';
import '../tokens/form_validation_tokens.dart';

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
    final onSave = widget.onSave;
    final input = _buildInput();
    if (input == null) {
      return;
    }
    if (onSave == null) {
      _setValidation('Ayarlar şu anda kaydedilemiyor. Lütfen tekrar deneyin.');
      return;
    }

    setState(() {
      _submitting = true;
      _validationError = null;
    });
    try {
      await onSave(input);
    } catch (error) {
      if (mounted) {
        _setValidation(_formatSaveErrorMessage(error));
      }
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
      _setValidation(CoreFormValidationTokens.routeIdRequired);
      return null;
    }

    final phoneRaw = _phoneController.text.trim();
    final phone = phoneRaw.isEmpty ? null : phoneRaw;
    if (phone != null && phone.length < 7) {
      _setValidation(CoreFormValidationTokens.phoneMin7);
      return null;
    }

    final boardingArea = _boardingAreaController.text.trim();
    if (boardingArea.isEmpty) {
      _setValidation(CoreFormValidationTokens.boardingAreaRequired);
      return null;
    }

    final notificationTime = _notificationTimeController.text.trim();
    if (!_isValidTime(notificationTime)) {
      _setValidation(CoreFormValidationTokens.notificationTimeFormat);
      return null;
    }

    PassengerVirtualStopInput? virtualStop;
    if (_useVirtualStop) {
      final lat = double.tryParse(_virtualStopLatController.text.trim());
      final lng = double.tryParse(_virtualStopLngController.text.trim());
      if (lat == null || lng == null) {
        _setValidation(CoreFormValidationTokens.virtualStopCoordinatesNumeric);
        return null;
      }
      if (!_isWithinLatLng(lat, lng)) {
        _setValidation(CoreFormValidationTokens.virtualStopCoordinatesRange);
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

  String _formatSaveErrorMessage(Object error) {
    final raw = error.toString().trim();
    if (raw.isEmpty) {
      return 'Ayarlar kaydedilemedi. Lütfen tekrar deneyin.';
    }
    const exceptionPrefix = 'Exception:';
    final normalized = raw.startsWith(exceptionPrefix)
        ? raw.substring(exceptionPrefix.length).trim()
        : raw;
    return normalized.isEmpty
        ? 'Ayarlar kaydedilemedi. Lütfen tekrar deneyin.'
        : normalized;
  }

  @override
  Widget build(BuildContext context) {
    return CoreScreenScaffold(
      title: 'Yolcu Ayarları',
      subtitle: 'Servis katılım bilgilerini güncelle',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          if (widget.routeName != null && widget.routeName!.trim().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: CoreSpacing.space8),
              child: Text(
                'Rota: ${widget.routeName}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
          TextField(
            enabled: false,
            decoration: InputDecoration(
              labelText: 'Rota ID',
              hintText: widget.routeId,
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _phoneController,
            enabled: !_submitting,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Telefon (opsiyonel)',
            ),
          ),
          const SizedBox(height: CoreSpacing.space8),
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
            title: const Text('Telefonumu şoför görebilsin'),
          ),
          const SizedBox(height: CoreSpacing.space8),
          TextField(
            controller: _boardingAreaController,
            enabled: !_submitting,
            decoration: const InputDecoration(
              labelText: 'Biniş Alanı',
            ),
          ),
          const SizedBox(height: CoreSpacing.space8),
          TextField(
            controller: _notificationTimeController,
            enabled: !_submitting,
            decoration: const InputDecoration(
              labelText: 'Bildirim Saati (HH:mm)',
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
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
              'Sanal durak yoksa ETA Biniş Alanı/rota başlangıcına göre hesaplanır.',
            ),
          ),
          if (_useVirtualStop) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            TextField(
              controller: _virtualStopLabelController,
              enabled: !_submitting,
              decoration: const InputDecoration(
                labelText: 'Sanal Durak Etiketi (opsiyonel)',
              ),
            ),
            const SizedBox(height: CoreSpacing.space8),
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
                const SizedBox(width: CoreSpacing.space8),
                Expanded(
                  child: TextField(
                    controller: _virtualStopLngController,
                    enabled: !_submitting,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                      signed: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Sanal Durak Lng (Boylam)',
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (_validationError != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            Text(
              _validationError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: CoreSpacing.space20),
          CorePrimaryButton(
            label: _submitting ? 'İşleniyor...' : 'Ayarlarımı Kaydet',
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
