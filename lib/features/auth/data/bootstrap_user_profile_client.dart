import 'package:cloud_functions/cloud_functions.dart';
import 'package:neredeservis/config/firebase_regions.dart';

import '../domain/user_role.dart';
import 'profile_callable_exception.dart';

typedef CallableInvoker = Future<dynamic> Function(
  String callableName,
  Map<String, dynamic> input,
);

class BootstrapUserProfileInput {
  const BootstrapUserProfileInput({
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

class BootstrapUserProfileResult {
  const BootstrapUserProfileResult({
    required this.uid,
    required this.role,
    required this.createdOrUpdated,
  });

  final String uid;
  final UserRole role;
  final bool createdOrUpdated;
}

class BootstrapUserProfileClient {
  BootstrapUserProfileClient({
    FirebaseFunctions? functions,
    CallableInvoker? invoker,
  })  : _functions = functions,
        _invoker = invoker;

  FirebaseFunctions? _functions;
  final CallableInvoker? _invoker;

  FirebaseFunctions get _resolvedFunctions =>
      _functions ??=
          FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion);

  Future<BootstrapUserProfileResult> bootstrap(
    BootstrapUserProfileInput input,
  ) async {
    const callableName = 'bootstrapUserProfile';
    try {
      final rawResponse = await _call(callableName, input.toJson());
      final payload = _extractData(rawResponse);
      return BootstrapUserProfileResult(
        uid: payload['uid'] as String? ?? '',
        role: userRoleFromRaw(payload['role'] as String?),
        createdOrUpdated: payload['createdOrUpdated'] as bool? ?? false,
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
      throw StateError('bootstrapUserProfile returned non-map payload.');
    }

    final payload = Map<String, dynamic>.from(raw);
    final wrappedData = payload['data'];
    if (wrappedData is Map) {
      return Map<String, dynamic>.from(wrappedData);
    }
    return payload;
  }
}
