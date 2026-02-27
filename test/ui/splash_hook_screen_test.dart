import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/splash_hook_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  setUp(() {
    SplashPlaybackPolicy.resetForTest();
  });

  testWidgets('splash hook screen renders core ui',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
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
    expect(find.textContaining('Splash / Router'), findsOneWidget);
    expect(find.textContaining('poster modunda devam'), findsOneWidget);
  });

  testWidgets('splash playback policy switches after first open', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: const SplashHookScreen(
          appName: 'NeredeServis Dev',
          flavorLabel: 'dev',
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Autoplay sessiz'), findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: const SplashHookScreen(
          appName: 'NeredeServis Dev',
          flavorLabel: 'dev',
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('modu aktif'), findsOneWidget);
  });

  testWidgets('splash poster fallback stays visible when asset load fails', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: const SplashHookScreen(
          appName: 'NeredeServis Dev',
          flavorLabel: 'dev',
          posterAssetPath: 'assets/onboarding/missing-poster.png',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.textContaining('poster modunda devam'), findsOneWidget);
  });
}
