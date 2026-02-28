part of '../app_router.dart';

final Random _idempotencyRandom = Random.secure();
const String _supportEmailAddress = 'infonetoapp@gmail.com';
const String _iosAppUpdateUrl = 'https://apps.apple.com';
const String _androidAppUpdateUrl = 'https://play.google.com/store';
const String _iosManageSubscriptionUrl =
    'https://apps.apple.com/account/subscriptions';
const String _androidManageSubscriptionUrl =
    'https://play.google.com/store/account/subscriptions';
const String _authNextRoleQueryKey = 'nextRole';
const String _authNextRolePassenger = 'passenger';
const String _authNextRoleDriver = 'driver';
const String _roleSelectManualQueryKey = 'manual';
const String _authEmailModeQueryKey = 'mode';
const String _authEmailModeSignIn = 'signin';
const String _authEmailModeRegister = 'register';
const String _authEmailModeForgot = 'forgot';
const String _joinRoleQueryKey = 'role';
const String _joinNextPathQueryKey = 'next';
const String _joinErrorReasonQueryKey = 'reason';
const String _joinErrorNetwork = 'network';
const String _joinErrorInvalidQr = 'invalid_qr';
const String _joinErrorQrNotSupported = 'qr_not_supported';
const String _joinErrorCameraPermission = 'camera_permission';
const String _joinErrorSrvNotFound = 'srv_not_found';
const String _joinErrorJoinClosed = 'join_closed';
const String _joinErrorPermissionDenied = 'permission_denied';
const String _joinErrorRateLimited = 'rate_limited';
const String _joinErrorSessionExpired = 'session_expired';
const String _joinErrorUnknown = 'unknown';

const Set<String> _signedInEntryRoutes = <String>{
  AppRoutePath.splash,
  AppRoutePath.auth,
  AppRoutePath.authEmail,
  AppRoutePath.roleSelect,
};
