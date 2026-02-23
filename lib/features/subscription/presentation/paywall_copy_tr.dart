import 'package:flutter/foundation.dart' show TargetPlatform;

import '../../../l10n/tr_localization_keys.dart';
import '../../../l10n/tr_localizations.dart';

/// Single source for V1.0 payment/paywall copy.
/// Source doc: docs/NeredeServis_Paywall_Copy_TR.md
enum SubscriptionUiStatus {
  trialActive,
  trialExpired,
  active,
  mock,
}

class PaywallCopyTr {
  const PaywallCopyTr._();

  static const String settingsCardTitleKey =
      TrLocalizationKeys.paywallSettingsCardTitle;
  static const String settingsCardTitle =
      TrLocalizations.paywallSettingsCardTitle;
  static const String settingsCardDescriptionTrialActiveKey =
      TrLocalizationKeys.paywallSettingsCardDescriptionTrialActive;
  static const String settingsCardDescriptionTrialActive =
      TrLocalizations.paywallSettingsCardDescriptionTrialActive;
  static const String settingsCardDescriptionActiveKey =
      TrLocalizationKeys.paywallSettingsCardDescriptionActive;
  static const String settingsCardDescriptionActive =
      TrLocalizations.paywallSettingsCardDescriptionActive;
  static const String settingsCardDescriptionExpiredKey =
      TrLocalizationKeys.paywallSettingsCardDescriptionExpired;
  static const String settingsCardDescriptionExpired =
      TrLocalizations.paywallSettingsCardDescriptionExpired;

  static const String paywallTitleKey = TrLocalizationKeys.paywallTitle;
  static const String paywallTitle = TrLocalizations.paywallTitle;
  static const String paywallSubtitleKey = TrLocalizationKeys.paywallSubtitle;
  static const String paywallSubtitle = TrLocalizations.paywallSubtitle;
  static const String paywallSubtitleTrialExpiredKey =
      TrLocalizationKeys.paywallSubtitleTrialExpired;
  static const String paywallSubtitleTrialExpired =
      TrLocalizations.paywallSubtitleTrialExpired;

  static const String paywallFeatureLiveKey =
      TrLocalizationKeys.paywallFeatureLive;
  static const String paywallFeatureLive = TrLocalizations.paywallFeatureLive;
  static const String paywallFeaturePriorityKey =
      TrLocalizationKeys.paywallFeaturePriority;
  static const String paywallFeaturePriority =
      TrLocalizations.paywallFeaturePriority;
  static const String paywallFeatureResyncKey =
      TrLocalizationKeys.paywallFeatureResync;
  static const String paywallFeatureResync =
      TrLocalizations.paywallFeatureResync;

  static const String monthlyPlanTitleKey =
      TrLocalizationKeys.paywallMonthlyPlanTitle;
  static const String monthlyPlanTitle =
      TrLocalizations.paywallMonthlyPlanTitle;
  static const String yearlyPlanTitleKey =
      TrLocalizationKeys.paywallYearlyPlanTitle;
  static const String yearlyPlanTitle = TrLocalizations.paywallYearlyPlanTitle;
  static const String monthlyPlanDescriptionKey =
      TrLocalizationKeys.paywallMonthlyPlanDescription;
  static const String monthlyPlanDescription =
      TrLocalizations.paywallMonthlyPlanDescription;
  static const String yearlyPlanDescriptionKey =
      TrLocalizationKeys.paywallYearlyPlanDescription;
  static const String yearlyPlanDescription =
      TrLocalizations.paywallYearlyPlanDescription;
  static const String yearlyPlanBadgeKey =
      TrLocalizationKeys.paywallYearlyPlanBadge;
  static const String yearlyPlanBadge = TrLocalizations.paywallYearlyPlanBadge;

  static const String primaryCtaKey = TrLocalizationKeys.paywallPrimaryCta;
  static const String primaryCta = TrLocalizations.paywallPrimaryCta;
  static const String secondaryCtaKey = TrLocalizationKeys.paywallSecondaryCta;
  static const String secondaryCta = TrLocalizations.paywallSecondaryCta;
  static const String manageSubscriptionKey = TrLocalizationKeys.paywallManage;
  static const String manageSubscription = TrLocalizations.paywallManage;

