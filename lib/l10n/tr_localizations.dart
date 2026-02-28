import 'tr_localization_keys.dart';

abstract final class TrLocalizations {
  static const emptyMapboxUnsupportedPlatform =
      'Harita bu platformda desteklenmiyor. Android veya iOS cihazda deneyin.';
  static const emptyMapboxTokenMissing =
      'Harita anahtarı eksik. GOOGLE_MAPS_API_KEY ayarını kontrol edin.';
  static const emptyPassengerStopsTitle = 'Durak listesi henüz hazır değil.';
  static const emptyPassengerStopsDescription =
      'Şoför rota duraklarını paylaştığında burada otomatik görünecek.';
  static const emptyGhostDriveSuggestionsTitle = 'Durak önerisi henüz yok.';
  static const emptyGhostDriveSuggestionsDescription =
      'Kaydı bitirdikten sonra otomatik durak adayları burada listelenecek.';

  static const formSrvCodeRequired = 'SRV kodu zorunlu.';
  static const formSrvCodeFormat =
      'SRV kodu 6 karakter olmalı (örnek: 8K2Q7M).';
  static const formFullNameMin2 = 'Ad soyad en az 2 karakter olmalı.';
  static const formPhoneMin7 = 'Telefon en az 7 karakter olmalı.';
  static const formPlateMin3 = 'Plaka en az 3 karakter olmalı.';
  static const formBoardingAreaRequired = 'Biniş alanı zorunlu.';
  static const formNotificationTimeFormat =
      'Bildirim saati HH:mm formatında olmalı.';
  static const formTimeFormat = 'Saat HH:mm formatında olmalı.';
  static const formRouteIdRequired = 'Route ID zorunlu.';
  static const formRouteIdRequiredForDelete = 'Silme için Route ID zorunlu.';
  static const formStopIdRequiredForDelete = 'Silme için Stop ID zorunlu.';
  static const formRouteNameMin2 = 'Rota adı en az 2 karakter olmalı.';
  static const formStartAddressMin3 =
      'Başlangıç adresi en az 3 karakter olmalı.';
  static const formEndAddressMin3 = 'Bitiş adresi en az 3 karakter olmalı.';
  static const formStartEndAddressMin3 =
      'Başlangıç ve bitiş adresi en az 3 karakter olmalı.';
  static const formCoordinatesNumeric = 'Koordinatlar sayısal olmalı.';
  static const formCoordinatesRange = 'Koordinatlar geçerli aralıkta olmalı.';
  static const formVirtualStopCoordinatesNumeric =
      'Sanal durak koordinatları sayısal olmalı.';
  static const formVirtualStopCoordinatesRange =
      'Sanal durak koordinatları geçerli aralıkta olmalı.';
  static const formStopNameMin2 = 'Durak adı en az 2 karakter olmalı.';
  static const formStopOrderRange =
      'Durak sırası 0-500 aralığında tam sayı olmalı.';
  static const formVacationUntilIso8601 =
      'Tatil bitiş tarihi ISO-8601 formatında olmalı.';
  static const formAtLeastOneFieldRequired = 'En az bir alan güncellenmeli.';
  static const formGhostFinishRecordingFirst = 'Kaydı önce bitirmen gerekiyor.';
  static const formGhostNeedsMinPoints =
      'Ghost Drive için en az 2 nokta kaydedilmeli.';
  static const formGhostNeedsSuggestionsApproval =
      'Kayıt öncesi başlangıç/bitiş ve durak önerilerini onayla.';
  static const formPointCoordinatesPair =
      '{field_label} koordinatları birlikte girilmeli.';
  static const formPointCoordinatesNumeric =
      '{field_label} koordinatları sayısal olmalı.';
  static const formPointCoordinatesRange =
      '{field_label} koordinatları geçerli aralıkta olmalı.';

