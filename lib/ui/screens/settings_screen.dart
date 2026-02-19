import 'package:flutter/material.dart';

import '../../features/subscription/presentation/paywall_copy_tr.dart';
import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/color_tokens.dart';
import '../tokens/cta_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.appName,
    this.showSubscriptionSection = true,
    this.subscriptionStatus = SubscriptionUiStatus.trialActive,
    this.initialConsentEnabled = true,
    this.initialVoiceAlertEnabled = true,
    this.onSubscriptionTap,
    this.onProfileTap,
    this.onConsentTap,
    this.onVoiceAlertTap,
    this.onSupportTap,
    this.onReportIssueTap,
    this.onDeleteAccountTap,
  });

  final String appName;
  final bool showSubscriptionSection;
  final SubscriptionUiStatus subscriptionStatus;
  final bool initialConsentEnabled;
  final bool initialVoiceAlertEnabled;
  final VoidCallback? onSubscriptionTap;
  final VoidCallback? onProfileTap;
  final ValueChanged<bool>? onConsentTap;
  final ValueChanged<bool>? onVoiceAlertTap;
  final VoidCallback? onSupportTap;
  final VoidCallback? onReportIssueTap;
  final VoidCallback? onDeleteAccountTap;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late bool _consentEnabled;
  late bool _voiceAlertEnabled;

  @override
  void initState() {
    super.initState();
    _consentEnabled = widget.initialConsentEnabled;
    _voiceAlertEnabled = widget.initialVoiceAlertEnabled;
  }

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: 'Ayarlar',
      subtitle: widget.appName,
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          if (widget.showSubscriptionSection) ...<Widget>[
            _SectionCard(
              title: PaywallCopyTr.settingsCardTitle,
              description: PaywallCopyTr.settingsCardDescriptionForStatus(
                widget.subscriptionStatus,
              ),
              child: AmberPrimaryButton(
                label: AmberCtaTokens.manageSubscription,
                onPressed: widget.onSubscriptionTap,
              ),
            ),
            const SizedBox(height: AmberSpacingTokens.space12),
          ],
          _SectionCard(
            title: 'Profil',
            description: 'Ad soyad ve telefon bilgilerini guncelle.',
            child: AmberSecondaryButton(
              label: 'Profili Guncelle',
              onPressed: widget.onProfileTap,
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          _SectionCard(
            title: 'Acik Riza ve KVKK',
            description:
                'Veri isleme izinlerini ve aydinlatma metnini buradan yonet.',
            child: SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Acik riza onayi'),
              subtitle: const Text('Onay kapatilirsa canli takip kisitlanir.'),
              value: _consentEnabled,
              onChanged: (value) {
                setState(() {
                  _consentEnabled = value;
                });
                widget.onConsentTap?.call(value);
              },
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          _SectionCard(
            title: 'Bildirimler',
            description:
                'Sofor aktif seferde baglanti degisimlerini sesli bildirimle duyur.',
            child: SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Sesli Uyari'),
              subtitle: const Text(
                'Baglanti kesildi/baglandi ve sefer sonu sesli okunur.',
              ),
              value: _voiceAlertEnabled,
              onChanged: (value) {
                setState(() {
                  _voiceAlertEnabled = value;
                });
                widget.onVoiceAlertTap?.call(value);
              },
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          _SectionCard(
            title: 'Destek',
            description: 'Sorun bildirimi ve destek kanallari.',
            child: Row(
              children: <Widget>[
                Expanded(
                  child: AmberSecondaryButton(
                    label: 'Destek Merkezi',
                    onPressed: widget.onSupportTap,
                  ),
                ),
                const SizedBox(width: AmberSpacingTokens.space8),
                Expanded(
                  child: AmberSecondaryButton(
                    label: 'Sorun Bildir',
                    onPressed: widget.onReportIssueTap,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          _SectionCard(
            title: 'Hesap',
            description: 'Hesap ve veri silme islemleri.',
            child: AmberDangerButton(
              label: 'Hesabimi Sil',
              onPressed: widget.onDeleteAccountTap,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.description,
    required this.child,
  });

  final String title;
  final String description;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
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
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AmberColorTokens.ink700,
                  ),
            ),
            const SizedBox(height: AmberSpacingTokens.space12),
            child,
          ],
        ),
      ),
    );
  }
}
