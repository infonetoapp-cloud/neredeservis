import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';
import '../tokens/form_validation_tokens.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({
    super.key,
    required this.initialDisplayName,
    this.initialPhone,
    this.initialProfilePhotoUrl,
    this.initialProfilePhotoPath,
    this.onPickPhoto,
    this.onSave,
  });

  final String initialDisplayName;
  final String? initialPhone;
  final String? initialProfilePhotoUrl;
  final String? initialProfilePhotoPath;
  final Future<({String photoUrl, String photoPath})?> Function(
    String? currentPhotoPath,
  )? onPickPhoto;
  final Future<void> Function(
    String displayName,
    String? phone, {
    String? photoUrl,
    String? photoPath,
  })? onSave;

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  late final TextEditingController _displayNameController;
  late final TextEditingController _phoneController;
  bool _submitting = false;
  bool _photoUploading = false;
  String? _displayNameError;
  String? _photoUrl;
  String? _photoPath;

  @override
  void initState() {
    super.initState();
    _displayNameController =
        TextEditingController(text: widget.initialDisplayName);
    _phoneController = TextEditingController(text: widget.initialPhone ?? '');
    _photoUrl = widget.initialProfilePhotoUrl;
    _photoPath = widget.initialProfilePhotoPath;
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _displayNameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.length < 2) {
      setState(() {
        _displayNameError = CoreFormValidationTokens.fullNameMin2;
      });
      return;
    }

    setState(() {
      _displayNameError = null;
      _submitting = true;
    });

    try {
      await widget.onSave?.call(
        name,
        phone.isEmpty ? null : phone,
        photoUrl: _photoUrl,
        photoPath: _photoPath,
      );
      if (!mounted) {
        return;
      }
      Navigator.of(context).pop(true);
    } catch (_) {
      // onSave callback reports the error via screen-level feedback.
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
      title: 'Yolcu Profili',
      subtitle: 'Hesap bilgilerini güncelle',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          _ProfileAvatarSection(
            photoUrl: _photoUrl,
            onEditTap: _pickPhoto,
            busy: _photoUploading,
            enabled: !_submitting,
          ),
          const SizedBox(height: CoreSpacing.space16),
          TextField(
            controller: _displayNameController,
            decoration: InputDecoration(
              labelText: 'Ad Soyad',
              errorText: _displayNameError,
            ),
            textInputAction: TextInputAction.next,
            enabled: !_submitting,
          ),
          const SizedBox(height: CoreSpacing.space12),
          TextField(
            controller: _phoneController,
            decoration: const InputDecoration(
              labelText: 'Telefon (opsiyonel)',
            ),
            textInputAction: TextInputAction.done,
            keyboardType: TextInputType.phone,
            enabled: !_submitting,
            onSubmitted: (_) => _submit(),
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
            label: _submitting ? 'Kaydediliyor...' : 'Kaydet',
            onPressed: _submitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}

class _ProfileAvatarSection extends StatelessWidget {
  const _ProfileAvatarSection({
    required this.photoUrl,
    required this.onEditTap,
    required this.busy,
    required this.enabled,
  });

  final String? photoUrl;
  final VoidCallback onEditTap;
  final bool busy;
  final bool enabled;

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
          Positioned(
            top: 136,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: CoreColors.surface0,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: CoreColors.line200),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: Text(
                  'Profil Fotografi',
                  style: TextStyle(
                    fontFamily: CoreTypography.bodyFamily,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: CoreColors.ink700,
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