  static const String legalLineKey = TrLocalizationKeys.paywallLegalLine;
  static const String legalLine = TrLocalizations.paywallLegalLine;
  static const String premiumInterceptTitleKey =
      TrLocalizationKeys.paywallPremiumInterceptTitle;
  static const String premiumInterceptTitle =
      TrLocalizations.paywallPremiumInterceptTitle;
  static const String premiumInterceptBodyKey =
      TrLocalizationKeys.paywallPremiumInterceptBody;
  static const String premiumInterceptBody =
      TrLocalizations.paywallPremiumInterceptBody;
  static const String premiumInterceptCtaKey =
      TrLocalizationKeys.paywallPremiumInterceptCta;
  static const String premiumInterceptCta =
      TrLocalizations.paywallPremiumInterceptCta;
  static const String deleteInterceptorTitleKey =
      TrLocalizationKeys.paywallDeleteInterceptorTitle;
  static const String deleteInterceptorTitle =
      TrLocalizations.paywallDeleteInterceptorTitle;
  static const String deleteInterceptorBodyKey =
      TrLocalizationKeys.paywallDeleteInterceptorBody;
  static const String deleteInterceptorBody =
      TrLocalizations.paywallDeleteInterceptorBody;
  static const String deleteInterceptorCtaManageKey =
      TrLocalizationKeys.paywallDeleteInterceptorCtaManage;
  static const String deleteInterceptorCtaManage =
      TrLocalizations.paywallDeleteInterceptorCtaManage;
  static const String deleteInterceptorCtaCancelKey =
      TrLocalizationKeys.paywallDeleteInterceptorCtaCancel;
  static const String deleteInterceptorCtaCancel =
      TrLocalizations.paywallDeleteInterceptorCtaCancel;
  static const String purchaseSuccessKey =
      TrLocalizationKeys.paywallPurchaseSuccess;
  static const String purchaseSuccess = TrLocalizations.paywallPurchaseSuccess;
  static const String purchaseCancelledKey =
      TrLocalizationKeys.paywallPurchaseCancelled;
  static const String purchaseCancelled =
      TrLocalizations.paywallPurchaseCancelled;
  static const String purchaseErrorNetworkKey =
      TrLocalizationKeys.paywallPurchaseErrorNetwork;
  static const String purchaseErrorNetwork =
      TrLocalizations.paywallPurchaseErrorNetwork;
  static const String restoreSuccessKey =
      TrLocalizationKeys.paywallRestoreSuccess;
  static const String restoreSuccess = TrLocalizations.paywallRestoreSuccess;
  static const String restoreEmptyKey = TrLocalizationKeys.paywallRestoreEmpty;
  static const String restoreEmpty = TrLocalizations.paywallRestoreEmpty;
  static const String restoreErrorKey = TrLocalizationKeys.paywallRestoreError;
  static const String restoreError = TrLocalizations.paywallRestoreError;
  static const String softlockHintKey = TrLocalizationKeys.paywallSoftlockHint;
  static const String softlockHint = TrLocalizations.paywallSoftlockHint;
  static const String manageRedirectNoticeKey =
      TrLocalizationKeys.paywallManageRedirectNotice;
  static const String manageRedirectNotice =
      TrLocalizations.paywallManageRedirectNotice;

  static String settingsCardDescriptionForStatus(SubscriptionUiStatus status) {
    return switch (status) {
      SubscriptionUiStatus.trialActive => settingsCardDescriptionTrialActive,
      SubscriptionUiStatus.active => settingsCardDescriptionActive,
      SubscriptionUiStatus.trialExpired ||
      SubscriptionUiStatus.mock =>
        settingsCardDescriptionExpired,
    };
  }

  static String trialBannerForStatus(
    SubscriptionUiStatus status, {
    required int trialDaysLeft,
  }) {
    return switch (status) {
      SubscriptionUiStatus.trialActive => TrLocalizations.text(
          TrLocalizationKeys.paywallTrialBannerActive,
          params: <String, String>{'days_left': '$trialDaysLeft'},
        ),
      SubscriptionUiStatus.trialExpired =>
        TrLocalizations.text(TrLocalizationKeys.paywallTrialBannerExpired),
      SubscriptionUiStatus.active => settingsCardDescriptionActive,
      SubscriptionUiStatus.mock =>
        TrLocalizations.text(TrLocalizationKeys.paywallTrialBannerMock),
    };
  }

  static String restoreLabelForPlatform(TargetPlatform platform) {
    if (platform == TargetPlatform.iOS) {
      return TrLocalizations.text(TrLocalizationKeys.paywallRestoreIos);
    }
    return TrLocalizations.text(TrLocalizationKeys.paywallRestoreAndroid);
  }
}
