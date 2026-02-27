import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/l10n/tr_localization_keys.dart';
import 'package:neredeservis/l10n/tr_localizations.dart';

void main() {
  test('TR localization catalog exposes key-based values', () {
    expect(
      TrLocalizations.valuesByKey[TrLocalizationKeys.paywallTitle],
      equals(TrLocalizations.paywallTitle),
    );
    expect(
      TrLocalizations.valuesByKey[TrLocalizationKeys.formSrvCodeRequired],
      equals(TrLocalizations.formSrvCodeRequired),
    );
    expect(
      TrLocalizations
          .valuesByKey[TrLocalizationKeys.emptyMapboxUnsupportedPlatform],
      equals(TrLocalizations.emptyMapboxUnsupportedPlatform),
    );
  });

  test('TR localization text interpolation works for placeholders', () {
    final trialBanner = TrLocalizations.text(
      TrLocalizationKeys.paywallTrialBannerActive,
      params: const <String, String>{'days_left': '5'},
    );
    final pointLabel = TrLocalizations.text(
      TrLocalizationKeys.formPointCoordinatesRange,
      params: const <String, String>{'field_label': 'Baslangic'},
    );

    expect(trialBanner, 'Deneme suresi: 5 gun kaldi');
    expect(pointLabel, 'Baslangic koordinatlari gecerli aralikta olmali.');
  });

  test('paywall copy keys are mapped to TR catalog (352D QA gate)', () {
    const expected = <String, String>{
      TrLocalizationKeys.paywallTitle: 'Servisi gecikmeden goster',
      TrLocalizationKeys.paywallSubtitle:
          'Premium ile konum ve bildirimler daha hizli, daha tutarli calisir.',
      TrLocalizationKeys.paywallPrimaryCta: "Premium'u Ac",
      TrLocalizationKeys.paywallSecondaryCta: 'Simdilik Sonra',
      TrLocalizationKeys.paywallRestoreIos: 'Restore Purchases',
      TrLocalizationKeys.paywallRestoreAndroid: 'Satin Alimlari Geri Yukle',
      TrLocalizationKeys.paywallManage: 'Manage Subscription',
      TrLocalizationKeys.paywallDeleteInterceptorTitle:
          'Aktif aboneliginiz var',
      TrLocalizationKeys.paywallDeleteInterceptorBody:
          'Hesabi silmek odemeyi durdurmaz. Once store aboneliginizi iptal etmelisiniz.',
      TrLocalizationKeys.paywallDeleteInterceptorCtaManage:
          'Manage Subscription',
      TrLocalizationKeys.paywallDeleteInterceptorCtaCancel: 'Vazgec',
      TrLocalizationKeys.paywallTrialBannerActive:
          'Deneme suresi: {days_left} gun kaldi',
      TrLocalizationKeys.paywallTrialBannerExpired:
          'Denemen bitti. Canli modu acmak icin abonelik sec.',
      TrLocalizationKeys.paywallPurchaseSuccess: 'Aboneligin basariyla acildi.',
      TrLocalizationKeys.paywallPurchaseCancelled: 'Islem iptal edildi.',
      TrLocalizationKeys.paywallPurchaseErrorNetwork:
          "Store'a ulasilamadi. Internetini kontrol et.",
      TrLocalizationKeys.paywallRestoreSuccess:
          'Satin alimin geri yuklendi. Premium aktif.',
      TrLocalizationKeys.paywallRestoreEmpty:
          'Geri yuklenecek satin alim bulunamadi.',
      TrLocalizationKeys.paywallRestoreError:
          'Geri yukleme su an tamamlanamadi. Lutfen tekrar dene.',
      TrLocalizationKeys.paywallSoftlockHint:
          'Canli mod kisitli: guncellemeler daha seyrek gonderiliyor.',
    };

    for (final entry in expected.entries) {
      expect(TrLocalizations.text(entry.key), entry.value);
    }
  });
}
