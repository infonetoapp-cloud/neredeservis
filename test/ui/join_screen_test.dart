import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/join_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    JoinRole role = JoinRole.unknown,
    Future<void> Function(JoinBySrvFormInput input)? onJoinByCode,
    VoidCallback? onScanQrTap,
    VoidCallback? onContinueDriverTap,
    bool showAuthCta = false,
    String authCtaLabel = 'Giriş yap veya üye ol',
    VoidCallback? onAuthTap,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: JoinScreen(
        selectedRole: role,
        onJoinByCode: onJoinByCode,
        onScanQrTap: onScanQrTap,
        onContinueDriverTap: onContinueDriverTap,
        showAuthCta: showAuthCta,
        authCtaLabel: authCtaLabel,
        onAuthTap: onAuthTap,
      ),
    );
  }

  testWidgets('join screen renders SRV and QR actions', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Servise Katıl'), findsOneWidget);
    expect(find.text('SRV Kodu'), findsOneWidget);
    expect(find.text('Ad Soyad'), findsOneWidget);
    expect(find.text('Biniş Alanı'), findsOneWidget);
    expect(find.text('Bildirim Saati (HH:mm)'), findsOneWidget);
    expect(find.text('Koda Katıl'), findsOneWidget);
    expect(find.text('QR Tara'), findsOneWidget);
  });

  testWidgets('join screen validates empty code', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Koda Katıl'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Koda Katıl'));
    await tester.pumpAndSettle();

    expect(find.text('SRV kodu zorunlu.'), findsOneWidget);
  });

  testWidgets('join actions trigger callbacks', (WidgetTester tester) async {
    JoinBySrvFormInput? joinedInput;
    var qrTapped = false;
    var driverQuickTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        role: JoinRole.driver,
        onJoinByCode: (value) async {
          joinedInput = value;
        },
        onScanQrTap: () {
          qrTapped = true;
        },
        onContinueDriverTap: () {
          driverQuickTapped = true;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'SRV-8K2Q7M');
    await tester.enterText(find.byType(TextField).at(1), 'Ali Yılmaz');
    await tester.enterText(find.byType(TextField).at(3), 'Darıca Merkez');
    await tester.ensureVisible(find.text('Koda Katıl'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Koda Katıl'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('QR Tara'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('QR Tara'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Şoför Paneline Geç'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Şoför Paneline Geç'));
    await tester.pumpAndSettle();

    expect(joinedInput, isNotNull);
    expect(joinedInput!.srvCode, equals('8K2Q7M'));
    expect(joinedInput!.name, equals('Ali Yılmaz'));
    expect(joinedInput!.boardingArea, equals('Darıca Merkez'));
    expect(qrTapped, isTrue);
    expect(driverQuickTapped, isTrue);
  });

  testWidgets('join screen renders auth cta and triggers callback',
      (WidgetTester tester) async {
    var authTapped = false;
    await tester.pumpWidget(
      buildTestApp(
        role: JoinRole.passenger,
        showAuthCta: true,
        authCtaLabel: 'Farklı hesapla giriş yap',
        onAuthTap: () {
          authTapped = true;
        },
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Farklı hesapla giriş yap'), findsOneWidget);
    await tester.tap(find.text('Farklı hesapla giriş yap'));
    await tester.pumpAndSettle();
    expect(authTapped, isTrue);
  });

  testWidgets('guest mode hides role badge and shows help action',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestApp(role: JoinRole.guest));
    await tester.pumpAndSettle();

    expect(find.text('Misafir modu seçili'), findsNothing);
    expect(find.text('Yardım'), findsOneWidget);
    expect(find.text('Şoför Paneline Geç'), findsNothing);
  });

  testWidgets('guest help action opens guidance sheet',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestApp(role: JoinRole.guest));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Yardım'));
    await tester.pumpAndSettle();

    expect(find.text('Misafir Modu Nasıl Çalışır?'), findsOneWidget);
    expect(
      find.textContaining('günübirlik veya kısa süreli'),
      findsOneWidget,
    );
    expect(find.text('Anladım'), findsOneWidget);
  });

  testWidgets('guest role hides passenger fields and submits minimal payload',
      (WidgetTester tester) async {
    JoinBySrvFormInput? joinedInput;

    await tester.pumpWidget(
      buildTestApp(
        role: JoinRole.guest,
        onJoinByCode: (value) async {
          joinedInput = value;
        },
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ad Soyad'), findsNothing);
    expect(find.text('Biniş Alanı'), findsNothing);
    expect(
      find.textContaining('Misafir kullanımında SRV kodu yeterlidir.'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField).first, 'srv-8k2q7m');
    await tester.ensureVisible(find.text('Koda Katıl'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Koda Katıl'));
    await tester.pumpAndSettle();

    expect(joinedInput, isNotNull);
    expect(joinedInput!.srvCode, equals('8K2Q7M'));
    expect(joinedInput!.name, isEmpty);
    expect(joinedInput!.phone, isNull);
    expect(joinedInput!.boardingArea, equals('guest'));
    expect(joinedInput!.notificationTime, equals('07:00'));
  });
}
