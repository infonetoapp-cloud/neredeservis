import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../../../config/app_flavor.dart';
import '../../../config/backend_api.dart';
import '../domain/auth_session.dart';
import 'auth_credential_gateway.dart';

const FlutterSecureStorage _hybridAuthSecureStorage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    sharedPreferencesName: 'neredeservis_secure_auth',
    preferencesKeyPrefix: 'ns_auth',
  ),
  webOptions: WebOptions(
    dbName: 'neredeservis_secure_auth',
    publicKey: 'neredeservis_secure_auth',
  ),
);

const Duration _backendTokenRefreshLeeway = Duration(minutes: 1);
const String _backendAuthMode = 'backend';

final IdentityToolkitAuthRuntime identityToolkitAuthRuntime =
    IdentityToolkitAuthRuntime._(
  storage: _hybridAuthSecureStorage,
  httpClient: http.Client(),
);

class IdentityToolkitAuthRuntime {
  IdentityToolkitAuthRuntime._({
    required FlutterSecureStorage storage,
    required http.Client httpClient,
  })  : _storage = storage,
        _httpClient = httpClient;

  final FlutterSecureStorage _storage;
  final http.Client _httpClient;
  final StreamController<AuthSession?> _sessionChanges =
      StreamController<AuthSession?>.broadcast();

  _StoredAuthSession? _session;
  AppFlavor _flavor = _resolveCompileTimeFlavor();
  bool _initialized = false;
  Future<void>? _initializationFuture;

  void configure({
    required AppFlavor flavor,
    String? webApiKey,
  }) {
    _flavor = flavor;
  }

  Future<void> initialize() {
    if (_initialized) {
      return Future<void>.value();
    }
    if (_initializationFuture != null) {
      return _initializationFuture!;
    }
    _initializationFuture = _loadPersistedSession();
    return _initializationFuture!;
  }

  AuthSession? get currentSession => _session?.toAuthSession();

  AuthUser? get currentUser {
    final session = _session;
    if (session == null) {
      return null;
    }
    return _buildAuthUser(session);
  }

  Stream<AuthSession?> authStateChanges() async* {
    await initialize();
    yield currentSession;
    yield* _sessionChanges.stream;
  }

  Future<AuthSession> signInAnonymously() async {
    final result = await signInAnonymouslyCredential();
    final user = result.user;
    if (user == null) {
      throw const AuthCredentialException(
        code: 'unknown',
        message: 'Anonim oturum baslatilamadi.',
      );
    }
    return AuthSession(
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
    );
  }

  Future<AuthCredentialResult> signInAnonymouslyCredential() async {
    final payload = await _postBackendJson(
      path: '/api/auth/anonymous',
      method: 'POST',
      body: const <String, dynamic>{},
    );
    return _applyBackendAuthPayload(payload);
  }

