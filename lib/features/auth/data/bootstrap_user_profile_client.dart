import 'package:cloud_functions/cloud_functions.dart';

import '../domain/user_role.dart';

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
  }) : _functions = functions ??
            FirebaseFunctions.instanceFor(
              region: 'europe-west3',
            );

  final FirebaseFunctions _functions;

  Future<BootstrapUserProfileResult> bootstrap(
    BootstrapUserProfileInput input,
  ) async {
    final callable = _functions.httpsCallable('bootstrapUserProfile');
    final response = await callable.call(input.toJson());
    final payload = _extractData(response.data);
    return BootstrapUserProfileResult(
      uid: payload['uid'] as String? ?? '',
      role: userRoleFromRaw(payload['role'] as String?),
      createdOrUpdated: payload['createdOrUpdated'] as bool? ?? false,
    );
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
