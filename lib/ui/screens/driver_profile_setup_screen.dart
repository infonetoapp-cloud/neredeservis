import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class DriverProfileSetupScreen extends StatefulWidget {
  const DriverProfileSetupScreen({
    super.key,
    this.initialName,
    this.initialPhone,
    this.initialPlate,
    this.initialShowPhoneToPassengers = true,
    this.onSave,
  });

  final String? initialName;
  final String? initialPhone;
  final String? initialPlate;
  final bool initialShowPhoneToPassengers;
  final Future<void> Function(
    String name,
    String phone,
    String plate,
    bool showPhoneToPassengers,
  )? onSave;

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
  String? _nameError;
  String? _phoneError;
  String? _plateError;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName ?? '');
    _phoneController = TextEditingController(text: widget.initialPhone ?? '');
    _plateController = TextEditingController(text: widget.initialPlate ?? '');
    _showPhoneToPassengers = widget.initialShowPhoneToPassengers;
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
      _nameError = 'Ad en az 2 karakter olmali.';
      hasError = true;
    } else {
      _nameError = null;
    }
    if (phone.length < 7) {
      _phoneError = 'Telefon en az 7 karakter olmali.';
      hasError = true;
    } else {
      _phoneError = null;
    }
    if (plate.length < 3) {
      _plateError = 'Plaka en az 3 karakter olmali.';
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
      await widget.onSave?.call(name, phone, plate, _showPhoneToPassengers);
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
      title: 'Sofor Profili',
      subtitle: 'Canli sefer icin profil bilgilerini tamamla',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          TextField(
            controller: _nameController,
            textInputAction: TextInputAction.next,
            enabled: !_submitting,
            decoration: InputDecoration(
              labelText: 'Ad Soyad',
              errorText: _nameError,
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
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
          const SizedBox(height: AmberSpacingTokens.space12),
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
          const SizedBox(height: AmberSpacingTokens.space8),
          SwitchListTile.adaptive(
            value: _showPhoneToPassengers,
            onChanged: _submitting
                ? null
                : (value) {
                    setState(() {
                      _showPhoneToPassengers = value;
                    });
                  },
            title: const Text('Numarami yolcularla paylas'),
            subtitle: const Text('Kapaliysa yolcular telefonunu goremez.'),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: AmberSpacingTokens.space20),
          AmberPrimaryButton(
            label: _submitting ? 'Kaydediliyor...' : 'Profili Kaydet',
            onPressed: _submitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}
