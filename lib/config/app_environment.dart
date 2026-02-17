import 'app_flavor.dart';

class AppEnvironment {
  const AppEnvironment({
    required this.flavor,
    required this.sentryEnabled,
    required this.sentryDsn,
    required this.appCheckDebugProviderEnabled,
  });

  final AppFlavor flavor;
  final bool sentryEnabled;
  final String? sentryDsn;
  final bool appCheckDebugProviderEnabled;

  String get name => flavor.name;
  bool get isProduction => flavor == AppFlavor.prod;
}

AppEnvironment loadEnvironment({required AppFlavor entrypointFlavor}) {
  const compileTimeFlavor = String.fromEnvironment('APP_FLAVOR', defaultValue: '');
  final resolvedFlavor = compileTimeFlavor.isEmpty
      ? entrypointFlavor
      : _parseFlavorOrFallback(compileTimeFlavor, entrypointFlavor);

  const sentryDsnRaw = String.fromEnvironment('SENTRY_DSN', defaultValue: '');
  const sentryEnabledRaw = String.fromEnvironment('SENTRY_ENABLED', defaultValue: '');

  final sentryDsn = sentryDsnRaw.trim().isEmpty ? null : sentryDsnRaw.trim();
  final sentryEnabledOverride = _parseBoolOrNull(sentryEnabledRaw);
  final sentryEnabled = (sentryEnabledOverride ?? true) &&
      resolvedFlavor != AppFlavor.dev &&
      sentryDsn != null;

  final appCheckDebugProviderEnabled = resolvedFlavor != AppFlavor.prod;

  return AppEnvironment(
    flavor: resolvedFlavor,
    sentryEnabled: sentryEnabled,
    sentryDsn: sentryDsn,
    appCheckDebugProviderEnabled: appCheckDebugProviderEnabled,
  );
}

AppFlavor _parseFlavorOrFallback(String raw, AppFlavor fallback) {
  switch (raw.toLowerCase()) {
    case 'dev':
      return AppFlavor.dev;
    case 'stg':
    case 'staging':
      return AppFlavor.stg;
    case 'prod':
    case 'production':
      return AppFlavor.prod;
    default:
      return fallback;
  }
}

bool? _parseBoolOrNull(String raw) {
  final normalized = raw.trim().toLowerCase();
  if (normalized.isEmpty) {
    return null;
  }
  if (normalized == '1' || normalized == 'true' || normalized == 'yes') {
    return true;
  }
  if (normalized == '0' || normalized == 'false' || normalized == 'no') {
    return false;
  }
  return null;
}
