import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/settings_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    VoidCallback? onSubscriptionTap,
    ValueChanged<bool>? onConsentTap,
    ValueChanged<bool>? onVoiceAlertTap,
    bool showDriverPhoneVisibilitySection = false,
    bool initialShowPhoneToPassengers = true,
    ValueChanged<bool>? onDriverPhoneVisibilityTap,
    VoidCallback? onSupportTap,
    VoidCallback? onReportIssueTap,
    VoidCallback? onDeleteAccountTap,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: SettingsScreen(
        appName: 'NeredeServis Dev',
        onSubscriptionTap: onSubscriptionTap,
        onConsentTap: onConsentTap,
        onVoiceAlertTap: onVoiceAlertTap,
        showDriverPhoneVisibilitySection: showDriverPhoneVisibilitySection,
        initialShowPhoneToPassengers: initialShowPhoneToPassengers,
        onDriverPhoneVisibilityTap: onDriverPhoneVisibilityTap,
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

    expect(find.text('Profil'), findsNothing);
    expect(find.text('Sefer'), findsNothing);
    expect(find.text('Sefer Gecmisi'), findsNothing);
    expect(find.textContaining('Hesap'), findsAtLeastNWidgets(1));
  });

  testWidgets('settings actions trigger callbacks', (
    WidgetTester tester,
  ) async {
    var consentCalls = 0;
    var voiceAlertCalls = 0;
    var supportTapped = false;
    var reportTapped = false;
    var deleteTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        onConsentTap: (_) {
          consentCalls++;
        },
        onVoiceAlertTap: (_) {
          voiceAlertCalls++;
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

    await tester.tap(find.byType(Switch).first);
    await tester.pumpAndSettle();
    await tester.tap(find.byType(Switch).at(1));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.textContaining('Destek Merkezi'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Destek Merkezi'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.textContaining('Sorun Bildir'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Sorun Bildir'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.textContaining('Hesab').first);
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Hesab').first);
    await tester.pumpAndSettle();

    expect(consentCalls, greaterThan(0));
    expect(voiceAlertCalls, greaterThan(0));
    expect(supportTapped, isTrue);
    expect(reportTapped, isTrue);
    expect(deleteTapped, isTrue);
  });

  testWidgets('shows driver phone visibility section when enabled', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      buildTestApp(showDriverPhoneVisibilitySection: true),
    );
    await tester.pumpAndSettle();

    expect(find.byType(SwitchListTile), findsWidgets);
  });

  testWidgets('driver phone visibility switch triggers callback', (
    WidgetTester tester,
  ) async {
    bool? latestValue;

    await tester.pumpWidget(
      buildTestApp(
        showDriverPhoneVisibilitySection: true,
        initialShowPhoneToPassengers: true,
        onDriverPhoneVisibilityTap: (value) {
          latestValue = value;
        },
      ),
    );
    await tester.pumpAndSettle();

    final driverVisibilityTile = find.byType(SwitchListTile).first;
    await tester.ensureVisible(driverVisibilityTile);
    await tester.pumpAndSettle();
    final driverVisibilitySwitch = find.descendant(
      of: driverVisibilityTile,
      matching: find.byType(Switch),
    );
    expect(driverVisibilitySwitch, findsOneWidget);
    await tester.tap(driverVisibilitySwitch);
    await tester.pumpAndSettle();

    expect(latestValue, isFalse);
  });
}
