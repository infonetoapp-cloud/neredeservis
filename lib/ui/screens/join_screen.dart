import 'package:flutter/material.dart';

import '../components/buttons/black_action_button.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_radii.dart';
import '../tokens/core_spacing.dart';
import '../tokens/cta_tokens.dart';
import '../tokens/form_validation_tokens.dart';
import '../tokens/icon_tokens.dart';

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
    case 'şoför':
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
    this.showAuthCta = false,
    this.authCtaLabel = 'Giriş yap veya üye ol',
    this.onAuthTap,
    this.showRoleChangeCta = true,
    this.roleChangeCtaLabel = 'Rolü değiştir',
    this.onRoleChangeTap,
  });

  final JoinRole selectedRole;
  final Future<void> Function(JoinBySrvFormInput input)? onJoinByCode;
  final VoidCallback? onScanQrTap;
  final VoidCallback? onContinueDriverTap;
  final bool showAuthCta;
  final String authCtaLabel;
  final VoidCallback? onAuthTap;
  final bool showRoleChangeCta;
  final String roleChangeCtaLabel;
  final VoidCallback? onRoleChangeTap;

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
    final onJoinByCode = widget.onJoinByCode;
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
      _setError(CoreFormValidationTokens.srvCodeRequired);
      return;
    }
    if (!_isSrvCodeFormatValid(normalizedCode)) {
      _setError(CoreFormValidationTokens.srvCodeFormat);
      return;
    }
    if (isGuestJoin && name.isNotEmpty && name.length < 2) {
      _setError(CoreFormValidationTokens.fullNameMin2);
      return;
    }
    if (!isGuestJoin && name.length < 2) {
      _setError(CoreFormValidationTokens.fullNameMin2);
      return;
    }
    if (!isGuestJoin && phone != null && phone.length < 7) {
      _setError(CoreFormValidationTokens.phoneMin7);
      return;
    }
    if (!isGuestJoin && boardingArea.isEmpty) {
      _setError(CoreFormValidationTokens.boardingAreaRequired);
      return;
    }
    if (!isGuestJoin && !_isValidTime(notificationTime)) {
      _setError(CoreFormValidationTokens.notificationTimeFormat);
      return;
    }
    if (!isGuestJoin && _useVirtualStop) {
      final virtualStopLat =
          double.tryParse(_virtualStopLatController.text.trim());
      final virtualStopLng =
          double.tryParse(_virtualStopLngController.text.trim());
      if (virtualStopLat == null || virtualStopLng == null) {
        _setError(CoreFormValidationTokens.virtualStopCoordinatesNumeric);
        return;
      }
      if (!_isWithinLatLng(virtualStopLat, virtualStopLng)) {
        _setError(CoreFormValidationTokens.virtualStopCoordinatesRange);
        return;
      }
      virtualStop = JoinVirtualStopInput(
        lat: virtualStopLat,
        lng: virtualStopLng,
      );
      final labelRaw = _virtualStopLabelController.text.trim();
      virtualStopLabel = labelRaw.isEmpty ? null : labelRaw;
    }

    if (onJoinByCode == null) {
      _setError(
          'Katılım işlemi şu anda kullanılamıyor. Lütfen tekrar deneyin.');
      return;
    }
    final input = JoinBySrvFormInput(
      srvCode: normalizedCode,
      name: name,
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
      await onJoinByCode(input);
    } catch (error) {
      if (mounted) {
        _setError(_formatSubmitErrorMessage(error));
      }
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

  String _formatSubmitErrorMessage(Object error) {
    final raw = error.toString().trim();
    if (raw.isEmpty) {
      return 'Katılım işlemi tamamlanamadı. Lütfen tekrar deneyin.';
    }
    const exceptionPrefix = 'Exception:';
    final normalized = raw.startsWith(exceptionPrefix)
        ? raw.substring(exceptionPrefix.length).trim()
        : raw;
    return normalized.isEmpty
        ? 'Katılım işlemi tamamlanamadı. Lütfen tekrar deneyin.'
        : normalized;
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

  Future<void> _showGuestHelpSheet() async {
    final textTheme = Theme.of(context).textTheme;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: CoreColors.surface0,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              CoreSpacing.space16,
              CoreSpacing.space16,
              CoreSpacing.space16,
              CoreSpacing.space16,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Text(
                  'Misafir Modu Nasıl Çalışır?',
                  style: textTheme.titleLarge,
                ),
                const SizedBox(height: CoreSpacing.space8),
                Text(
                  'Misafir modu, uygulamayı günübirlik veya kısa süreli kullanacak kişiler için hızlı takip seçeneğidir.',
                  style: textTheme.bodyMedium?.copyWith(
                    color: CoreColors.ink700,
                  ),
                ),
                const SizedBox(height: CoreSpacing.space12),
                const _GuestHelpStep(
                  number: 1,
                  text: 'Şoförden veya kurumdan SRV kodunu alın.',
                ),
                const _GuestHelpStep(
                  number: 2,
                  text: 'Kodu girin ya da QR kodunu tarayın.',
                ),
                const _GuestHelpStep(
                  number: 3,
                  text: 'Canlı konumu ve varış bilgisini anında takip edin.',
                ),
                const SizedBox(height: CoreSpacing.space12),
                Text(
                  'Bu mod profil oluşturmadan yalnızca izleme deneyimi sunar.',
                  style: textTheme.bodySmall?.copyWith(
                    color: CoreColors.ink700,
                  ),
                ),
                const SizedBox(height: CoreSpacing.space12),
                BlackPrimaryButton(
                  label: 'Anladım',
                  onPressed: () => Navigator.of(sheetContext).pop(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  ButtonStyle _linkButtonStyle() {
    return TextButton.styleFrom(
      foregroundColor: const Color(0xFF0E0E0E),
      textStyle: const TextStyle(
        fontWeight: FontWeight.w600,
        fontSize: 16,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final navigator = Navigator.of(context);
    final canNavigateBack = navigator.canPop();
    final canFallbackToRoleSelect = widget.onRoleChangeTap != null;
    final isGuestJoin = widget.selectedRole == JoinRole.guest;
    final roleLabel = switch (widget.selectedRole) {
      JoinRole.driver => 'Şoför modu seçili',
      JoinRole.passenger => 'Yolcu modu seçili',
      JoinRole.guest => 'Misafir modu seçili',
      JoinRole.unknown => 'Rol seçimi bekleniyor',
    };

    return Scaffold(
      floatingActionButton: isGuestJoin
          ? FloatingActionButton.extended(
              onPressed: _showGuestHelpSheet,
              backgroundColor: CoreColors.surface0,
              foregroundColor: CoreColors.ink900,
              icon: const Icon(CoreIconTokens.info, size: 18),
              label: const Text('Yardım'),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[
              Color(0xFFEAF8F2),
              Color(0xFFF3F8F5),
              Color(0xFFFFFFFF),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: CoreSpacing.screenPadding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      if (canNavigateBack || canFallbackToRoleSelect)
                        IconButton(
                          onPressed: _submitting
                              ? null
                              : () {
                                  if (canNavigateBack) {
                                    navigator.pop();
                                    return;
                                  }
                                  widget.onRoleChangeTap?.call();
                                },
                          tooltip: 'Geri',
                          icon: const Icon(CoreIconTokens.back),
                        ),
                      Expanded(
                        child: Text(
                          'Katılım',
                          style: textTheme.titleMedium,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: CoreSpacing.space8),
                  Text(
                    'Servise Katıl',
                    style: textTheme.headlineSmall,
                  ),
                  const SizedBox(height: CoreSpacing.space8),
                  Text(
                    isGuestJoin
                        ? 'Günübirlik veya kısa süreli kullanım için SRV kodunu girin ya da QR kodunu tarayın.'
                        : 'SRV kodu veya QR ile hızlı katılım.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: CoreColors.ink700,
                    ),
                  ),
                  if (!isGuestJoin) ...<Widget>[
                    const SizedBox(height: CoreSpacing.space8),
                    _RoleBadge(label: roleLabel),
                  ],
                  if (widget.showAuthCta) ...<Widget>[
                    const SizedBox(height: CoreSpacing.space8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: _submitting ? null : widget.onAuthTap,
                        style: _linkButtonStyle(),
                        child: Text(widget.authCtaLabel),
                      ),
                    ),
                  ],
                  if (widget.showRoleChangeCta) ...<Widget>[
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: _submitting ? null : widget.onRoleChangeTap,
                        style: _linkButtonStyle(),
                        child: Text(widget.roleChangeCtaLabel),
                      ),
                    ),
                  ],
                  const SizedBox(height: CoreSpacing.space16),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: CoreColors.surface0,
                      borderRadius: CoreRadii.radius20,
                      border: Border.all(color: CoreColors.line200),
                      boxShadow: const <BoxShadow>[
                        BoxShadow(
                          color: Color(0x120A1411),
                          blurRadius: 12,
                          offset: Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: CoreSpacing.cardPadding,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: <Widget>[
                          Text(
                            'SRV Kodu',
                            style: textTheme.titleMedium,
                          ),
                          const SizedBox(height: CoreSpacing.space8),
                          TextField(
                            controller: _srvCodeController,
                            enabled: !_submitting,
                            textInputAction: TextInputAction.done,
                            decoration: InputDecoration(
                              hintText: 'Örn: 8K2Q7M',
                              errorText: _formError,
                              prefixIcon: const Icon(CoreIconTokens.qrCode),
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
                            const SizedBox(height: CoreSpacing.space8),
                            Text(
                              'Misafir kullanımında SRV kodu yeterlidir. İstersen adını ekleyip şoförle chat\'te görünür olabilirsin.',
                              style: textTheme.bodyMedium?.copyWith(
                                color: CoreColors.ink700,
                              ),
                            ),
                            const SizedBox(height: CoreSpacing.space8),
                            TextField(
                              controller: _nameController,
                              enabled: !_submitting,
                              decoration: const InputDecoration(
                                labelText: 'Adınız (opsiyonel)',
                              ),
                            ),
                          ] else ...<Widget>[
                            const SizedBox(height: CoreSpacing.space8),
                            TextField(
                              controller: _nameController,
                              enabled: !_submitting,
                              decoration: const InputDecoration(
                                labelText: 'Ad Soyad',
                              ),
                            ),
                            const SizedBox(height: CoreSpacing.space8),
                            TextField(
                              controller: _phoneController,
                              enabled: !_submitting,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(
                                labelText: 'Telefon (opsiyonel)',
                              ),
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
                            const SizedBox(height: CoreSpacing.space8),
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
                                'Sanal durak yoksa Biniş Alanı ile devam edilir.',
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
                                  const SizedBox(width: CoreSpacing.space8),
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
                          ],
                          const SizedBox(height: CoreSpacing.space12),
                          BlackPrimaryButton(
                            label: _submitting
                                ? 'İşleniyor...'
                                : CoreCtaTokens.joinByCode,
                            onPressed: _submitting ? null : _submitJoinCode,
                          ),
                          const SizedBox(height: CoreSpacing.space8),
                          BlackOutlineButton(
                            label: 'QR Tara',
                            icon: Icons.qr_code_scanner_rounded,
                            onPressed: _submitting ? null : widget.onScanQrTap,
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (widget.selectedRole == JoinRole.driver) ...<Widget>[
                    const SizedBox(height: CoreSpacing.space12),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: CoreColors.surface0,
                        borderRadius: CoreRadii.radius20,
                        border: Border.all(color: CoreColors.line200),
                        boxShadow: const <BoxShadow>[
                          BoxShadow(
                            color: Color(0x120A1411),
                            blurRadius: 12,
                            offset: Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: CoreSpacing.cardPadding,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: <Widget>[
                            Text(
                              'Şoför hızlı geçiş',
                              style: textTheme.titleMedium,
                            ),
                            const SizedBox(height: CoreSpacing.space8),
                            Text(
                              'Bu cihaz şofördeyse doğrudan panel açılabilir.',
                              style: textTheme.bodyMedium?.copyWith(
                                color: CoreColors.ink700,
                              ),
                            ),
                            const SizedBox(height: CoreSpacing.space12),
                            BlackOutlineButton(
                              label: 'Şoför Paneline Geç',
                              icon: Icons.arrow_forward_rounded,
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

class _GuestHelpStep extends StatelessWidget {
  const _GuestHelpStep({
    required this.number,
    required this.text,
  });

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: CoreSpacing.space8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: CoreColors.amber100,
              shape: BoxShape.circle,
            ),
            child: Text(
              '$number',
              style: textTheme.labelSmall?.copyWith(
                color: CoreColors.ink900,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: CoreSpacing.space8),
          Expanded(
            child: Text(
              text,
              style: textTheme.bodyMedium?.copyWith(
                color: CoreColors.ink900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  const _RoleBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space12,
        vertical: CoreSpacing.space8,
      ),
      decoration: const BoxDecoration(
        color: CoreColors.amber100,
        borderRadius: CoreRadii.radius28,
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: CoreColors.ink700,
            ),
      ),
    );
  }
}
