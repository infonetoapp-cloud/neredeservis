import 'package:flutter_test/flutter_test.dart';

import 'package:neredeservis/app/nerede_servis_app.dart';
import 'package:neredeservis/config/app_flavor.dart';

void main() {
  testWidgets('NeredeServis app renders selected flavor', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const NeredeServisApp(
        flavorConfig: AppFlavorConfig(
          flavor: AppFlavor.dev,
          appName: 'NeredeServis Dev',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('NeredeServis Dev'), findsOneWidget);
    expect(find.text('Splash / Router Skeleton (dev)'), findsOneWidget);
  });
}
