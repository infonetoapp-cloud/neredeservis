import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/indicators/core_heartbeat_indicator.dart';
import 'package:neredeservis/ui/screens/active_trip_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    String? syncStateLabel,
    String? manualInterventionMessage,
    String? offlineBannerLabel,
    String? latencyIndicatorLabel,
    VoidCallback? onRetrySyncTap,
    VoidCallback? onReportIssueTap,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: ActiveTripScreen(
        routeName: 'Darica -> GOSB',
        heartbeatState: HeartbeatState.yellow,
        syncStateLabel: syncStateLabel,
        manualInterventionMessage: manualInterventionMessage,
        offlineBannerLabel: offlineBannerLabel,
        latencyIndicatorLabel: latencyIndicatorLabel,
        onRetrySyncTap: onRetrySyncTap,
        onReportIssueTap: onReportIssueTap,
      ),
    );
  }

  testWidgets('shows retry and report actions for sync recovery panel',
      (WidgetTester tester) async {
    var retryTapped = false;
    var reportTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        syncStateLabel: 'Buluta yaziliyor...',
        manualInterventionMessage: 'Manuel mudahale gerekir.',
        onRetrySyncTap: () {
          retryTapped = true;
        },
        onReportIssueTap: () {
          reportTapped = true;
        },
      ),
    );
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.textContaining('Buluta'), findsOneWidget);
    expect(find.text('Manuel mudahale gerekir.'), findsOneWidget);
    expect(find.text('Tekrar senkronize et'), findsOneWidget);
    expect(find.text('Sorun bildir'), findsOneWidget);

    await tester.tap(find.text('Tekrar senkronize et'));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(find.text('Sorun bildir'));
    await tester.pump(const Duration(milliseconds: 100));

    expect(retryTapped, isTrue);
    expect(reportTapped, isTrue);
  });

  testWidgets('hides recovery actions when callbacks are not provided',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      buildTestApp(
        syncStateLabel: 'Buluta yaziliyor...',
        manualInterventionMessage: 'Manuel mudahale gerekir.',
      ),
    );
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Tekrar senkronize et'), findsNothing);
    expect(find.text('Sorun bildir'), findsNothing);
  });

  testWidgets('shows offline banner and latency indicator when provided',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      buildTestApp(
        offlineBannerLabel:
            'Internet baglantisi kesildi. Islem kuyruga alinacak.',
        latencyIndicatorLabel: 'Reconnect 5 sn',
      ),
    );
    await tester.pump(const Duration(milliseconds: 200));

    expect(
      find.text('Internet baglantisi kesildi. Islem kuyruga alinacak.'),
      findsOneWidget,
    );
    expect(find.textContaining('Reconnect 5 sn'), findsOneWidget);
  });
}