  Future<AuthCredentialResult> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    final payload = await _postBackendJson(
      path: '/api/auth/login',
      method: 'POST',
      body: <String, dynamic>{
        'email': email.trim(),
        'password': password,
      },
    );
    return _applyBackendAuthPayload(payload);
  }

  Future<AuthCredentialResult> createUserWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    final payload = await _postBackendJson(
      path: '/api/auth/register',
      method: 'POST',
      body: <String, dynamic>{
        'email': email.trim(),
        'password': password,
      },
    );
    return _applyBackendAuthPayload(payload);
  }

  Future<void> sendPasswordResetEmail({
    required String email,
  }) async {
    await _postBackendJson(
      path: '/api/auth/password-reset',
      method: 'POST',
      body: <String, dynamic>{'email': email.trim()},
    );
  }

  Future<AuthCredentialResult> signInWithGoogleTokens({
    String? idToken,
    String? accessToken,
  }) async {
    throw const AuthCredentialException(
      code: 'auth/operation-not-supported',
      message: 'Google girisi bu surumde desteklenmiyor.',
    );
  }

  Future<AuthCredentialResult> signInWithGoogleProvider() async {
    throw const AuthCredentialException(
      code: 'auth/operation-not-supported',
      message: 'Google girisi bu surumde desteklenmiyor.',
    );
  }

  Future<AuthCredentialResult> signInWithMicrosoftProvider() async {
    throw const AuthCredentialException(
      code: 'auth/operation-not-supported',
      message: 'Microsoft girisi bu surumde desteklenmiyor.',
    );
  }

  Future<void> signOut() async {
    await initialize();
    final current = _session;
    if (current?.authMode == _backendAuthMode &&
        current?.refreshToken != null &&
        current!.refreshToken!.isNotEmpty) {
      try {
        await _postBackendJson(
          path: '/api/auth/logout',
          method: 'POST',
          body: <String, dynamic>{'refreshToken': current.refreshToken},
        );
      } catch (_) {}
    }

    _session = null;
    await _storage.delete(key: _storageKey);
    _sessionChanges.add(null);
  }

  Future<String?> getIdToken({bool forceRefresh = false}) async {
    final session = await _refreshSessionIfNeeded(forceRefresh: forceRefresh);
    return session?.accessToken;
  }

  Future<void> reloadCurrentUser() async {
    await initialize();
    final current = _session;
    if (current == null) {
      throw const AuthCredentialException(
        code: 'user-not-found',
        message: 'Kullanici bulunamadi.',
      );
    }

    if (current.authMode == _backendAuthMode) {
      await _loadCurrentBackendSession(forceRefresh: true);
      return;
    }

    _session = null;
    await _storage.delete(key: _storageKey);
    _sessionChanges.add(null);
    throw const AuthCredentialException(
      code: 'invalid-credential',
      message: 'Oturum gecersiz. Tekrar giris yap.',
    );
  }

  Future<void> sendEmailVerification() async {
    final user = currentUser;
    if (user == null) {
      throw const AuthCredentialException(
        code: 'user-not-found',
        message: 'Kullanici bulunamadi.',
      );
    }
    final session = _session;
    if (session?.authMode == _backendAuthMode) {
      return;
    }
    throw const AuthCredentialException(
      code: 'auth/operation-not-supported',
      message: 'E-posta dogrulama bu surumde desteklenmiyor.',
    );
  }

  Future<void> updateDisplayName(String? displayName) async {
    await _updateCurrentAccount(
      displayName: displayName,
      updatePhotoUrl: false,
    );
  }

  Future<void> updatePhotoUrl(String? photoUrl) async {
    await _updateCurrentAccount(
      photoUrl: photoUrl,
      updateDisplayName: false,
    );
  }

  Future<void> _loadPersistedSession() async {
    try {
      final rawValue = await _storage.read(key: _storageKey);
      if (rawValue != null && rawValue.trim().isNotEmpty) {
        final decoded = jsonDecode(rawValue);
        if (decoded is Map<String, dynamic>) {
          _session = _StoredAuthSession.fromJson(decoded);
        } else if (decoded is Map<Object?, Object?>) {
          _session = _StoredAuthSession.fromJson(
            Map<String, dynamic>.from(decoded),
          );
        }
      }
    } catch (_) {
      _session = null;
    }

    if (_session != null && _session!.authMode != _backendAuthMode) {
      _session = null;
      await _storage.delete(key: _storageKey);
    }

    _initialized = true;
    _initializationFuture = null;
  }

  String get _storageKey => 'ns_identity_toolkit_session_${_flavor.name}_v2';

  AuthUser _buildAuthUser(_StoredAuthSession session) {
    return AuthUser(
      uid: session.uid,
      isAnonymous: session.isAnonymous,
      emailVerified: session.emailVerified,
      email: session.email,
      displayName: session.displayName,
      phoneNumber: session.phoneNumber,
      photoURL: session.photoUrl,
      idTokenReader: (forceRefresh) => getIdToken(forceRefresh: forceRefresh),
      reloader: reloadCurrentUser,
      emailVerificationSender: sendEmailVerification,
      displayNameUpdater: updateDisplayName,
      photoUrlUpdater: updatePhotoUrl,
    );
  }

  Future<_StoredAuthSession?> _refreshSessionIfNeeded({
    bool forceRefresh = false,
  }) async {
    await initialize();
    final current = _session;
    if (current == null) {
      return null;
    }

    if (current.authMode == _backendAuthMode) {
      final expiresSoon = DateTime.now().millisecondsSinceEpoch >=
          current.expiresAtMs - _backendTokenRefreshLeeway.inMilliseconds;
      if (!forceRefresh && !expiresSoon) {
        return current;
      }
      return _refreshBackendSession();
    }

    _session = null;
    await _storage.delete(key: _storageKey);
    _sessionChanges.add(null);
    return null;
  }

  Future<_StoredAuthSession> _refreshBackendSession() async {
    final current = _session;
    if (current == null || current.refreshToken == null || current.refreshToken!.isEmpty) {
      throw const AuthCredentialException(
        code: 'invalid-credential',
        message: 'Oturum gecersiz. Tekrar giris yap.',
      );
    }

    final payload = await _postBackendJson(
      path: '/api/auth/token/refresh',
      method: 'POST',
      body: <String, dynamic>{'refreshToken': current.refreshToken},
    );
    return _writeBackendSessionFromPayload(payload, emitChange: false);
  }

  Future<void> _loadCurrentBackendSession({bool forceRefresh = false}) async {
    final session = await _refreshSessionIfNeeded(forceRefresh: forceRefresh);
    if (session == null) {
      throw const AuthCredentialException(
        code: 'user-not-found',
        message: 'Kullanici bulunamadi.',
      );
    }

    final payload = await _sendBackendJson(
      'GET',
      resolveBackendApiUri('/api/auth/session'),
      body: null,
      authorizedAccessToken: session.accessToken,
    );
    final userPayload = _readUserPayload(payload);
    final nextSession = _mergeUserIntoSession(session, userPayload);
    await _writeSession(nextSession);
  }

  Future<void> _updateCurrentAccount({
    String? displayName,
    String? photoUrl,
    bool updateDisplayName = true,
    bool updatePhotoUrl = true,
  }) async {
    final session = await _refreshSessionIfNeeded();
    if (session == null) {
      throw const AuthCredentialException(
        code: 'user-not-found',
        message: 'Kullanici bulunamadi.',
      );
    }

    if (session.authMode == _backendAuthMode) {
      final body = <String, dynamic>{};
      if (updateDisplayName) {
        body['displayName'] = displayName;
      }
      if (updatePhotoUrl) {
        body['photoUrl'] = photoUrl;
      }

      final payload = await _sendBackendJson(
        'PATCH',
        resolveBackendApiUri('/api/auth/profile'),
        body: body,
        authorizedAccessToken: session.accessToken,
      );
      final userPayload = _readNestedUserPayload(payload, 'user') ?? _readUserPayload(payload);
      await _writeSession(_mergeUserIntoSession(session, userPayload));
      return;
    }
  }

  Future<AuthCredentialResult> _applyBackendAuthPayload(
    Map<String, dynamic> payload,
  ) async {
    await _writeBackendSessionFromPayload(payload);
    return AuthCredentialResult(user: currentUser);
  }

  Future<_StoredAuthSession> _writeBackendSessionFromPayload(
    Map<String, dynamic> payload, {
    bool emitChange = true,
  }) async {
    final userPayload = _readUserPayload(payload);
    final accessToken = _readRequiredString(
      payload,
      'accessToken',
      fallbackCode: 'invalid-credential',
    );
    final refreshToken = _readRequiredString(
      payload,
      'refreshToken',
      fallbackCode: 'invalid-credential',
    );
    final expiresInSeconds = _parseInt(payload['expiresInSeconds']);
    final safeExpiresInSeconds = expiresInSeconds > 0 ? expiresInSeconds : 3600;

    final session = _StoredAuthSession(
      authMode: _backendAuthMode,
      uid: userPayload.uid,
      isAnonymous: userPayload.isAnonymous,
      emailVerified: userPayload.emailVerified,
      email: userPayload.email,
      displayName: userPayload.displayName,
      phoneNumber: userPayload.phoneNumber,
      photoUrl: userPayload.photoUrl,
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAtMs: DateTime.now().millisecondsSinceEpoch +
          safeExpiresInSeconds * 1000,
      signInProvider: userPayload.signInProvider,
    );
    await _writeSession(session, emitChange: emitChange);
    return session;
  }

  _StoredAuthSession _mergeUserIntoSession(
    _StoredAuthSession session,
    _SessionUserSnapshot userPayload,
  ) {
    return session.copyWith(
      uid: userPayload.uid,
      isAnonymous: userPayload.isAnonymous,
      emailVerified: userPayload.emailVerified,
      email: userPayload.email,
      displayName: userPayload.displayName,
      phoneNumber: userPayload.phoneNumber,
      photoUrl: userPayload.photoUrl,
      signInProvider: userPayload.signInProvider,
    );
  }

  _SessionUserSnapshot _readUserPayload(Map<String, dynamic> payload) {
    return _readNestedUserPayload(payload, 'user') ??
        _SessionUserSnapshot.fromMap(payload);
  }

  _SessionUserSnapshot? _readNestedUserPayload(
    Map<String, dynamic> payload,
    String key,
  ) {
    final rawUser = payload[key];
    if (rawUser is Map<String, dynamic>) {
      return _SessionUserSnapshot.fromMap(rawUser);
    }
    if (rawUser is Map<Object?, Object?>) {
      return _SessionUserSnapshot.fromMap(
        Map<String, dynamic>.from(rawUser),
      );
    }
    return null;
  }

  Future<void> _writeSession(
    _StoredAuthSession session, {
    bool emitChange = true,
  }) async {
    _session = session;
    await _storage.write(
      key: _storageKey,
      value: jsonEncode(session.toJson()),
    );
    if (emitChange) {
      _sessionChanges.add(session.toAuthSession());
    }
  }

  Future<Map<String, dynamic>> _postBackendJson({
    required String path,
    required String method,
    Map<String, dynamic>? body,
  }) {
    return _sendBackendJson(
      method,
      resolveBackendApiUri(path),
      body: body,
    );
  }

  Future<Map<String, dynamic>> _sendBackendJson(
    String method,
    Uri uri, {
    Map<String, dynamic>? body,
    String? authorizedAccessToken,
  }) async {
    http.Response response;
    try {
      final request = http.Request(method, uri);
      request.headers['content-type'] = 'application/json; charset=utf-8';
      if (authorizedAccessToken != null && authorizedAccessToken.trim().isNotEmpty) {
        request.headers['authorization'] = 'Bearer ${authorizedAccessToken.trim()}';
      }
      if (body != null) {
        request.body = jsonEncode(body);
      }
      final streamedResponse = await _httpClient.send(request);
      response = await http.Response.fromStream(streamedResponse);
    } catch (error) {
      throw AuthCredentialException(
        code: 'network-request-failed',
        message: error.toString(),
      );
    }

    final payload = _decodeBackendEnvelope(response);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return payload;
    }

    final errorRecord = payload['error'];
    final errorPayload = errorRecord is Map<String, dynamic>
        ? errorRecord
        : (errorRecord is Map<Object?, Object?>
            ? Map<String, dynamic>.from(errorRecord)
            : const <String, dynamic>{});
    throw _mapBackendAuthError(
      response.statusCode,
      errorPayload['code'] as String?,
      errorPayload['message'] as String?,
    );
  }

  Map<String, dynamic> _decodeBackendEnvelope(http.Response response) {
    if (response.body.trim().isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(response.body);
    final envelope = decoded is Map<String, dynamic>
        ? decoded
        : (decoded is Map<Object?, Object?>
            ? Map<String, dynamic>.from(decoded)
            : <String, dynamic>{});
    final data = envelope['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    if (data is Map<Object?, Object?>) {
      return Map<String, dynamic>.from(data);
    }
    return envelope;
  }
}

