import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';
import '../tokens/form_validation_tokens.dart';

class DriverProfileSetupScreen extends StatefulWidget {
  const DriverProfileSetupScreen({
    super.key,
    this.initialName,
    this.initialPhone,
    this.initialPlate,
    this.initialShowPhoneToPassengers = true,
    this.initialProfilePhotoUrl,
    this.initialProfilePhotoPath,
    this.onPickPhoto,
    this.onSave,
  });

  final String? initialName;
  final String? initialPhone;
  final String? initialPlate;
  final bool initialShowPhoneToPassengers;
  final String? initialProfilePhotoUrl;
  final String? initialProfilePhotoPath;
  final Future<({String photoUrl, String photoPath})?> Function(
    String? currentPhotoPath,
  )? onPickPhoto;
  final Future<void> Function(
    String name,
    String phone,
    String plate,
    bool showPhoneToPassengers, {
    String? photoUrl,
    String? photoPath,
  })? onSave;

  @override
  State<DriverProfileSetupScreen> createState() =>
      _DriverProfileSetupScreenState();
}

class _DriverProfileSetupScreenState extends State<DriverProfileSetupScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _plateController;
  late bool _showPhoneToPassengers;
  bool _submitting = false;
  bool _photoUploading = false;
  String? _nameError;
  String? _phoneError;
  String? _plateError;
  String? _photoUrl;
  String? _photoPath;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName ?? '');
    _phoneController = TextEditingController(text: widget.initialPhone ?? '');
    _plateController = TextEditingController(text: widget.initialPlate ?? '');
    _showPhoneToPassengers = widget.initialShowPhoneToPassengers;
    _photoUrl = widget.initialProfilePhotoUrl;
    _photoPath = widget.initialProfilePhotoPath;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _plateController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final plate = _plateController.text.trim().toUpperCase();

    var hasError = false;
    if (name.length < 2) {
      _nameError = CoreFormValidationTokens.fullNameMin2;
      hasError = true;
    } else {
      _nameError = null;
    }
    if (phone.length < 7) {
      _phoneError = CoreFormValidationTokens.phoneMin7;
      hasError = true;
    } else {
      _phoneError = null;
    }
    if (plate.length < 3) {
      _plateError = CoreFormValidationTokens.plateMin3;
      hasError = true;
    } else {
      _plateError = null;
    }
    if (hasError) {
      setState(() {});
      return;
    }

    setState(() {
      _submitting = true;
    });
    try {
      await widget.onSave?.call(
        name,
        phone,
        plate,
        _showPhoneToPassengers,
        photoUrl: _photoUrl,
        photoPath: _photoPath,
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  Future<void> _pickPhoto() async {
    final picker = widget.onPickPhoto;
    if (picker == null || _submitting || _photoUploading) {
      return;
    }
    setState(() {
      _photoUploading = true;
    });
    try {
      final result = await picker.call(_photoPath);
      if (!mounted || result == null) {
        return;
      }
      setState(() {
        _photoUrl = result.photoUrl;
        _photoPath = result.photoPath;
      });
    } finally {
      if (mounted) {
        setState(() {
          _photoUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CoreScreenScaffold(
      title: 'Şoför Profili',
      subtitle: 'Canlı sefer icin profil bilgilerini tamamla',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          _DriverAvatarSection(
            photoUrl: _photoUrl,
            busy: _photoUploading,
            enabled: !_submitting,
            onEditTap: _pickPhoto,
          ),
          const SizedBox(height: CoreSpacing.space16),
          TextField(
            controller: _nameController,
            textInputAction: TextInputAction.next,
            enabled: !_submitting,
            decoration: InputDecoration(
              labelText: 'Ad Soyad',
              errorText: _nameError,
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _phoneController,
            textInputAction: TextInputAction.next,
            keyboardType: TextInputType.phone,
            enabled: !_submitting,
            decoration: InputDecoration(
              labelText: 'Telefon',
              errorText: _phoneError,
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _plateController,
            textInputAction: TextInputAction.done,
            enabled: !_submitting,
            decoration: InputDecoration(
              labelText: 'Plaka',
              errorText: _plateError,
            ),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: CoreSpacing.space8),
          SwitchListTile.adaptive(
            value: _showPhoneToPassengers,
            onChanged: _submitting
                ? null
                : (value) {
                    setState(() {
                      _showPhoneToPassengers = value;
                    });
                  },
            title: const Text('Numaramı yolcularla paylaş'),
            subtitle: const Text('Kapaliysa yolcular telefonunu goremez.'),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: CoreSpacing.space8),
          const Text(
            'Profil fotografi otomatik olarak sikistirilip sunucuya yuklenir.',
            style: TextStyle(
              fontFamily: CoreTypography.bodyFamily,
              fontWeight: FontWeight.w500,
              fontSize: 12,
              color: CoreColors.ink700,
            ),
          ),
          const SizedBox(height: CoreSpacing.space20),
          CorePrimaryButton(
            label: _submitting ? 'Kaydediliyor...' : 'Profili Kaydet',
            onPressed: _submitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}

class _DriverAvatarSection extends StatelessWidget {
  const _DriverAvatarSection({
    required this.photoUrl,
    required this.busy,
    required this.enabled,
    required this.onEditTap,
  });

  final String? photoUrl;
  final bool busy;
  final bool enabled;
  final VoidCallback onEditTap;

  @override
  Widget build(BuildContext context) {
    final resolvedUrl = photoUrl?.trim();
    final hasPhoto = resolvedUrl != null && resolvedUrl.isNotEmpty;

    return Center(
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: <Widget>[
          Container(
            width: 124,
            height: 124,
            decoration: BoxDecoration(
              color: CoreColors.line200,
              shape: BoxShape.circle,
              border: Border.all(color: CoreColors.surface0, width: 4),
              boxShadow: const <BoxShadow>[
                BoxShadow(
                  color: Color(0x22000000),
                  blurRadius: 18,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: hasPhoto
                ? Image.network(
                    resolvedUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(
                        Icons.person_rounded,
                        size: 58,
                        color: CoreColors.ink700,
                      );
                    },
                  )
                : const Icon(
                    Icons.person_rounded,
                    size: 58,
                    color: CoreColors.ink700,
                  ),
          ),
          if (busy)
            Container(
              width: 124,
              height: 124,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: Color(0x66000000),
                shape: BoxShape.circle,
              ),
              child: const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(CoreColors.surface0),
                ),
              ),
            ),
          Positioned(
            right: -4,
            bottom: -4,
            child: Material(
              color: CoreColors.ink900,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: (!enabled || busy) ? null : onEditTap,
                child: const SizedBox(
                  width: 42,
                  height: 42,
                  child: Icon(
                    Icons.edit_rounded,
                    color: CoreColors.surface0,
                    size: 20,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
