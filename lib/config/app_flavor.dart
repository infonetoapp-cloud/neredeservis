enum AppFlavor { dev, stg, prod }

class AppFlavorConfig {
  const AppFlavorConfig({
    required this.flavor,
    required this.appName,
  });

  final AppFlavor flavor;
  final String appName;
}

AppFlavor resolveFlavorFromEnvironment() {
  const rawFlavor = String.fromEnvironment('APP_FLAVOR', defaultValue: 'prod');
  switch (rawFlavor.toLowerCase()) {
    case 'dev':
      return AppFlavor.dev;
    case 'stg':
      return AppFlavor.stg;
    default:
      return AppFlavor.prod;
  }
}

AppFlavorConfig configForFlavor(AppFlavor flavor) {
  switch (flavor) {
    case AppFlavor.dev:
      return const AppFlavorConfig(
        flavor: AppFlavor.dev,
        appName: 'NeredeServis Dev',
      );
    case AppFlavor.stg:
      return const AppFlavorConfig(
        flavor: AppFlavor.stg,
        appName: 'NeredeServis Stg',
      );
    case AppFlavor.prod:
      return const AppFlavorConfig(
        flavor: AppFlavor.prod,
        appName: 'NeredeServis',
      );
  }
}