class _StoredAuthSession {
  const _StoredAuthSession({
    required this.authMode,
    required this.uid,
    required this.isAnonymous,
    required this.emailVerified,
    required this.accessToken,
    required this.expiresAtMs,
    this.email,
    this.displayName,
    this.phoneNumber,
    this.photoUrl,
    this.refreshToken,
    this.signInProvider,
  });

  final String authMode;
  final String uid;
  final bool isAnonymous;
  final bool emailVerified;
  final String? email;
  final String? displayName;
  final String? phoneNumber;
  final String? photoUrl;
  final String accessToken;
  final String? refreshToken;
  final int expiresAtMs;
  final String? signInProvider;

  AuthSession toAuthSession() {
    return AuthSession(
      uid: uid,
      isAnonymous: isAnonymous,
      emailVerified: emailVerified,
    );
  }

  _StoredAuthSession copyWith({
    String? authMode,
    String? uid,
    bool? isAnonymous,
    bool? emailVerified,
    String? email,
    String? displayName,
    String? phoneNumber,
    String? photoUrl,
    String? accessToken,
    String? refreshToken,
    int? expiresAtMs,
    String? signInProvider,
  }) {
    return _StoredAuthSession(
      authMode: authMode ?? this.authMode,
      uid: uid ?? this.uid,
      isAnonymous: isAnonymous ?? this.isAnonymous,
      emailVerified: emailVerified ?? this.emailVerified,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      photoUrl: photoUrl ?? this.photoUrl,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      expiresAtMs: expiresAtMs ?? this.expiresAtMs,
      signInProvider: signInProvider ?? this.signInProvider,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'authMode': authMode,
      'uid': uid,
      'isAnonymous': isAnonymous,
      'emailVerified': emailVerified,
      'email': email,
      'displayName': displayName,
      'phoneNumber': phoneNumber,
      'photoUrl': photoUrl,
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'expiresAtMs': expiresAtMs,
      'signInProvider': signInProvider,
    };
  }

