import 'package:flutter/foundation.dart' show defaultTargetPlatform;
import 'package:flutter/material.dart';

import '../../features/subscription/presentation/paywall_copy_tr.dart';
import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/color_tokens.dart';
import '../tokens/icon_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';

enum PaywallPlan {
  monthly,
  yearly,
}

class PaywallScreen extends StatefulWidget {
  const PaywallScreen({
    super.key,
    required this.appName,
    this.subscriptionStatus = SubscriptionUiStatus.mock,
    this.trialDaysLeft = 0,
    this.monthlyPriceLabel = '149,99 TL/ay',
    this.yearlyPriceLabel = '1.299,99 TL/yil',
    this.onPurchaseTap,
    this.onRestoreTap,
    this.onManageTap,
    this.onLaterTap,
  });

  final String appName;
  final SubscriptionUiStatus subscriptionStatus;
  final int trialDaysLeft;
  final String monthlyPriceLabel;
  final String yearlyPriceLabel;
  final ValueChanged<PaywallPlan>? onPurchaseTap;
  final VoidCallback? onRestoreTap;
  final VoidCallback? onManageTap;
  final VoidCallback? onLaterTap;

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  PaywallPlan _selectedPlan = PaywallPlan.yearly;

  String get _restoreLabel {
    return PaywallCopyTr.restoreLabelForPlatform(defaultTargetPlatform);
  }

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: PaywallCopyTr.settingsCardTitle,
      subtitle: widget.appName,
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          _buildStatusBanner(context),
          const SizedBox(height: AmberSpacingTokens.space12),
          _HeroCard(subscriptionStatus: widget.subscriptionStatus),
          const SizedBox(height: AmberSpacingTokens.space12),
          _buildPlanCards(),
          const SizedBox(height: AmberSpacingTokens.space12),
          AmberPrimaryButton(
            label: PaywallCopyTr.primaryCta,
            onPressed: () => widget.onPurchaseTap?.call(_selectedPlan),
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          AmberSecondaryButton(
            label: PaywallCopyTr.secondaryCta,
            onPressed: widget.onLaterTap,
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: AmberSpacingTokens.space12,
            runSpacing: AmberSpacingTokens.space8,
            children: <Widget>[
              TextButton(
                onPressed: widget.onRestoreTap,
                child: Text(_restoreLabel),
              ),
              TextButton(
                onPressed: widget.onManageTap,
                child: const Text(PaywallCopyTr.manageSubscription),
              ),
            ],
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          Text(
            PaywallCopyTr.legalLine,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AmberColorTokens.ink700,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBanner(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final message = PaywallCopyTr.trialBannerForStatus(
      widget.subscriptionStatus,
      trialDaysLeft: widget.trialDaysLeft,
    );

    final toneColor = switch (widget.subscriptionStatus) {
      SubscriptionUiStatus.trialExpired => AmberColorTokens.dangerStrong,
      SubscriptionUiStatus.active => AmberColorTokens.success,
      SubscriptionUiStatus.trialActive => AmberColorTokens.amber500,
      SubscriptionUiStatus.mock => AmberColorTokens.ink700,
    };

    return DecoratedBox(
      decoration: BoxDecoration(
        color: AmberColorTokens.surface0,
        borderRadius: AmberRadiusTokens.radius14,
        border: Border.all(color: toneColor.withValues(alpha: 0.28)),
      ),
      child: Padding(
        padding: AmberSpacingTokens.cardPadding,
        child: Row(
          children: <Widget>[
            Icon(AmberIconTokens.info, color: toneColor),
            const SizedBox(width: AmberSpacingTokens.space8),
            Expanded(
              child: Text(
                message,
                style: textTheme.bodyMedium?.copyWith(color: toneColor),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCards() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final monthlyCard = _PlanCard(
          title: PaywallCopyTr.monthlyPlanTitle,
          priceLabel: widget.monthlyPriceLabel,
          description: PaywallCopyTr.monthlyPlanDescription,
          selected: _selectedPlan == PaywallPlan.monthly,
          onTap: () {
            setState(() {
              _selectedPlan = PaywallPlan.monthly;
            });
          },
        );

        final yearlyCard = _PlanCard(
          title: PaywallCopyTr.yearlyPlanTitle,
          priceLabel: widget.yearlyPriceLabel,
          description: PaywallCopyTr.yearlyPlanDescription,
          badgeLabel: PaywallCopyTr.yearlyPlanBadge,
          selected: _selectedPlan == PaywallPlan.yearly,
          onTap: () {
            setState(() {
              _selectedPlan = PaywallPlan.yearly;
            });
          },
        );

        if (constraints.maxWidth < 460) {
          return Column(
            children: <Widget>[
              monthlyCard,
              const SizedBox(height: AmberSpacingTokens.space8),
              yearlyCard,
            ],
          );
        }

        return Row(
          children: <Widget>[
            Expanded(child: monthlyCard),
            const SizedBox(width: AmberSpacingTokens.space8),
            Expanded(child: yearlyCard),
          ],
        );
      },
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.subscriptionStatus});

  final SubscriptionUiStatus subscriptionStatus;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final subtitle = subscriptionStatus == SubscriptionUiStatus.trialExpired
        ? PaywallCopyTr.paywallSubtitleTrialExpired
        : PaywallCopyTr.paywallSubtitle;

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: AmberRadiusTokens.radius20,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[
            AmberColorTokens.amber100,
            AmberColorTokens.surface50,
          ],
        ),
        border: Border.all(color: AmberColorTokens.line200),
      ),
      child: Padding(
        padding: AmberSpacingTokens.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              PaywallCopyTr.paywallTitle,
              style: textTheme.headlineSmall,
            ),
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              subtitle,
              style: textTheme.bodyMedium?.copyWith(
                color: AmberColorTokens.ink700,
              ),
            ),
            const SizedBox(height: AmberSpacingTokens.space12),
            const _FeatureBullet(label: PaywallCopyTr.paywallFeatureLive),
            const SizedBox(height: AmberSpacingTokens.space8),
            const _FeatureBullet(label: PaywallCopyTr.paywallFeaturePriority),
            const SizedBox(height: AmberSpacingTokens.space8),
            const _FeatureBullet(
              label: PaywallCopyTr.paywallFeatureResync,
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureBullet extends StatelessWidget {
  const _FeatureBullet({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        const Icon(
          AmberIconTokens.checkCircle,
          color: AmberColorTokens.success,
          size: 18,
        ),
        const SizedBox(width: AmberSpacingTokens.space8),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.priceLabel,
    required this.description,
    required this.selected,
    required this.onTap,
    this.badgeLabel,
  });

  final String title;
  final String priceLabel;
  final String description;
  final bool selected;
  final VoidCallback onTap;
  final String? badgeLabel;

  @override
  Widget build(BuildContext context) {
    final borderColor =
        selected ? AmberColorTokens.amber500 : AmberColorTokens.line200;
    final backgroundColor =
        selected ? AmberColorTokens.amber100 : AmberColorTokens.surface0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: AmberRadiusTokens.radius20,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: AmberSpacingTokens.cardPadding,
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: AmberRadiusTokens.radius20,
            border: Border.all(
              color: borderColor,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  if (badgeLabel != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AmberSpacingTokens.space8,
                        vertical: 4,
                      ),
                      decoration: const BoxDecoration(
                        color: AmberColorTokens.ink900,
                        borderRadius: AmberRadiusTokens.radius28,
                      ),
                      child: Text(
                        badgeLabel!,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: AmberColorTokens.surface0,
                            ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: AmberSpacingTokens.space8),
              Text(
                priceLabel,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AmberSpacingTokens.space8),
              Text(
                description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AmberColorTokens.ink700,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
