import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../tokens/color_tokens.dart';
import '../tokens/cta_tokens.dart';
import '../tokens/icon_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';

enum JoinRole {
  unknown,
  passenger,
  guest,
  driver,
}

JoinRole joinRoleFromQuery(String? rawRole) {
  switch (rawRole?.trim().toLowerCase()) {
    case 'passenger':
    case 'yolcu':
      return JoinRole.passenger;
    case 'guest':
    case 'misafir':
      return JoinRole.guest;
    case 'driver':
    case 'sofor':
      return JoinRole.driver;
    default:
      return JoinRole.unknown;
  }
}

class JoinScreen extends StatefulWidget {
  const JoinScreen({
    super.key,
    this.selectedRole = JoinRole.unknown,
    this.onJoinByCode,
    this.onScanQrTap,
    this.onContinueDriverTap,
  });

  final JoinRole selectedRole;
  final Future<void> Function(JoinBySrvFormInput input)? onJoinByCode;
  final VoidCallback? onScanQrTap;
  final VoidCallback? onContinueDriverTap;

  @override
  State<JoinScreen> createState() => _JoinScreenState();
}

class _JoinScreenState extends State<JoinScreen> {
  final TextEditingController _srvCodeController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _boardingAreaController = TextEditingController();
  final TextEditingController _notificationTimeController =
      TextEditingController(text: '07:00');
  final TextEditingController _virtualStopLabelController =
      TextEditingController();
  final TextEditingController _virtualStopLatController =
      TextEditingController();
  final TextEditingController _virtualStopLngController =
      TextEditingController();

  bool _showPhoneToDriver = false;
  bool _useVirtualStop = false;
  bool _submitting = false;
  String? _formError;

  @override
  void dispose() {
    _srvCodeController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _boardingAreaController.dispose();
    _notificationTimeController.dispose();
    _virtualStopLabelController.dispose();
    _virtualStopLatController.dispose();
    _virtualStopLngController.dispose();
    super.dispose();
  }

