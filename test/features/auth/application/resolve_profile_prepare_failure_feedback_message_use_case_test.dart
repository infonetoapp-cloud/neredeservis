import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_profile_prepare_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  test('ResolveProfilePrepareFailureFeedbackMessageUseCase returns core token',
      () {
    const useCase = ResolveProfilePrepareFailureFeedbackMessageUseCase();

    expect(
      useCase.execute(),
      CoreErrorFeedbackTokens.profilePrepareFailed,
    );
  });
}
