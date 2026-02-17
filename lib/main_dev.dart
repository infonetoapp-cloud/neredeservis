import 'bootstrap/app_entrypoint.dart';
import 'config/app_flavor.dart';

Future<void> main() async {
  await runFlavorEntrypoint(AppFlavor.dev);
}
