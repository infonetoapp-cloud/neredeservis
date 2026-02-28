import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:neredeservis/app/nerede_servis_app.dart';
import 'package:neredeservis/config/app_environment.dart';
import 'package:neredeservis/config/app_flavor.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('dev flavor shell renders on device',
      (WidgetTester tester) async {
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

    expect(find.text('NeredeServis Dev'), findsOneWidget);
    expect(find.text('Devam etmek için rolünü seç'), findsOneWidget);
    expect(find.text('Şoför Olarak Devam Et'), findsOneWidget);
    expect(find.text('Yolcu Olarak Devam Et'), findsOneWidget);
    expect(find.text('Misafir Olarak Devam Et'), findsOneWidget);
  });
}
