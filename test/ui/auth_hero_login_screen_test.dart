import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:neredeservis/ui/screens/auth_hero_login_screen.dart';

void main() {
  testWidgets('auth hero screen renders core CTAs without guest action', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: AuthHeroLoginScreen(
          appName: 'NeredeServis',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Giris Yap'), findsOneWidget);
    expect(find.text('Google ile Giris'), findsOneWidget);
    expect(find.text('Hesabin yok mu? Uye ol'), findsOneWidget);
    expect(find.textContaining('Misafir'), findsNothing);
    expect(find.textContaining('Video'), findsNothing);
  });

  testWidgets('auth hero layout stays readable on 16:9 ratio', (
    WidgetTester tester,
  ) async {
    const logicalSize = Size(360, 640); // 16:9
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = logicalSize;
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      const MaterialApp(
        home: AuthHeroLoginScreen(
          appName: 'NeredeServis',
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Giris Yap'), findsOneWidget);
    expect(find.text('Google ile Giris'), findsOneWidget);
    expect(find.text('Hesabin yok mu? Uye ol'), findsOneWidget);
    expect(tester.takeException(), isNull);

    final footerRect = tester.getRect(find.text('Hesabin yok mu? Uye ol'));
    expect(footerRect.bottom <= logicalSize.height, isTrue);
  });

  testWidgets('auth hero layout stays readable on 19.5:9 ratio', (
    WidgetTester tester,
  ) async {
    const logicalSize = Size(360, 780); // 19.5:9
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = logicalSize;
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      const MaterialApp(
        home: AuthHeroLoginScreen(
          appName: 'NeredeServis',
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Giris Yap'), findsOneWidget);
    expect(find.text('Google ile Giris'), findsOneWidget);
    expect(find.text('Hesabin yok mu? Uye ol'), findsOneWidget);
    expect(tester.takeException(), isNull);

    final footerRect = tester.getRect(find.text('Hesabin yok mu? Uye ol'));
    expect(footerRect.bottom <= logicalSize.height, isTrue);
  });

  testWidgets('auth hero layout stays readable on 20:9 ratio', (
    WidgetTester tester,
  ) async {
    const logicalSize = Size(360, 800); // 20:9
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = logicalSize;
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      const MaterialApp(
        home: AuthHeroLoginScreen(
          appName: 'NeredeServis',
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Giris Yap'), findsOneWidget);
    expect(find.text('Google ile Giris'), findsOneWidget);
    expect(find.text('Hesabin yok mu? Uye ol'), findsOneWidget);
    expect(tester.takeException(), isNull);

    final footerRect = tester.getRect(find.text('Hesabin yok mu? Uye ol'));
    expect(footerRect.bottom <= logicalSize.height, isTrue);
  });
}
