import 'package:flutter/material.dart';

import '../../features/subscription/presentation/paywall_copy_tr.dart';
import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_radii.dart';
import '../tokens/core_spacing.dart';
import '../tokens/cta_tokens.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.appName,
    this.showSubscriptionSection = true,
    this.showDriverPhoneVisibilitySection = false,
    this.subscriptionStatus = SubscriptionUiStatus.trialActive,
    this.trialDaysLeft = 0,
    this.initialConsentEnabled = true,
    this.initialVoiceAlertEnabled = true,
    this.initialShowPhoneToPassengers = true,
    this.onSubscriptionTap,
    this.onConsentTap,
    this.onVoiceAlertTap,
    this.onDriverPhoneVisibilityTap,
    this.onSupportTap,
    this.onReportIssueTap,
    this.onDeleteAccountTap,
  });

  final String appName;
  final bool showSubscriptionSection;
  final bool showDriverPhoneVisibilitySection;
  final SubscriptionUiStatus subscriptionStatus;
  final int trialDaysLeft;
  final bool initialConsentEnabled;
  final bool initialVoiceAlertEnabled;
  final bool initialShowPhoneToPassengers;
  final VoidCallback? onSubscriptionTap;
  final ValueChanged<bool>? onConsentTap;
  final ValueChanged<bool>? onVoiceAlertTap;
  final ValueChanged<bool>? onDriverPhoneVisibilityTap;
  final VoidCallback? onSupportTap;
  final VoidCallback? onReportIssueTap;
  final VoidCallback? onDeleteAccountTap;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late bool _consentEnabled;
  late bool _voiceAlertEnabled;
  late bool _showPhoneToPassengers;

  @override
  void initState() {
    super.initState();
    _consentEnabled = widget.initialConsentEnabled;
    _voiceAlertEnabled = widget.initialVoiceAlertEnabled;
    _showPhoneToPassengers = widget.initialShowPhoneToPassengers;
  }

  @override
  Widget build(BuildContext context) {
    return CoreScreenScaffold(
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
              child: CorePrimaryButton(
                label: CoreCtaTokens.manageSubscription,
                onPressed: widget.onSubscriptionTap,
              ),
            ),
            const SizedBox(height: CoreSpacing.space12),
          ],
          if (widget.showDriverPhoneVisibilitySection) ...<Widget>[
            const SizedBox(height: CoreSpacing.space12),
            _SectionCard(
              title: 'Şoför Gizliligi',
              description: 'Yolculara görünen telefon bilgisini buradan yönet.',
              child: SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Numaramı yolcularla paylaş'),
                subtitle: const Text('Kapaliysa yolcular telefonunu goremez.'),
                value: _showPhoneToPassengers,
                onChanged: (value) {
                  setState(() {
                    _showPhoneToPassengers = value;
                  });
                  widget.onDriverPhoneVisibilityTap?.call(value);
                },
              ),
            ),
          ],
          const SizedBox(height: CoreSpacing.space12),
          _SectionCard(
            title: 'Açık Riza ve KVKK',
            description:
                'Veri isleme izinlerini ve aydinlatma metnini buradan yönet.',
            child: SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Açık rıza onayi'),
              subtitle: const Text('Onay kapatılırsa canlı takip kısıtlanır.'),
              value: _consentEnabled,
              onChanged: (value) {
                setState(() {
                  _consentEnabled = value;
                });
                widget.onConsentTap?.call(value);
              },
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          _SectionCard(
            title: 'Bildirimler',
            description:
                'Şoför aktif seferde bağlantı değişimlerini sesli bildirimle duyur.',
            child: SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Sesli Uyarı'),
              subtitle: const Text(
                'Bağlantı kesildi/baglandi ve sefer sonu sesli okunur.',
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
          const SizedBox(height: CoreSpacing.space12),
          _SectionCard(
            title: 'Destek',
            description: 'Sorun bildirimi ve destek kanallari.',
            child: Row(
              children: <Widget>[
                Expanded(
                  child: CoreSecondaryButton(
                    label: 'Destek Merkezi',
                    onPressed: widget.onSupportTap,
                  ),
                ),
                const SizedBox(width: CoreSpacing.space8),
                Expanded(
                  child: CoreSecondaryButton(
                    label: 'Sorun Bildir',
                    onPressed: widget.onReportIssueTap,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          _SectionCard(
            title: 'Hesap',
            description: 'Hesap ve veri silme işlemleri.',
            child: CoreDangerButton(
              label: 'Hesabımı Sil',
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
        color: CoreColors.surface0,
        borderRadius: CoreRadii.radius20,
        border: Border.all(color: CoreColors.line200),
      ),
      child: Padding(
        padding: CoreSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: CoreSpacing.space8),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: CoreColors.ink700,
                  ),
            ),
            const SizedBox(height: CoreSpacing.space12),
            child,
          ],
        ),
      ),
    );
  }
}
