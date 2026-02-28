part of '../app_router.dart';

Future<void> _handlePaywallPurchaseTap(
  BuildContext context, {
  required String? source,
  required AppEnvironment environment,
}) async {
  final sourceLabel =
      (source == null || source.isEmpty) ? 'paywall' : 'paywall:$source';
  final billingFlowLabel = _resolveBillingFlowLabel(environment);
  _showInfo(
    context,
    'V1.0 mock/read-only mod: satin alma kapal? ($sourceLabel, $billingFlowLabel).',
  );
}

Future<void> _handlePaywallRestoreTap(BuildContext context) async {
  _showInfo(
    context,
    PaywallCopyTr.restoreEmpty,
  );
}

Future<void> _handlePaywallManageTap(
  BuildContext context, {
  required AppEnvironment environment,
}) async {
  final uri = _resolvePaywallManageUri(environment);
  _showInfo(context, PaywallCopyTr.manageRedirectNotice);
  final opened = await _tryOpenExternalUri(uri);
  if (!context.mounted) {
    return;
  }
  if (opened) {
    return;
  }
  _showInfo(
    context,
    'Abonelik y?netim sayfas? a??lamad?. Link: ${uri.toString()}',
  );
}

String _resolveBillingFlowLabel(AppEnvironment environment) {
  return _isRegionalExternalBillingExceptionEnabled(environment)
      ? 'regional_exception_enabled'
      : 'store_billing_default';
}

bool _isRegionalExternalBillingExceptionEnabled(AppEnvironment environment) {
  return environment.isExternalBillingExceptionActive;
}

Uri _resolvePaywallManageUri(AppEnvironment environment) {
  if (_isRegionalExternalBillingExceptionEnabled(environment)) {
    final customUrl = environment.externalBillingManageUrl;
    if (customUrl != null) {
      return Uri.parse(customUrl);
    }
  }
  return defaultTargetPlatform == TargetPlatform.iOS
      ? Uri.parse(_iosManageSubscriptionUrl)
      : Uri.parse(_androidManageSubscriptionUrl);
}

Future<String> _bootstrapCurrentProfile({String? preferredRole}) async {
  final user = _authCredentialGateway.currentUser;
  final result = await _bootstrapCurrentAuthProfileSessionUseCase.execute(
    BootstrapCurrentAuthProfileSessionCommand(
      displayName: _resolveDisplayName(user),
      preferredRole: _resolveAuthNextRole(preferredRole),
    ),
  );
  return result.role.name;
}

Future<void> _subscribePassengerRouteTopic(String routeId) async {
  try {
    await _routeTopicSubscriptionService.subscribeRouteTopic(routeId);
  } catch (error) {
    debugPrint('route topic subscribe skipped ($routeId): $error');
  }
}

Future<void> _unsubscribePassengerRouteTopic(String routeId) async {
  try {
    await _routeTopicSubscriptionService.unsubscribeRouteTopic(routeId);
  } catch (error) {
    debugPrint('route topic unsubscribe skipped ($routeId): $error');
  }
}

