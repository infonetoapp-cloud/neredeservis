import 'app_flavor.dart';

class AppEnvironment {
  const AppEnvironment({
    required this.flavor,
    required this.sentryEnabled,
    required this.sentryDsn,
    this.analyticsCollectionEnabled = false,
    required this.appCheckDebugProviderEnabled,
    required this.googleSignInServerClientId,
    required this.adaptyEnabled,
    required this.adaptyApiKey,
    this.googleMapsApiKey,
    required this.mapboxPublicToken,
    required this.mapboxTileCacheMb,
    required this.mapboxStylePreloadEnabled,
    this.externalBillingExceptionEnabled = false,
    this.externalBillingLegalApproved = false,
    this.externalBillingManageUrl,
  });

  final AppFlavor flavor;
  final bool sentryEnabled;
  final String? sentryDsn;
  final bool analyticsCollectionEnabled;
  final bool appCheckDebugProviderEnabled;
  final String? googleSignInServerClientId;
  final bool adaptyEnabled;
  final String? adaptyApiKey;
  final String? googleMapsApiKey;
  final String? mapboxPublicToken;
  final int mapboxTileCacheMb;
  final bool mapboxStylePreloadEnabled;
  final bool externalBillingExceptionEnabled;
  final bool externalBillingLegalApproved;
  final String? externalBillingManageUrl;

  String get name => flavor.name;
  bool get isProduction => flavor == AppFlavor.prod;
  bool get isExternalBillingExceptionActive =>
      externalBillingExceptionEnabled &&
      externalBillingLegalApproved &&
      externalBillingManageUrl != null;
}