  factory _StoredAuthSession.fromJson(Map<String, dynamic> json) {
    final signInProvider = _normalizeOptionalString(json['signInProvider']);
    return _StoredAuthSession(
      authMode:
          _normalizeOptionalString(json['authMode']) ?? _backendAuthMode,
      uid: _normalizeOptionalString(json['uid']) ?? '',
      isAnonymous: json['isAnonymous'] == true || signInProvider == 'anonymous',
      emailVerified: json['emailVerified'] == true,
      email: _normalizeOptionalString(json['email']),
      displayName: _normalizeOptionalString(json['displayName']),
      phoneNumber: _normalizeOptionalString(json['phoneNumber']),
      photoUrl:
          _normalizeOptionalString(json['photoUrl']) ??
          _normalizeOptionalString(json['photoURL']),
      accessToken:
          _normalizeOptionalString(json['accessToken']) ??
          _normalizeOptionalString(json['idToken']) ??
          '',
      refreshToken: _normalizeOptionalString(json['refreshToken']),
      expiresAtMs: _parseInt(json['expiresAtMs']),
      signInProvider: signInProvider,
    );
  }
}

class _SessionUserSnapshot {
  const _SessionUserSnapshot({
    required this.uid,
    required this.isAnonymous,
    required this.emailVerified,
    this.email,
    this.displayName,
    this.phoneNumber,
    this.photoUrl,
    this.signInProvider,
  });

