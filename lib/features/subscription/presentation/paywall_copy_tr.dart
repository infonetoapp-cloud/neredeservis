import 'package:flutter/foundation.dart' show TargetPlatform;

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

  static const String settingsCardTitle = 'Abonelik';
  static const String settingsCardDescriptionTrialActive =
      'Deneme suren devam ediyor';
  static const String settingsCardDescriptionActive = 'Premium aktif';
  static const String settingsCardDescriptionExpired =
      'Deneme bitti, canli mod kisitli';

  static const String paywallTitle = 'Servisi gecikmeden goster';
  static const String paywallSubtitle =
      'Premium ile konum ve bildirimler daha hizli, daha tutarli calisir.';
  static const String paywallSubtitleTrialExpired =
      "Deneme bitti. Veri kaybetmeden Premium'a gecebilirsin.";

  static const String paywallFeatureLive =
      'Daha sik guncelleme ile canli takip';
  static const String paywallFeaturePriority =
      'Duyuru ve bildirim akisinda oncelik';
  static const String paywallFeatureResync =
      'Kesintide daha guclu senkron geri donusu';

  static const String monthlyPlanTitle = 'Aylik Plan';
  static const String yearlyPlanTitle = 'Yillik Plan';
  static const String monthlyPlanDescription = 'Esnek odeme';
  static const String yearlyPlanDescription = 'Uzun donem daha dusuk maliyet';
  static const String yearlyPlanBadge = 'En avantajli';

  static const String primaryCta = "Premium'u Ac";
  static const String secondaryCta = 'Simdilik Sonra';
  static const String manageSubscription = 'Manage Subscription';

  static const String legalLine =
      'Abonelik otomatik yenilenir. Istedigin zaman store ayarlarindan '
      'iptal edebilirsin.';

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
      SubscriptionUiStatus.trialActive =>
        'Deneme suresi: $trialDaysLeft gun kaldi',
      SubscriptionUiStatus.trialExpired =>
        'Denemen bitti. Canli modu acmak icin abonelik sec.',
      SubscriptionUiStatus.active => settingsCardDescriptionActive,
      SubscriptionUiStatus.mock =>
        'V1.0 mock/read-only mod: gercek tahsilat kapali.',
    };
  }

  static String restoreLabelForPlatform(TargetPlatform platform) {
    if (platform == TargetPlatform.iOS) {
      return 'Restore Purchases';
    }
    return 'Satin Alimlari Geri Yukle';
  }
}
