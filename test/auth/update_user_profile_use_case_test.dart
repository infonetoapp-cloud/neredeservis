import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/update_user_profile_use_case.dart';
import 'package:neredeservis/features/auth/data/update_user_profile_client.dart';

void main() {
  test('UpdateUserProfileUseCase delegates to client', () async {
    final useCase = UpdateUserProfileUseCase(
      client: UpdateUserProfileClient(
        invoker: (_, input) async => <String, dynamic>{
          'uid': (input['displayName'] as String?) ?? '',
          'updatedAt': '2026-02-23T12:00:00Z',
        },
      ),
    );

    final result = await useCase.execute(
      const UpdateUserProfileInput(displayName: 'u-1'),
    );

    expect(result.uid, 'u-1');
    expect(result.updatedAt, '2026-02-23T12:00:00Z');
  });
}