AppEnvironment loadEnvironment({required AppFlavor entrypointFlavor}) {
  const compileTimeFlavor =
      String.fromEnvironment('APP_FLAVOR', defaultValue: '');
  final resolvedFlavor = compileTimeFlavor.isEmpty
      ? entrypointFlavor
      : _parseFlavorOrFallback(compileTimeFlavor, entrypointFlavor);

  const sentryDsnRaw = String.fromEnvironment('SENTRY_DSN', defaultValue: '');
  const sentryEnabledRaw =
      String.fromEnvironment('SENTRY_ENABLED', defaultValue: '');
  const analyticsCollectionEnabledRaw = String.fromEnvironment(
    'ANALYTICS_COLLECTION_ENABLED',
    defaultValue: '',
  );
  const adaptyApiKeyRaw =
      String.fromEnvironment('ADAPTY_API_KEY', defaultValue: '');
  const adaptyEnabledRaw =
      String.fromEnvironment('ADAPTY_ENABLED', defaultValue: '');
  const googleSignInServerClientIdRaw = String.fromEnvironment(
    'GOOGLE_SIGNIN_SERVER_CLIENT_ID',
    defaultValue: '',
  );
  const googleMapsApiKeyRaw =
      String.fromEnvironment('GOOGLE_MAPS_API_KEY', defaultValue: '');
  const mapboxPublicTokenRaw =
      String.fromEnvironment('MAPBOX_PUBLIC_TOKEN', defaultValue: '');
  const mapboxTileCacheMbRaw =
      String.fromEnvironment('MAPBOX_TILE_CACHE_MB', defaultValue: '256');
  const mapboxStylePreloadEnabledRaw = String.fromEnvironment(
    'MAPBOX_STYLE_PRELOAD_ENABLED',
    defaultValue: 'true',
  );
  const externalBillingExceptionEnabledRaw = String.fromEnvironment(
    'EXTERNAL_BILLING_EXCEPTION_ENABLED',
    defaultValue: '',
  );
  const externalBillingLegalApprovedRaw = String.fromEnvironment(
    'EXTERNAL_BILLING_LEGAL_APPROVED',
    defaultValue: '',
  );
  const externalBillingManageUrlRaw = String.fromEnvironment(
    'EXTERNAL_BILLING_MANAGE_URL',
    defaultValue: '',
  );

  final sentryDsn = sentryDsnRaw.trim().isEmpty ? null : sentryDsnRaw.trim();
  final sentryEnabledOverride = _parseBoolOrNull(sentryEnabledRaw);
  final sentryEnabled =
      (sentryEnabledOverride ?? resolvedFlavor != AppFlavor.dev) &&
          sentryDsn != null;
  final analyticsCollectionEnabledOverride =
      _parseBoolOrNull(analyticsCollectionEnabledRaw);
  final analyticsCollectionEnabled = resolvedFlavor == AppFlavor.prod
      ? false
      : (analyticsCollectionEnabledOverride ?? true);

  final adaptyApiKey =
      adaptyApiKeyRaw.trim().isEmpty ? null : adaptyApiKeyRaw.trim();
  final adaptyEnabledOverride = _parseBoolOrNull(adaptyEnabledRaw);
  final adaptyEnabled = (adaptyEnabledOverride ?? true) && adaptyApiKey != null;
  final googleSignInServerClientId =
      googleSignInServerClientIdRaw.trim().isEmpty
          ? _defaultGoogleSignInServerClientIdForFlavor(resolvedFlavor)
          : googleSignInServerClientIdRaw.trim();
  final googleMapsApiKey =
      googleMapsApiKeyRaw.trim().isEmpty ? null : googleMapsApiKeyRaw.trim();
  final mapboxPublicToken =
      mapboxPublicTokenRaw.trim().isEmpty ? null : mapboxPublicTokenRaw.trim();
  final mapboxTileCacheMb = _parsePositiveIntOrFallback(
    mapboxTileCacheMbRaw,
    fallback: 256,
  );
  final mapboxStylePreloadEnabled =
      _parseBoolOrNull(mapboxStylePreloadEnabledRaw) ?? true;
  final externalBillingExceptionEnabled =
      _parseBoolOrNull(externalBillingExceptionEnabledRaw) ?? false;
  final externalBillingLegalApproved =
      _parseBoolOrNull(externalBillingLegalApprovedRaw) ?? false;
  final externalBillingManageUrl = externalBillingManageUrlRaw.trim().isEmpty
      ? null
      : externalBillingManageUrlRaw.trim();

  final appCheckDebugProviderEnabled = resolvedFlavor != AppFlavor.prod;

  return AppEnvironment(
    flavor: resolvedFlavor,
    sentryEnabled: sentryEnabled,
    sentryDsn: sentryDsn,
    analyticsCollectionEnabled: analyticsCollectionEnabled,
    appCheckDebugProviderEnabled: appCheckDebugProviderEnabled,
    googleSignInServerClientId: googleSignInServerClientId,
    adaptyEnabled: adaptyEnabled,
    adaptyApiKey: adaptyApiKey,
    googleMapsApiKey: googleMapsApiKey,
    mapboxPublicToken: mapboxPublicToken,
    mapboxTileCacheMb: mapboxTileCacheMb,
    mapboxStylePreloadEnabled: mapboxStylePreloadEnabled,
    externalBillingExceptionEnabled: externalBillingExceptionEnabled,
    externalBillingLegalApproved: externalBillingLegalApproved,
    externalBillingManageUrl: externalBillingManageUrl,
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

int _parsePositiveIntOrFallback(
  String raw, {
  required int fallback,
}) {
  final parsed = int.tryParse(raw.trim());
  if (parsed == null || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

String? _defaultGoogleSignInServerClientIdForFlavor(AppFlavor flavor) {
  return switch (flavor) {
    AppFlavor.dev =>
      '882097896542-cvj97ajpvcddbof0feimf0r714a4jtcf.apps.googleusercontent.com',
    AppFlavor.stg =>
      '691483247415-ov8t420c8g8fim8dh3gioj04sc3119i3.apps.googleusercontent.com',
    AppFlavor.prod =>
      '705689926965-pr210q59r54v07ucd1sf08sr6ame8tch.apps.googleusercontent.com',
  };
}
