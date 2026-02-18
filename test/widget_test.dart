import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:neredeservis/app/nerede_servis_app.dart';
import 'package:neredeservis/config/app_environment.dart';
import 'package:neredeservis/config/app_flavor.dart';

void main() {
  testWidgets('NeredeServis app renders selected flavor', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: NeredeServisApp(
          flavorConfig: AppFlavorConfig(
            flavor: AppFlavor.dev,
            appName: 'NeredeServis Dev',
          ),
          environment: AppEnvironment(
            flavor: AppFlavor.dev,
            sentryEnabled: false,
            sentryDsn: null,
            appCheckDebugProviderEnabled: true,
            adaptyEnabled: false,
            adaptyApiKey: null,
            mapboxPublicToken: null,
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('NeredeServis Dev'), findsOneWidget);
    expect(find.text('Giris Yap'), findsOneWidget);
    expect(find.text('Google ile Giris'), findsOneWidget);
  });
}
