import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../config/backend_api.dart';
import '../../../core/errors/error_codes.dart';
import '../../../core/exceptions/app_exception.dart';
import '../../auth/data/auth_credential_gateway.dart';
import '../../auth/data/identity_toolkit_auth_credential_gateway.dart';

class MobileBackendApiClient {
  MobileBackendApiClient({
    AuthCredentialGateway? authCredentialGateway,
    http.Client? httpClient,
  })  : _authCredentialGateway =
            authCredentialGateway ?? IdentityToolkitAuthCredentialGateway(),
        _httpClient = httpClient ?? http.Client(),
        _ownsHttpClient = httpClient == null;

  final AuthCredentialGateway _authCredentialGateway;
  final http.Client _httpClient;
  final bool _ownsHttpClient;

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _sendJson(
      'GET',
      path,
      queryParameters: queryParameters,
    );
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  }) {
    return _sendJson(
      'POST',
      path,
      body: body,
      queryParameters: queryParameters,
    );
  }

  Future<Map<String, dynamic>> postBytes(
    String path, {
    required List<int> bodyBytes,
    required String contentType,
    Map<String, dynamic>? queryParameters,
  }) {
    return _sendJson(
      'POST',
      path,
      rawBodyBytes: bodyBytes,
      contentType: contentType,
      queryParameters: queryParameters,
    );
  }

  Future<Map<String, dynamic>> patchJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  }) {
    return _sendJson(
      'PATCH',
      path,
      body: body,
      queryParameters: queryParameters,
    );
  }

  Future<Map<String, dynamic>> putJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  }) {
    return _sendJson(
      'PUT',
      path,
      body: body,
      queryParameters: queryParameters,
    );
  }

  Future<Map<String, dynamic>> deleteJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  }) {
    return _sendJson(
      'DELETE',
      path,
      body: body,
      queryParameters: queryParameters,
    );
  }

  Future<Map<String, dynamic>> _sendJson(
    String method,
    String path, {
    Map<String, dynamic>? body,
    List<int>? rawBodyBytes,
    String? contentType,
    Map<String, dynamic>? queryParameters,
  }) async {
    final uri = resolveBackendApiUri(
      path,
      queryParameters: queryParameters,
    );

    http.Response response;
    try {
      response = await _sendAuthorizedRequest(
        method,
        uri,
        body: body,
        rawBodyBytes: rawBodyBytes,
        contentType: contentType,
        forceRefreshToken: false,
      );
      if (response.statusCode == 401) {
        response = await _sendAuthorizedRequest(
          method,
          uri,
          body: body,
          rawBodyBytes: rawBodyBytes,
          contentType: contentType,
          forceRefreshToken: true,
        );
      }
    } catch (error) {
      throw NetworkException(
        message: 'Sunucu baglantisi kurulamadi.',
        cause: error,
      );
    }

    final payload = _decodePayload(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = payload['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      if (data is Map<Object?, Object?>) {
        return Map<String, dynamic>.from(data);
      }
      return <String, dynamic>{};
    }

    final errorPayload = payload['error'];
    final errorCode =
        errorPayload is Map ? (errorPayload['code'] as String?)?.trim() : null;
    final errorMessage = errorPayload is Map
        ? (errorPayload['message'] as String?)?.trim()
        : null;

    throw _mapBackendError(
      statusCode: response.statusCode,
      code: errorCode,
      message: errorMessage,
    );
  }

  Future<http.Response> _sendAuthorizedRequest(
    String method,
    Uri uri, {
    required Map<String, dynamic>? body,
    required List<int>? rawBodyBytes,
    required String? contentType,
    required bool forceRefreshToken,
  }) async {
    final user = _authCredentialGateway.currentUser;
    if (user == null) {
      throw const AppException(
        code: ErrorCodes.unauthenticated,
        message: 'Oturum bulunamadi. Tekrar giris yap.',
      );
    }

    final idToken = await user.getIdToken(forceRefreshToken);
    if (idToken == null || idToken.trim().isEmpty) {
      throw const AppException(
        code: ErrorCodes.unauthenticated,
        message: 'Oturum bulunamadi. Tekrar giris yap.',
      );
    }

    final request = http.Request(method, uri);
    request.headers.addAll(_buildHeaders(idToken, contentType: contentType));
    if (rawBodyBytes != null) {
      request.bodyBytes = rawBodyBytes;
    } else if (body != null) {
      request.body = jsonEncode(body);
    }
    final streamedResponse = await _httpClient.send(request);
    return http.Response.fromStream(streamedResponse);
  }

  Map<String, String> _buildHeaders(String idToken, {String? contentType}) {
    return <String, String>{
      'content-type': contentType?.trim().isNotEmpty == true
          ? contentType!.trim()
          : 'application/json; charset=utf-8',
      'authorization': 'Bearer $idToken',
    };
  }

  Map<String, dynamic> _decodePayload(String rawBody) {
    if (rawBody.trim().isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(rawBody);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    if (decoded is Map<Object?, Object?>) {
      return Map<String, dynamic>.from(decoded);
    }
    return <String, dynamic>{};
  }

  void dispose() {
    if (_ownsHttpClient) {
      _httpClient.close();
    }
  }
}

AppException _mapBackendError({
  required int statusCode,
  String? code,
  String? message,
}) {
  final normalizedCode = code?.trim().toLowerCase();
  final resolvedMessage = (message == null || message.trim().isEmpty)
      ? 'Sunucu istegi basarisiz oldu.'
      : message.trim();

  if (statusCode == 401 || normalizedCode == 'unauthenticated') {
    return AppException(
      code: ErrorCodes.unauthenticated,
      message: resolvedMessage,
    );
  }
  if (statusCode == 403 || normalizedCode == 'permission-denied') {
    return PermissionException(message: resolvedMessage);
  }
  if (statusCode == 409 ||
      normalizedCode == 'conflict' ||
      normalizedCode == 'already-exists') {
    return ConflictException(message: resolvedMessage);
  }
  if (statusCode == 429 ||
      normalizedCode == 'resource-exhausted' ||
      normalizedCode == 'too-many-requests') {
    return AppException(
      code: 'resource-exhausted',
      message: resolvedMessage,
    );
  }
  if (statusCode == 400 ||
      statusCode == 404 ||
      statusCode == 412 ||
      normalizedCode == 'invalid-argument' ||
      normalizedCode == 'failed-precondition' ||
      normalizedCode == 'not-found') {
    return AppException(
      code: normalizedCode == 'not-found'
          ? ErrorCodes.invalidArgument
          : (code?.trim().toUpperCase() ?? ErrorCodes.invalidArgument),
      message: resolvedMessage,
    );
  }
  if (statusCode >= 500) {
    return AppException(
      code: ErrorCodes.unavailable,
      message: resolvedMessage,
    );
  }
  return AppException(
    code: code?.trim().toUpperCase() ?? ErrorCodes.unknown,
    message: resolvedMessage,
  );
}
