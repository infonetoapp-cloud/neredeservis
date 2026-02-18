import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../tokens/color_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';

enum JoinRole {
  unknown,
  passenger,
  driver,
}

JoinRole joinRoleFromQuery(String? rawRole) {
  switch (rawRole?.trim().toLowerCase()) {
    case 'passenger':
    case 'yolcu':
      return JoinRole.passenger;
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
  final ValueChanged<String>? onJoinByCode;
  final VoidCallback? onScanQrTap;
  final VoidCallback? onContinueDriverTap;

  @override
  State<JoinScreen> createState() => _JoinScreenState();
}

class _JoinScreenState extends State<JoinScreen> {
  final TextEditingController _srvCodeController = TextEditingController();
  String? _srvCodeError;

  @override
  void dispose() {
    _srvCodeController.dispose();
    super.dispose();
  }

  void _submitJoinCode() {
    final code = _srvCodeController.text.trim();
    if (code.isEmpty) {
      setState(() {
        _srvCodeError = 'SRV kodu gir.';
      });
      return;
    }
    setState(() {
      _srvCodeError = null;
    });
    widget.onJoinByCode?.call(code);
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final roleLabel = switch (widget.selectedRole) {
      JoinRole.driver => 'Sofor modu secili',
      JoinRole.passenger => 'Yolcu modu secili',
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
                            textInputAction: TextInputAction.done,
                            decoration: InputDecoration(
                              hintText: 'Orn: SRV-8K2Q',
                              errorText: _srvCodeError,
                              prefixIcon: const Icon(Icons.qr_code_2_rounded),
                            ),
                            onChanged: (_) {
                              if (_srvCodeError != null) {
                                setState(() {
                                  _srvCodeError = null;
                                });
                              }
                            },
                            onSubmitted: (_) => _submitJoinCode(),
                          ),
                          const SizedBox(height: AmberSpacingTokens.space12),
                          AmberPrimaryButton(
                            label: 'Koda Katil',
                            onPressed: _submitJoinCode,
                          ),
                          const SizedBox(height: AmberSpacingTokens.space8),
                          AmberSecondaryButton(
                            label: 'QR Tara',
                            onPressed: widget.onScanQrTap,
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
                              onPressed: widget.onContinueDriverTap,
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
