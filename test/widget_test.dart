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
            googleSignInServerClientId: null,
            adaptyEnabled: false,
            adaptyApiKey: null,
            mapboxPublicToken: null,
            mapboxTileCacheMb: 256,
            mapboxStylePreloadEnabled: true,
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Nas\u0131l Devam Etmek\n\u0130stersin?'), findsOneWidget);
    expect(find.text('\u015eof\u00f6r Olarak Devam Et'), findsOneWidget);
    expect(find.text('Yolcu Olarak Devam Et'), findsOneWidget);
    expect(find.text('Misafir Olarak Devam Et'), findsOneWidget);
  });
}
