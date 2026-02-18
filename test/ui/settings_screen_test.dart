import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/settings_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    VoidCallback? onSubscriptionTap,
    ValueChanged<bool>? onConsentTap,
    VoidCallback? onSupportTap,
    VoidCallback? onReportIssueTap,
    VoidCallback? onDeleteAccountTap,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: SettingsScreen(
        appName: 'NeredeServis Dev',
        onSubscriptionTap: onSubscriptionTap,
        onConsentTap: onConsentTap,
        onSupportTap: onSupportTap,
        onReportIssueTap: onReportIssueTap,
        onDeleteAccountTap: onDeleteAccountTap,
      ),
    );
  }

  testWidgets('settings screen renders core sections', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Abonelik'), findsOneWidget);
    expect(find.text('Acik Riza ve KVKK'), findsOneWidget);
    expect(find.text('Destek'), findsOneWidget);
    expect(find.text('Hesap'), findsOneWidget);
    expect(find.text('Hesabimi Sil'), findsOneWidget);
  });

  testWidgets('settings actions trigger callbacks', (WidgetTester tester) async {
    var subscriptionTapped = false;
    var consentCalls = 0;
    var supportTapped = false;
    var reportTapped = false;
    var deleteTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        onSubscriptionTap: () {
          subscriptionTapped = true;
        },
        onConsentTap: (_) {
          consentCalls++;
        },
        onSupportTap: () {
          supportTapped = true;
        },
        onReportIssueTap: () {
          reportTapped = true;
        },
        onDeleteAccountTap: () {
          deleteTapped = true;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Aboneligi Yonet'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(Switch).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Destek Merkezi'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sorun Bildir'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Hesabimi Sil'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Hesabimi Sil'));
    await tester.pumpAndSettle();

    expect(subscriptionTapped, isTrue);
    expect(consentCalls, greaterThan(0));
    expect(supportTapped, isTrue);
    expect(reportTapped, isTrue);
    expect(deleteTapped, isTrue);
  });
}
