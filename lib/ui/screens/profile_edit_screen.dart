import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({
    super.key,
    required this.initialDisplayName,
    this.initialPhone,
    this.onSave,
  });

  final String initialDisplayName;
  final String? initialPhone;
  final Future<void> Function(String displayName, String? phone)? onSave;

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  late final TextEditingController _displayNameController;
  late final TextEditingController _phoneController;
  bool _submitting = false;
  String? _displayNameError;

  @override
  void initState() {
    super.initState();
    _displayNameController =
        TextEditingController(text: widget.initialDisplayName);
    _phoneController = TextEditingController(text: widget.initialPhone ?? '');
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
        _displayNameError = 'Ad en az 2 karakter olmali.';
      });
      return;
    }

    setState(() {
      _displayNameError = null;
      _submitting = true;
    });

    try {
      await widget.onSave?.call(name, phone.isEmpty ? null : phone);
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

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: 'Profili Guncelle',
      subtitle: 'Display name ve telefon',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          TextField(
            controller: _displayNameController,
            decoration: InputDecoration(
              labelText: 'Ad Soyad',
              errorText: _displayNameError,
            ),
            textInputAction: TextInputAction.next,
            enabled: !_submitting,
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
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
          const SizedBox(height: AmberSpacingTokens.space20),
          AmberPrimaryButton(
            label: _submitting ? 'Kaydediliyor...' : 'Kaydet',
            onPressed: _submitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}
