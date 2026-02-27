import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/l10n/tr_localization_keys.dart';
import 'package:neredeservis/l10n/tr_localizations.dart';

void main() {
  test('UTF-8 sentinel keeps Turkish characters intact', () {
    const expectedChars = <String>['ı', 'ş', 'ğ', 'ü', 'ö', 'ç'];
    for (final character in expectedChars) {
      expect(TrLocalizations.utf8Sentinel.contains(character), isTrue);
    }
  });

  test('TR localization catalog does not include mojibake fragments', () {
    final values = TrLocalizations.valuesByKey.values.join(' ');
    const mojibakeFragments = <String>[
      'Ä±',
      'ÅŸ',
      'ÄŸ',
      'Ã¼',
      'Ã¶',
      'Ã§',
    ];
    for (final fragment in mojibakeFragments) {
      expect(values.contains(fragment), isFalse);
    }
  });

  testWidgets('UTF-8 sentinel renders without corruption', (tester) async {
    final sampleText = TrLocalizations.text(TrLocalizationKeys.utf8Sentinel);
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Text(sampleText),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text(sampleText), findsOneWidget);
  });
}
