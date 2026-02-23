import 'dart:async';

typedef DriverDeviceRegisterInvoker = Future<void> Function({
  required String deviceId,
  required String activeDeviceToken,
  required DateTime lastSeenAtUtc,
});

typedef DriverPushTokenFetcher = Future<String?> Function();

typedef DriverPushTokenRefreshStreamProvider = Stream<String> Function();

typedef DriverNowProvider = DateTime Function();

class DriverPushTokenRegistrationService {
  DriverPushTokenRegistrationService({
    required DriverDeviceRegisterInvoker registerInvoker,
    required DriverPushTokenFetcher tokenFetcher,
    required DriverPushTokenRefreshStreamProvider tokenRefreshStreamProvider,
    required String devicePlatformKey,
    DriverNowProvider? nowProvider,
  })  : _registerInvoker = registerInvoker,
        _tokenFetcher = tokenFetcher,
        _tokenRefreshStreamProvider = tokenRefreshStreamProvider,
        _devicePlatformKey = devicePlatformKey,
        _nowProvider = nowProvider ?? (() => DateTime.now().toUtc());

  static const String pendingTokenFallback = 'push_token_pending';

  final DriverDeviceRegisterInvoker _registerInvoker;
  final DriverPushTokenFetcher _tokenFetcher;
  final DriverPushTokenRefreshStreamProvider _tokenRefreshStreamProvider;
  final String _devicePlatformKey;
  final DriverNowProvider _nowProvider;

  StreamSubscription<String>? _tokenRefreshSubscription;
  String? _activeUid;
  String? _lastRegisteredToken;

  Future<void> registerForUid(String uid) async {
    _activeUid = uid;
    final token = await _tokenFetcher();
    await _registerToken(_normalizeToken(token));
    _bindTokenRefresh();
  }

  Future<void> dispose() async {
    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;
    _activeUid = null;
    _lastRegisteredToken = null;
  }

  Future<void> _registerToken(String normalizedToken) async {
    if (_activeUid == null) {
      return;
    }
    if (_lastRegisteredToken == normalizedToken) {
      return;
    }

    await _registerInvoker(
      deviceId:
          buildDeviceId(uid: _activeUid!, platformKey: _devicePlatformKey),
      activeDeviceToken: normalizedToken,
      lastSeenAtUtc: _nowProvider(),
    );
    _lastRegisteredToken = normalizedToken;
  }

  void _bindTokenRefresh() {
    _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = _tokenRefreshStreamProvider().listen(
      (token) {
        final normalized = _normalizeToken(token);
        unawaited(_registerToken(normalized));
      },
      onError: (_) {
        // Push token refresh failures are non-blocking.
      },
    );
  }

  String _normalizeToken(String? token) {
    final normalized = token?.trim();
    if (normalized == null || normalized.isEmpty) {
      return pendingTokenFallback;
    }
    return normalized;
  }
}

String buildDeviceId({
  required String uid,
  required String platformKey,
}) {
  final uidPrefix = uid.length <= 8 ? uid : uid.substring(0, 8);
  return '${platformKey}_$uidPrefix';
}
