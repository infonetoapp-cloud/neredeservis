import 'package:flutter/foundation.dart' show defaultTargetPlatform;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';
import 'package:neredeservis/ui/screens/paywall_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

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
      theme: CoreTheme.light(),
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
    return PaywallCopyTr.restoreLabelForPlatform(defaultTargetPlatform);
  }

  testWidgets('paywall renders core sections', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text(PaywallCopyTr.paywallTitle), findsOneWidget);
    expect(find.text(PaywallCopyTr.monthlyPlanTitle), findsOneWidget);
    expect(find.text(PaywallCopyTr.yearlyPlanTitle), findsOneWidget);
    expect(find.text(PaywallCopyTr.primaryCta), findsOneWidget);
    expect(find.text(PaywallCopyTr.secondaryCta), findsOneWidget);
    expect(find.text(expectedRestoreLabel()), findsOneWidget);
    expect(find.text(PaywallCopyTr.manageSubscription), findsOneWidget);
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

    expect(
      find.text(
        PaywallCopyTr.trialBannerForStatus(
          SubscriptionUiStatus.trialActive,
          trialDaysLeft: 3,
        ),
      ),
      findsOneWidget,
    );
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

    await tester.tap(find.text(PaywallCopyTr.monthlyPlanTitle));
    await tester.pumpAndSettle();
    await tester.tap(find.text(PaywallCopyTr.primaryCta));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(expectedRestoreLabel()));
    await tester.pumpAndSettle();
    await tester.tap(find.text(expectedRestoreLabel()));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(PaywallCopyTr.manageSubscription));
    await tester.pumpAndSettle();
    await tester.tap(find.text(PaywallCopyTr.manageSubscription));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(PaywallCopyTr.secondaryCta));
    await tester.pumpAndSettle();
    await tester.tap(find.text(PaywallCopyTr.secondaryCta));
    await tester.pumpAndSettle();

    expect(purchasedPlan, PaywallPlan.monthly);
    expect(restoreTapped, isTrue);
    expect(manageTapped, isTrue);
    expect(laterTapped, isTrue);
  });
}
