import 'bootstrap/app_bootstrap.dart';
import 'config/app_flavor.dart';

Future<void> main() async {
  await bootstrapNeredeServis(resolveFlavorFromEnvironment());
}
