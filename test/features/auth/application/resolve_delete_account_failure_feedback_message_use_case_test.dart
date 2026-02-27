import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_delete_account_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  test('ResolveDeleteAccountFailureFeedbackMessageUseCase returns core token',
      () {
    const useCase = ResolveDeleteAccountFailureFeedbackMessageUseCase();

    expect(
      useCase.execute(),
      CoreErrorFeedbackTokens.accountDeleteFailed,
    );
  });
}
