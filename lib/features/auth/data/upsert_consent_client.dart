import 'package:cloud_functions/cloud_functions.dart';

import '../../../config/firebase_regions.dart';
import 'bootstrap_user_profile_client.dart';

class UpsertConsentInput {
  const UpsertConsentInput({
    required this.privacyVersion,
    required this.kvkkTextVersion,
    required this.locationConsent,
    required this.platform,
  });

  final String privacyVersion;
  final String kvkkTextVersion;
  final bool locationConsent;
  final String platform;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'privacyVersion': privacyVersion,
        'kvkkTextVersion': kvkkTextVersion,
        'locationConsent': locationConsent,
        'platform': platform,
      };
}

class UpsertConsentClient {
  UpsertConsentClient({
    FirebaseFunctions? functions,
    CallableInvoker? invoker,
  })  : _functions = functions,
        _invoker = invoker;

  FirebaseFunctions? _functions;
  final CallableInvoker? _invoker;

  FirebaseFunctions get _resolvedFunctions => _functions ??=
      FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion);

  Future<void> upsert(UpsertConsentInput input) async {
    const callableName = 'upsertConsent';
    if (_invoker != null) {
      await _invoker.call(callableName, input.toJson());
      return;
    }
    final callable = _resolvedFunctions.httpsCallable(callableName);
    await callable.call(input.toJson());
  }
}
