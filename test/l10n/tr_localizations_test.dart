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

    expect(trialBanner, 'Deneme s\u00fcresi: 5 g\u00fcn kald\u0131');
    expect(
      pointLabel,
      'Baslangic koordinatlar\u0131 ge\u00e7erli aral\u0131kta olmal\u0131.',
    );
  });

  test('paywall copy keys are mapped to TR catalog (352D QA gate)', () {
    const paywallKeys = <String>[
      TrLocalizationKeys.paywallTitle,
      TrLocalizationKeys.paywallSubtitle,
      TrLocalizationKeys.paywallPrimaryCta,
      TrLocalizationKeys.paywallSecondaryCta,
      TrLocalizationKeys.paywallRestoreIos,
      TrLocalizationKeys.paywallRestoreAndroid,
      TrLocalizationKeys.paywallManage,
      TrLocalizationKeys.paywallDeleteInterceptorTitle,
      TrLocalizationKeys.paywallDeleteInterceptorBody,
      TrLocalizationKeys.paywallDeleteInterceptorCtaManage,
      TrLocalizationKeys.paywallDeleteInterceptorCtaCancel,
      TrLocalizationKeys.paywallTrialBannerActive,
      TrLocalizationKeys.paywallTrialBannerExpired,
      TrLocalizationKeys.paywallPurchaseSuccess,
      TrLocalizationKeys.paywallPurchaseCancelled,
      TrLocalizationKeys.paywallPurchaseErrorNetwork,
      TrLocalizationKeys.paywallRestoreSuccess,
      TrLocalizationKeys.paywallRestoreEmpty,
      TrLocalizationKeys.paywallRestoreError,
      TrLocalizationKeys.paywallSoftlockHint,
    ];

    for (final key in paywallKeys) {
      final valueFromText = TrLocalizations.text(key);
      final valueFromCatalog = TrLocalizations.valuesByKey[key];
      expect(valueFromCatalog, isNotNull);
      expect(valueFromText, valueFromCatalog);
    }
  });
}
