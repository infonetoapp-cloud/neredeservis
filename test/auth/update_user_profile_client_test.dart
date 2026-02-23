import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/data/profile_callable_exception.dart';
import 'package:neredeservis/features/auth/data/update_user_profile_client.dart';

void main() {
  group('UpdateUserProfileClient', () {
    test('parses update result payload', () async {
      final client = UpdateUserProfileClient(
        invoker: (_, __) async => {
          'uid': 'u-1',
          'updatedAt': '2026-02-17T14:00:00Z',
        },
      );

      final result = await client.update(
        const UpdateUserProfileInput(displayName: 'New Name'),
      );

      expect(result.uid, 'u-1');
      expect(result.updatedAt, '2026-02-17T14:00:00Z');
    });

    test('maps callable errors to ProfileCallableException', () async {
      final client = UpdateUserProfileClient(
        invoker: (_, __) async => throw FirebaseException(
          plugin: 'firebase_functions',
          code: 'permission-denied',
          message: 'not owner',
        ),
      );

      expect(
        () => client.update(
          const UpdateUserProfileInput(displayName: 'Any'),
        ),
        throwsA(
          isA<ProfileCallableException>().having(
            (e) => e.code,
            'code',
            ProfileCallableErrorCode.permissionDenied,
          ),
        ),
      );
    });

    test('forwards optional photo fields when present', () async {
      String? callableName;
      Map<String, dynamic>? payload;
      final client = UpdateUserProfileClient(
        invoker: (name, input) async {
          callableName = name;
          payload = Map<String, dynamic>.from(input);
          return <String, dynamic>{'uid': 'u-1', 'updatedAt': 'ts'};
        },
      );

      await client.update(
        const UpdateUserProfileInput(
          displayName: 'Name',
          phone: '555',
          photoUrl: 'https://example.com/p.jpg',
          photoPath: 'users/u-1/p.jpg',
        ),
      );

      expect(callableName, 'updateUserProfile');
      expect(payload, <String, dynamic>{
        'displayName': 'Name',
        'phone': '555',
        'photoUrl': 'https://example.com/p.jpg',
        'photoPath': 'users/u-1/p.jpg',
      });
    });
  });
}