  final String uid;
  final bool isAnonymous;
  final bool emailVerified;
  final String? email;
  final String? displayName;
  final String? phoneNumber;
  final String? photoUrl;
  final String? signInProvider;

  factory _SessionUserSnapshot.fromMap(Map<String, dynamic> json) {
    final signInProvider = _normalizeOptionalString(json['signInProvider']);
    return _SessionUserSnapshot(
      uid: _normalizeOptionalString(json['uid']) ?? '',
      isAnonymous: json['isAnonymous'] == true || signInProvider == 'anonymous',
      emailVerified: json['emailVerified'] == true,
      email: _normalizeOptionalString(json['email']),
      displayName: _normalizeOptionalString(json['displayName']),
      phoneNumber:
          _normalizeOptionalString(json['phone']) ??
          _normalizeOptionalString(json['phoneNumber']),
      photoUrl:
          _normalizeOptionalString(json['photoUrl']) ??
          _normalizeOptionalString(json['photoURL']),
      signInProvider: signInProvider,
    );
  }
}

AuthCredentialException _mapBackendAuthError(
  int statusCode,
  String? code,
  String? message,
) {
  final normalizedCode = (code ?? '').trim().toLowerCase();
  final resolvedMessage = (message == null || message.trim().isEmpty)
      ? 'Kimlik dogrulama islemi basarisiz oldu.'
      : message.trim();

  if (statusCode == 401 || normalizedCode == 'unauthenticated') {
    return AuthCredentialException(
      code: 'invalid-credential',
      message: resolvedMessage,
    );
  }
  if (statusCode == 409 || normalizedCode == 'auth/email-already-in-use') {
    return AuthCredentialException(
      code: 'email-already-in-use',
      message: resolvedMessage,
    );
  }
  if (statusCode == 404 || normalizedCode == 'auth/user-not-found') {
    return AuthCredentialException(
      code: 'user-not-found',
      message: resolvedMessage,
    );
  }
  if (statusCode == 429 || normalizedCode == 'resource-exhausted') {
    return AuthCredentialException(
      code: 'too-many-requests',
      message: resolvedMessage,
    );
  }
  return AuthCredentialException(
    code: normalizedCode.isEmpty ? 'unknown' : normalizedCode,
    message: resolvedMessage,
  );
}

String _readRequiredString(
  Map<String, dynamic> json,
  String key, {
  required String fallbackCode,
}) {
  final value = _normalizeOptionalString(json[key]);
  if (value == null) {
    throw AuthCredentialException(
      code: fallbackCode,
      message: '$key alani eksik.',
    );
  }
  return value;
}

String? _normalizeOptionalString(Object? value) {
  if (value is! String) {
    return null;
  }
  final normalized = value.trim();
  return normalized.isEmpty ? null : normalized;
}

int _parseInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse('$value') ?? 0;
}

AppFlavor _resolveCompileTimeFlavor() {
  const rawFlavor = String.fromEnvironment('APP_FLAVOR', defaultValue: 'prod');
  switch (rawFlavor.toLowerCase()) {
    case 'dev':
      return AppFlavor.dev;
    case 'stg':
    case 'staging':
      return AppFlavor.stg;
    default:
      return AppFlavor.prod;
  }
}
