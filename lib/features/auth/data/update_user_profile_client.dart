import 'package:cloud_functions/cloud_functions.dart';

import 'bootstrap_user_profile_client.dart';
import 'profile_callable_exception.dart';

class UpdateUserProfileInput {
  const UpdateUserProfileInput({
    required this.displayName,
    this.phone,
  });

  final String displayName;
  final String? phone;

  Map<String, dynamic> toJson() => {
        'displayName': displayName,
        if (phone != null && phone!.isNotEmpty) 'phone': phone,
      };
}

class UpdateUserProfileResult {
  const UpdateUserProfileResult({
    required this.uid,
    required this.updatedAt,
  });

  final String uid;
  final String updatedAt;
}

class UpdateUserProfileClient {
  UpdateUserProfileClient({
    FirebaseFunctions? functions,
    CallableInvoker? invoker,
  })  : _functions = functions,
        _invoker = invoker;

  FirebaseFunctions? _functions;
  final CallableInvoker? _invoker;

  FirebaseFunctions get _resolvedFunctions =>
      _functions ??= FirebaseFunctions.instanceFor(region: 'europe-west3');

  Future<UpdateUserProfileResult> update(
    UpdateUserProfileInput input,
  ) async {
    const callableName = 'updateUserProfile';
    try {
      final rawResponse = await _call(callableName, input.toJson());
      final payload = _extractData(rawResponse);
      return UpdateUserProfileResult(
        uid: payload['uid'] as String? ?? '',
        updatedAt: payload['updatedAt'] as String? ?? '',
      );
    } catch (error) {
      throw mapProfileCallableException(
        callableName: callableName,
        error: error,
      );
    }
  }

  Future<dynamic> _call(String callableName, Map<String, dynamic> input) async {
    if (_invoker != null) {
      return _invoker.call(callableName, input);
    }
    final callable = _resolvedFunctions.httpsCallable(callableName);
    final response = await callable.call(input);
    return response.data;
  }

  static Map<String, dynamic> _extractData(dynamic raw) {
    if (raw is! Map) {
      throw StateError('updateUserProfile returned non-map payload.');
    }

    final payload = Map<String, dynamic>.from(raw);
    final wrappedData = payload['data'];
    if (wrappedData is Map) {
      return Map<String, dynamic>.from(wrappedData);
    }
    return payload;
  }
}
