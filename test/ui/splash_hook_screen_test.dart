import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/splash_hook_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  setUp(() {
    SplashPlaybackPolicy.resetForTest();
  });

  testWidgets('splash hook screen renders core ui',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: const SplashHookScreen(
          appName: 'NeredeServis Dev',
          flavorLabel: 'dev',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('NeredeServis Dev'), findsOneWidget);
    expect(find.text('Atla'), findsOneWidget);
    expect(find.text('Devam Et'), findsOneWidget);
    expect(find.text('Splash / Router Skeleton (dev)'), findsOneWidget);
    expect(
        find.text('Video hazir degil, poster modunda devam.'), findsOneWidget);
  });

  testWidgets('splash playback policy switches after first open', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: const SplashHookScreen(
          appName: 'NeredeServis Dev',
          flavorLabel: 'dev',
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Autoplay sessiz, ilk acilista max 1 dongu.'),
        findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: const SplashHookScreen(
          appName: 'NeredeServis Dev',
          flavorLabel: 'dev',
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Hizli gecis modu aktif.'), findsOneWidget);
  });

  testWidgets('splash poster fallback stays visible when asset load fails', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: const SplashHookScreen(
          appName: 'NeredeServis Dev',
          flavorLabel: 'dev',
          posterAssetPath: 'assets/onboarding/missing-poster.png',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(
        find.text('Video hazir degil, poster modunda devam.'), findsOneWidget);
  });
}
