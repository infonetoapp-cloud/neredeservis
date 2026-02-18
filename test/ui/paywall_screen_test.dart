import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';
import 'package:neredeservis/ui/screens/paywall_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    SubscriptionUiStatus status = SubscriptionUiStatus.mock,
    int trialDaysLeft = 0,
    ValueChanged<PaywallPlan>? onPurchaseTap,
    VoidCallback? onRestoreTap,
    VoidCallback? onManageTap,
    VoidCallback? onLaterTap,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: PaywallScreen(
        appName: 'NeredeServis Dev',
        subscriptionStatus: status,
        trialDaysLeft: trialDaysLeft,
        onPurchaseTap: onPurchaseTap,
        onRestoreTap: onRestoreTap,
        onManageTap: onManageTap,
        onLaterTap: onLaterTap,
      ),
    );
  }

  String expectedRestoreLabel() {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return 'Restore Purchases';
    }
    return 'Satin Alimlari Geri Yukle';
  }

  testWidgets('paywall renders core sections', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Servisi gecikmeden goster'), findsOneWidget);
    expect(find.text('Aylik Plan'), findsOneWidget);
    expect(find.text('Yillik Plan'), findsOneWidget);
    expect(find.text("Premium'u Ac"), findsOneWidget);
    expect(find.text('Simdilik Sonra'), findsOneWidget);
    expect(find.text(expectedRestoreLabel()), findsOneWidget);
    expect(find.text('Manage Subscription'), findsOneWidget);
  });

  testWidgets('trial active message renders with day count', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      buildTestApp(
        status: SubscriptionUiStatus.trialActive,
        trialDaysLeft: 3,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Deneme suresi: 3 gun kaldi'), findsOneWidget);
  });

  testWidgets('paywall actions trigger callbacks', (WidgetTester tester) async {
    PaywallPlan? purchasedPlan;
    var restoreTapped = false;
    var manageTapped = false;
    var laterTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        onPurchaseTap: (plan) {
          purchasedPlan = plan;
        },
        onRestoreTap: () {
          restoreTapped = true;
        },
        onManageTap: () {
          manageTapped = true;
        },
        onLaterTap: () {
          laterTapped = true;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Aylik Plan'));
    await tester.pumpAndSettle();
    await tester.tap(find.text("Premium'u Ac"));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(expectedRestoreLabel()));
    await tester.pumpAndSettle();
    await tester.tap(find.text(expectedRestoreLabel()));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Manage Subscription'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Manage Subscription'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Simdilik Sonra'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Simdilik Sonra'));
    await tester.pumpAndSettle();

    expect(purchasedPlan, PaywallPlan.monthly);
    expect(restoreTapped, isTrue);
    expect(manageTapped, isTrue);
    expect(laterTapped, isTrue);
  });
}
