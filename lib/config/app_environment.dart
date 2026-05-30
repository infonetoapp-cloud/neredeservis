import 'app_flavor.dart';

class AppEnvironment {
  const AppEnvironment({
    required this.flavor,
    required this.sentryEnabled,
    required this.sentryDsn,
    this.analyticsCollectionEnabled = false,
    required this.appCheckDebugProviderEnabled,
    required this.firebaseWebApiKey,
    required this.adaptyEnabled,
    required this.adaptyApiKey,
    this.externalBillingExceptionEnabled = false,
    this.externalBillingLegalApproved = false,
    this.externalBillingManageUrl,
  });

  final AppFlavor flavor;
  final bool sentryEnabled;
  final String? sentryDsn;
  final bool analyticsCollectionEnabled;
  final bool appCheckDebugProviderEnabled;
  final String firebaseWebApiKey;
  final bool adaptyEnabled;
  final String? adaptyApiKey;
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
  const firebaseWebApiKeyRaw =
      String.fromEnvironment('FIREBASE_WEB_API_KEY', defaultValue: '');
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
  final firebaseWebApiKey = firebaseWebApiKeyRaw.trim().isEmpty
      ? _defaultFirebaseWebApiKeyForFlavor(resolvedFlavor)
      : firebaseWebApiKeyRaw.trim();
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
    firebaseWebApiKey: firebaseWebApiKey,
    adaptyEnabled: adaptyEnabled,
    adaptyApiKey: adaptyApiKey,
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

String _defaultFirebaseWebApiKeyForFlavor(AppFlavor flavor) {
  return switch (flavor) {
    AppFlavor.dev => 'AIzaSyDX4wqXAL1-LP0gtYJ_u7YfMyGwdH98nlw', //gitleaks:allow
    AppFlavor.stg => 'AIzaSyDGX_QJV5dCQVII6k13A3FZ-gUb8GkDTX4', //gitleaks:allow
    AppFlavor.prod => 'AIzaSyCzjmPyvmT8ZFv05mlzT_M1-kntXu8nskQ', //gitleaks:allow
  };
}
