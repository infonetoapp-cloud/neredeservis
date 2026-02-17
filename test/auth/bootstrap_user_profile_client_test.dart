import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/data/bootstrap_user_profile_client.dart';
import 'package:neredeservis/features/auth/data/profile_callable_exception.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  group('BootstrapUserProfileClient', () {
    test('parses top-level payload', () async {
      final client = BootstrapUserProfileClient(
        invoker: (_, __) async => {
          'uid': 'u-1',
          'role': 'driver',
          'createdOrUpdated': true,
        },
      );

      final result = await client.bootstrap(
        const BootstrapUserProfileInput(displayName: 'Sinan'),
      );

      expect(result.uid, 'u-1');
      expect(result.role, UserRole.driver);
      expect(result.createdOrUpdated, isTrue);
    });

    test('parses wrapped payload', () async {
      final client = BootstrapUserProfileClient(
        invoker: (_, __) async => {
          'requestId': 'r-1',
          'data': {
            'uid': 'u-2',
            'role': 'passenger',
            'createdOrUpdated': false,
          },
        },
      );

      final result = await client.bootstrap(
        const BootstrapUserProfileInput(displayName: 'User'),
      );

      expect(result.uid, 'u-2');
      expect(result.role, UserRole.passenger);
      expect(result.createdOrUpdated, isFalse);
    });

    test('forwards input fields to callable', () async {
      late String callableName;
      late Map<String, dynamic> forwardedInput;

      final client = BootstrapUserProfileClient(
        invoker: (name, input) async {
          callableName = name;
          forwardedInput = input;
          return {
            'uid': 'u-3',
            'role': 'guest',
            'createdOrUpdated': true,
          };
        },
      );

      await client.bootstrap(
        const BootstrapUserProfileInput(
          displayName: 'Name',
          phone: '+905551112233',
        ),
      );

      expect(callableName, 'bootstrapUserProfile');
      expect(forwardedInput['displayName'], 'Name');
      expect(forwardedInput['phone'], '+905551112233');
    });

    test('maps callable errors to ProfileCallableException', () async {
      final client = BootstrapUserProfileClient(
        invoker: (_, __) async => throw FirebaseException(
          plugin: 'firebase_functions',
          code: 'failed-precondition',
          message: 'role missing',
        ),
      );

      expect(
        () => client.bootstrap(
          const BootstrapUserProfileInput(displayName: 'Name'),
        ),
        throwsA(
          isA<ProfileCallableException>().having(
            (e) => e.code,
            'code',
            ProfileCallableErrorCode.failedPrecondition,
          ),
        ),
      );
    });
  });
}