  static const paywallSettingsCardTitle = 'Abonelik';
  static const paywallSettingsCardDescriptionTrialActive =
      'Deneme süren devam ediyor';
  static const paywallSettingsCardDescriptionActive = 'Premium aktif';
  static const paywallSettingsCardDescriptionExpired =
      'Deneme bitti, canlı mod kısıtlı';
  static const paywallTitle = 'Servisi gecikmeden göster';
  static const paywallSubtitle =
      'Premium ile konum ve bildirimler daha hızlı, daha tutarlı çalışır.';
  static const paywallSubtitleTrialExpired =
      "Deneme bitti. Veri kaybetmeden Premium'a geçebilirsin.";
  static const paywallFeatureLive = 'Daha sık güncelleme ile canlı takip';
  static const paywallFeaturePriority = 'Duyuru ve bildirim akışında öncelik';
  static const paywallFeatureResync =
      'Kesintide daha güçlü senkron geri dönüşü';
  static const paywallMonthlyPlanTitle = 'Aylık Plan';
  static const paywallYearlyPlanTitle = 'Yıllık Plan';
  static const paywallMonthlyPlanDescription = 'Esnek ödeme';
  static const paywallYearlyPlanDescription = 'Uzun dönem daha düşük maliyet';
  static const paywallYearlyPlanBadge = 'En avantajlı';
  static const paywallPrimaryCta = "Premium'u Aç";
  static const paywallSecondaryCta = 'Şimdilik Sonra';
  static const paywallManage = 'Manage Subscription';
  static const paywallLegalLine =
      'Abonelik otomatik yenilenir. İstediğin zaman store ayarlarından '
      'iptal edebilirsin.';
  static const paywallTrialBannerActive =
      'Deneme süresi: {days_left} gün kaldı';
  static const paywallTrialBannerExpired =
      'Denemen bitti. Canlı modu açmak için abonelik seç.';
  static const paywallTrialBannerMock =
      'V1.0 mock/read-only mod: gerçek tahsilat kapalı.';
  static const paywallRestoreIos = 'Restore Purchases';
  static const paywallRestoreAndroid = 'Satın Alımları Geri Yükle';
  static const paywallPremiumInterceptTitle = 'Bu özellik Premium';
  static const paywallPremiumInterceptBody =
      'Canlı ve tam hızlı takip için abonelik gerekli.';
  static const paywallPremiumInterceptCta = 'Planları Gör';
  static const paywallDeleteInterceptorTitle = 'Aktif aboneliğiniz var';
  static const paywallDeleteInterceptorBody =
      'Hesabı silmek ödemeyi durdurmaz. Önce store aboneliğinizi iptal etmelisiniz.';
  static const paywallDeleteInterceptorCtaManage = 'Manage Subscription';
  static const paywallDeleteInterceptorCtaCancel = 'Vazgeç';
  static const paywallPurchaseSuccess = 'Aboneliğin başarıyla açıldı.';
  static const paywallPurchaseCancelled = 'İşlem iptal edildi.';
  static const paywallPurchaseErrorNetwork =
      "Store'a ulaşılamadı. İnternetini kontrol et.";
  static const paywallRestoreSuccess =
      'Satın alımın geri yüklendi. Premium aktif.';
  static const paywallRestoreEmpty = 'Geri yüklenecek satın alım bulunamadı.';
  static const paywallRestoreError =
      'Geri yükleme şu an tamamlanamadı. Lütfen tekrar dene.';
  static const paywallSoftlockHint =
      'Canlı mod kısıtlı: güncellemeler daha seyrek gönderiliyor.';
  static const paywallManageRedirectNotice =
      'Store abonelik ekranına yönlendiriliyorsun.';

  // Non-ASCII sentinel used by UTF-8 gate tests.
  static const utf8Sentinel = 'ı ş ğ ü ö ç İ Ş Ğ Ü Ö Ç';

