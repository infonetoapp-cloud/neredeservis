import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:neredeservis/ui/screens/email_auth_screen.dart';

void main() {
  testWidgets('sign in mode renders premium fields and google action', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: EmailAuthScreen(
          appName: 'NeredeServis',
          mode: EmailAuthMode.signIn,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ho\u015f Geldiniz'), findsOneWidget);
    expect(find.text('E-posta veya Telefon'), findsOneWidget);
    expect(find.text('\u015eifre'), findsOneWidget);
    expect(find.text('\u015eifremi Unuttum?'), findsOneWidget);
    expect(find.byKey(const Key('email_auth_google')), findsOneWidget);
    expect(find.byKey(const Key('email_auth_switch_mode')), findsOneWidget);
  });

  testWidgets('sign in helper actions trigger callbacks', (
    WidgetTester tester,
  ) async {
    var forgotTapped = false;
    var googleTapped = false;
    var microsoftTapped = false;
    var switchTapped = false;

    await tester.pumpWidget(
      MaterialApp(
        home: EmailAuthScreen(
          appName: 'NeredeServis',
          mode: EmailAuthMode.signIn,
          onForgotPasswordTap: () {
            forgotTapped = true;
          },
          onGoogleSignInTap: () {
            googleTapped = true;
          },
          onMicrosoftSignInTap: () {
            microsoftTapped = true;
          },
          onSwitchModeTap: () {
            switchTapped = true;
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('email_auth_forgot')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('email_auth_google')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('email_auth_google')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('email_auth_microsoft')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('email_auth_microsoft')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('email_auth_switch_mode')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('email_auth_switch_mode')));
    await tester.pumpAndSettle();

    expect(forgotTapped, isTrue);
    expect(googleTapped, isTrue);
    expect(microsoftTapped, isTrue);
    expect(switchTapped, isTrue);
  });

  testWidgets('register mode validates password confirmation', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: EmailAuthScreen(
          appName: 'NeredeServis',
          mode: EmailAuthMode.register,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'Sinan Test');
    await tester.enterText(find.byType(TextField).at(1), 'sinan@test.com');
    await tester.enterText(find.byType(TextField).at(2), '123456');
    await tester.enterText(find.byType(TextField).at(3), '654321');
    await tester.ensureVisible(find.byKey(const Key('email_auth_submit')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('email_auth_submit')));
    await tester.pumpAndSettle();

    expect(find.text('\u015eifre tekrar alan\u0131 e\u015fle\u015fmiyor.'),
        findsOneWidget);
  });

  testWidgets('register mode forwards form payload to submit callback', (
    WidgetTester tester,
  ) async {
    EmailAuthFormInput? captured;

    await tester.pumpWidget(
      MaterialApp(
        home: EmailAuthScreen(
          appName: 'NeredeServis',
          mode: EmailAuthMode.register,
          onSubmit: (input) async {
            captured = input;
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'Sinan Test');
    await tester.enterText(find.byType(TextField).at(1), 'sinan@test.com');
    await tester.enterText(find.byType(TextField).at(2), '123456');
    await tester.enterText(find.byType(TextField).at(3), '123456');
    await tester.ensureVisible(find.byKey(const Key('email_auth_submit')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('email_auth_submit')));
    await tester.pumpAndSettle();

    expect(captured, isNotNull);
    expect(captured!.email, 'sinan@test.com');
    expect(captured!.password, '123456');
    expect(captured!.displayName, 'Sinan Test');
  });

  testWidgets('forgot password mode submits email only payload', (
    WidgetTester tester,
  ) async {
    EmailAuthFormInput? captured;

    await tester.pumpWidget(
      MaterialApp(
        home: EmailAuthScreen(
          appName: 'NeredeServis',
          mode: EmailAuthMode.forgotPassword,
          onSubmit: (input) async {
            captured = input;
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('\u015eifremi Unuttum'), findsOneWidget);
    await tester.enterText(find.byType(TextField).first, 'sinan@test.com');
    await tester.tap(find.byKey(const Key('email_auth_submit')));
    await tester.pumpAndSettle();

    expect(captured, isNotNull);
    expect(captured!.email, 'sinan@test.com');
    expect(captured!.password, '');
    expect(captured!.displayName, isNull);
  });
}