  Future<void> _submitJoinCode() async {
    final isGuestJoin = widget.selectedRole == JoinRole.guest;
    final normalizedCode = _normalizeSrvCode(_srvCodeController.text);
    final name = _nameController.text.trim();
    final phoneRaw = _phoneController.text.trim();
    final phone = phoneRaw.isEmpty ? null : phoneRaw;
    final boardingArea = _boardingAreaController.text.trim();
    final notificationTime = _notificationTimeController.text.trim();
    JoinVirtualStopInput? virtualStop;
    String? virtualStopLabel;

    if (normalizedCode.isEmpty) {
      _setError('SRV kodu gir.');
      return;
    }
    if (!_isSrvCodeFormatValid(normalizedCode)) {
      _setError('SRV kodu 6 karakter olmali (ornek: 8K2Q7M).');
      return;
    }
    if (!isGuestJoin && name.length < 2) {
      _setError('Ad Soyad en az 2 karakter olmali.');
      return;
    }
    if (!isGuestJoin && phone != null && phone.length < 7) {
      _setError('Telefon en az 7 karakter olmali.');
      return;
    }
    if (!isGuestJoin && boardingArea.isEmpty) {
      _setError('Binis alani zorunlu.');
      return;
    }
    if (!isGuestJoin && !_isValidTime(notificationTime)) {
      _setError('Bildirim saati HH:mm formatinda olmali.');
      return;
    }
    if (!isGuestJoin && _useVirtualStop) {
      final virtualStopLat =
          double.tryParse(_virtualStopLatController.text.trim());
      final virtualStopLng =
          double.tryParse(_virtualStopLngController.text.trim());
      if (virtualStopLat == null || virtualStopLng == null) {
        _setError('Sanal durak koordinatlari sayisal olmali.');
        return;
      }
      if (!_isWithinLatLng(virtualStopLat, virtualStopLng)) {
        _setError('Sanal durak koordinatlari gecerli aralikta olmali.');
        return;
      }
      virtualStop = JoinVirtualStopInput(
        lat: virtualStopLat,
        lng: virtualStopLng,
      );
      final labelRaw = _virtualStopLabelController.text.trim();
      virtualStopLabel = labelRaw.isEmpty ? null : labelRaw;
    }

    final input = JoinBySrvFormInput(
      srvCode: normalizedCode,
      name: isGuestJoin ? 'Misafir' : name,
      phone: isGuestJoin ? null : phone,
      showPhoneToDriver: _showPhoneToDriver,
      boardingArea: isGuestJoin ? 'guest' : boardingArea,
      notificationTime: isGuestJoin ? '07:00' : notificationTime,
      virtualStop: virtualStop,
      virtualStopLabel: virtualStopLabel,
    );

    setState(() {
      _submitting = true;
      _formError = null;
    });
    try {
      await widget.onJoinByCode?.call(input);
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  void _setError(String message) {
    setState(() {
      _formError = message;
    });
  }

  bool _isSrvCodeFormatValid(String value) {
    return RegExp(r'^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$').hasMatch(value);
  }

  bool _isValidTime(String value) {
    return RegExp(r'^([01]\d|2[0-3]):[0-5]\d$').hasMatch(value);
  }

  bool _isWithinLatLng(double lat, double lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  String _normalizeSrvCode(String raw) {
    var normalized = raw.trim().toUpperCase();
    if (normalized.startsWith('SRV-')) {
      normalized = normalized.substring(4);
    }
    return normalized.replaceAll(RegExp(r'[^A-Z0-9]'), '');
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final roleLabel = switch (widget.selectedRole) {
      JoinRole.driver => 'Sofor modu secili',
      JoinRole.passenger => 'Yolcu modu secili',
      JoinRole.guest => 'Misafir modu secili',
      JoinRole.unknown => 'Rol secimi bekleniyor',
    };

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[
              Color(0xFFFFF3E7),
              Color(0xFFF7F8F5),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: AmberSpacingTokens.screenPadding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Text(
                    'Servise Katil',
                    style: textTheme.headlineSmall,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space8),
                  Text(
                    'SRV kodu veya QR ile hizli katilim.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: AmberColorTokens.ink700,
                    ),
                  ),
                  const SizedBox(height: AmberSpacingTokens.space8),
                  _RoleBadge(label: roleLabel),
                  const SizedBox(height: AmberSpacingTokens.space16),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: AmberColorTokens.surface0,
                      borderRadius: AmberRadiusTokens.radius20,
                      border: Border.all(color: AmberColorTokens.line200),
                    ),
                    child: Padding(
                      padding: AmberSpacingTokens.cardPadding,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: <Widget>[
                          Text(
                            'SRV Kodu',
                            style: textTheme.titleMedium,
                          ),
                          const SizedBox(height: AmberSpacingTokens.space8),
                          TextField(
                            controller: _srvCodeController,
                            enabled: !_submitting,
                            textInputAction: TextInputAction.done,
                            decoration: InputDecoration(
                              hintText: 'Orn: 8K2Q7M',
                              errorText: _formError,
                              prefixIcon: const Icon(AmberIconTokens.qrCode),
                            ),
                            onChanged: (_) {
                              if (_formError != null) {
                                setState(() {
                                  _formError = null;
                                });
                              }
                            },
                            onSubmitted: (_) => _submitJoinCode(),
                          ),
                          if (widget.selectedRole ==
                              JoinRole.guest) ...<Widget>[
                            const SizedBox(height: AmberSpacingTokens.space8),
                            Text(
                              'Misafir takipte yalnizca SRV kodu yeterli.',
                              style: textTheme.bodyMedium?.copyWith(
                                color: AmberColorTokens.ink700,
                              ),
                            ),
                          ] else ...<Widget>[
                            const SizedBox(height: AmberSpacingTokens.space8),
                            TextField(
                              controller: _nameController,
                              enabled: !_submitting,
                              decoration: const InputDecoration(
                                labelText: 'Ad Soyad',
                              ),
                            ),
                            const SizedBox(height: AmberSpacingTokens.space8),
                            TextField(
                              controller: _phoneController,
                              enabled: !_submitting,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(
                                labelText: 'Telefon (opsiyonel)',
                              ),
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
                            const SizedBox(height: AmberSpacingTokens.space8),
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
                              title:
                                  const Text('Sanal Durak kullan (opsiyonel)'),
                              subtitle: const Text(
                                'Sanal durak yoksa Binis Alani ile devam edilir.',
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
                                      keyboardType:
                                          const TextInputType.numberWithOptions(
                                        decimal: true,
                                        signed: true,
                                      ),
                                      decoration: const InputDecoration(
                                        labelText: 'Sanal Durak Lat',
                                      ),
                                    ),
                                  ),
                                  const SizedBox(
                                      width: AmberSpacingTokens.space8),
                                  Expanded(
                                    child: TextField(
                                      controller: _virtualStopLngController,
                                      enabled: !_submitting,
                                      keyboardType:
                                          const TextInputType.numberWithOptions(
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
                          ],
                          const SizedBox(height: AmberSpacingTokens.space12),
                          AmberPrimaryButton(
                            label: _submitting
                                ? 'Isleniyor...'
                                : AmberCtaTokens.joinByCode,
                            onPressed: _submitting ? null : _submitJoinCode,
                          ),
                          const SizedBox(height: AmberSpacingTokens.space8),
                          AmberSecondaryButton(
                            label: 'QR Tara',
                            onPressed: _submitting ? null : widget.onScanQrTap,
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (widget.selectedRole == JoinRole.driver) ...<Widget>[
                    const SizedBox(height: AmberSpacingTokens.space12),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: AmberColorTokens.surface0,
                        borderRadius: AmberRadiusTokens.radius20,
                        border: Border.all(color: AmberColorTokens.line200),
                      ),
                      child: Padding(
                        padding: AmberSpacingTokens.cardPadding,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: <Widget>[
                            Text(
                              'Sofor hizli gecis',
                              style: textTheme.titleMedium,
                            ),
                            const SizedBox(height: AmberSpacingTokens.space8),
                            Text(
                              'Bu cihaz sofordeyse dogrudan panel acilabilir.',
                              style: textTheme.bodyMedium?.copyWith(
                                color: AmberColorTokens.ink700,
                              ),
                            ),
                            const SizedBox(height: AmberSpacingTokens.space12),
                            AmberSecondaryButton(
                              label: 'Sofor Paneline Gec',
                              onPressed: _submitting
                                  ? null
                                  : widget.onContinueDriverTap,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class JoinBySrvFormInput {
  const JoinBySrvFormInput({
    required this.srvCode,
    required this.name,
    required this.showPhoneToDriver,
    required this.boardingArea,
    required this.notificationTime,
    this.phone,
    this.virtualStop,
    this.virtualStopLabel,
  });

  final String srvCode;
  final String name;
  final String? phone;
  final bool showPhoneToDriver;
  final String boardingArea;
  final String notificationTime;
  final JoinVirtualStopInput? virtualStop;
  final String? virtualStopLabel;
}

class JoinVirtualStopInput {
  const JoinVirtualStopInput({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class _RoleBadge extends StatelessWidget {
  const _RoleBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space12,
        vertical: AmberSpacingTokens.space8,
      ),
      decoration: const BoxDecoration(
        color: AmberColorTokens.amber100,
        borderRadius: AmberRadiusTokens.radius28,
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AmberColorTokens.ink700,
            ),
      ),
    );
  }
}