  static const Map<String, String> valuesByKey = <String, String>{
    TrLocalizationKeys.emptyMapboxUnsupportedPlatform:
        emptyMapboxUnsupportedPlatform,
    TrLocalizationKeys.emptyMapboxTokenMissing: emptyMapboxTokenMissing,
    TrLocalizationKeys.emptyPassengerStopsTitle: emptyPassengerStopsTitle,
    TrLocalizationKeys.emptyPassengerStopsDescription:
        emptyPassengerStopsDescription,
    TrLocalizationKeys.emptyGhostDriveSuggestionsTitle:
        emptyGhostDriveSuggestionsTitle,
    TrLocalizationKeys.emptyGhostDriveSuggestionsDescription:
        emptyGhostDriveSuggestionsDescription,
    TrLocalizationKeys.formSrvCodeRequired: formSrvCodeRequired,
    TrLocalizationKeys.formSrvCodeFormat: formSrvCodeFormat,
    TrLocalizationKeys.formFullNameMin2: formFullNameMin2,
    TrLocalizationKeys.formPhoneMin7: formPhoneMin7,
    TrLocalizationKeys.formPlateMin3: formPlateMin3,
    TrLocalizationKeys.formBoardingAreaRequired: formBoardingAreaRequired,
    TrLocalizationKeys.formNotificationTimeFormat: formNotificationTimeFormat,
    TrLocalizationKeys.formTimeFormat: formTimeFormat,
    TrLocalizationKeys.formRouteIdRequired: formRouteIdRequired,
    TrLocalizationKeys.formRouteIdRequiredForDelete:
        formRouteIdRequiredForDelete,
    TrLocalizationKeys.formStopIdRequiredForDelete: formStopIdRequiredForDelete,
    TrLocalizationKeys.formRouteNameMin2: formRouteNameMin2,
    TrLocalizationKeys.formStartAddressMin3: formStartAddressMin3,
    TrLocalizationKeys.formEndAddressMin3: formEndAddressMin3,
    TrLocalizationKeys.formStartEndAddressMin3: formStartEndAddressMin3,
    TrLocalizationKeys.formCoordinatesNumeric: formCoordinatesNumeric,
    TrLocalizationKeys.formCoordinatesRange: formCoordinatesRange,
    TrLocalizationKeys.formVirtualStopCoordinatesNumeric:
        formVirtualStopCoordinatesNumeric,
    TrLocalizationKeys.formVirtualStopCoordinatesRange:
        formVirtualStopCoordinatesRange,
    TrLocalizationKeys.formStopNameMin2: formStopNameMin2,
    TrLocalizationKeys.formStopOrderRange: formStopOrderRange,
    TrLocalizationKeys.formVacationUntilIso8601: formVacationUntilIso8601,
    TrLocalizationKeys.formAtLeastOneFieldRequired: formAtLeastOneFieldRequired,
    TrLocalizationKeys.formGhostFinishRecordingFirst:
        formGhostFinishRecordingFirst,
    TrLocalizationKeys.formGhostNeedsMinPoints: formGhostNeedsMinPoints,
    TrLocalizationKeys.formGhostNeedsSuggestionsApproval:
        formGhostNeedsSuggestionsApproval,
    TrLocalizationKeys.formPointCoordinatesPair: formPointCoordinatesPair,
    TrLocalizationKeys.formPointCoordinatesNumeric: formPointCoordinatesNumeric,
    TrLocalizationKeys.formPointCoordinatesRange: formPointCoordinatesRange,
    TrLocalizationKeys.paywallSettingsCardTitle: paywallSettingsCardTitle,
    TrLocalizationKeys.paywallSettingsCardDescriptionTrialActive:
        paywallSettingsCardDescriptionTrialActive,
    TrLocalizationKeys.paywallSettingsCardDescriptionActive:
        paywallSettingsCardDescriptionActive,
    TrLocalizationKeys.paywallSettingsCardDescriptionExpired:
        paywallSettingsCardDescriptionExpired,
    TrLocalizationKeys.paywallTitle: paywallTitle,
    TrLocalizationKeys.paywallSubtitle: paywallSubtitle,
    TrLocalizationKeys.paywallSubtitleTrialExpired: paywallSubtitleTrialExpired,
    TrLocalizationKeys.paywallFeatureLive: paywallFeatureLive,
    TrLocalizationKeys.paywallFeaturePriority: paywallFeaturePriority,
    TrLocalizationKeys.paywallFeatureResync: paywallFeatureResync,
    TrLocalizationKeys.paywallMonthlyPlanTitle: paywallMonthlyPlanTitle,
    TrLocalizationKeys.paywallYearlyPlanTitle: paywallYearlyPlanTitle,
    TrLocalizationKeys.paywallMonthlyPlanDescription:
        paywallMonthlyPlanDescription,
    TrLocalizationKeys.paywallYearlyPlanDescription:
        paywallYearlyPlanDescription,
    TrLocalizationKeys.paywallYearlyPlanBadge: paywallYearlyPlanBadge,
    TrLocalizationKeys.paywallPrimaryCta: paywallPrimaryCta,
    TrLocalizationKeys.paywallSecondaryCta: paywallSecondaryCta,
    TrLocalizationKeys.paywallManage: paywallManage,
    TrLocalizationKeys.paywallLegalLine: paywallLegalLine,
    TrLocalizationKeys.paywallTrialBannerActive: paywallTrialBannerActive,
    TrLocalizationKeys.paywallTrialBannerExpired: paywallTrialBannerExpired,
    TrLocalizationKeys.paywallTrialBannerMock: paywallTrialBannerMock,
    TrLocalizationKeys.paywallRestoreIos: paywallRestoreIos,
    TrLocalizationKeys.paywallRestoreAndroid: paywallRestoreAndroid,
    TrLocalizationKeys.paywallPremiumInterceptTitle:
        paywallPremiumInterceptTitle,
    TrLocalizationKeys.paywallPremiumInterceptBody: paywallPremiumInterceptBody,
    TrLocalizationKeys.paywallPremiumInterceptCta: paywallPremiumInterceptCta,
    TrLocalizationKeys.paywallDeleteInterceptorTitle:
        paywallDeleteInterceptorTitle,
    TrLocalizationKeys.paywallDeleteInterceptorBody:
        paywallDeleteInterceptorBody,
    TrLocalizationKeys.paywallDeleteInterceptorCtaManage:
        paywallDeleteInterceptorCtaManage,
    TrLocalizationKeys.paywallDeleteInterceptorCtaCancel:
        paywallDeleteInterceptorCtaCancel,
    TrLocalizationKeys.paywallPurchaseSuccess: paywallPurchaseSuccess,
    TrLocalizationKeys.paywallPurchaseCancelled: paywallPurchaseCancelled,
    TrLocalizationKeys.paywallPurchaseErrorNetwork: paywallPurchaseErrorNetwork,
    TrLocalizationKeys.paywallRestoreSuccess: paywallRestoreSuccess,
    TrLocalizationKeys.paywallRestoreEmpty: paywallRestoreEmpty,
    TrLocalizationKeys.paywallRestoreError: paywallRestoreError,
    TrLocalizationKeys.paywallSoftlockHint: paywallSoftlockHint,
    TrLocalizationKeys.paywallManageRedirectNotice: paywallManageRedirectNotice,
    TrLocalizationKeys.utf8Sentinel: utf8Sentinel,
  };

  static String text(String key, {Map<String, String> params = const {}}) {
    final template = valuesByKey[key] ?? key;
    if (params.isEmpty) {
      return template;
    }
    var resolved = template;
    for (final entry in params.entries) {
      resolved = resolved.replaceAll('{${entry.key}}', entry.value);
    }
    return resolved;
  }
}
