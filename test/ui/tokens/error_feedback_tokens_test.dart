import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  test('error feedback tokens do not leak technical error codes', () {
    const samples = <String>[
      CoreErrorFeedbackTokens.emailSignInFailed,
      CoreErrorFeedbackTokens.registerFailed,
      CoreErrorFeedbackTokens.googleSignInStartFailed,
      CoreErrorFeedbackTokens.profilePrepareFailed,
      CoreErrorFeedbackTokens.profileCheckFailed,
      CoreErrorFeedbackTokens.guestProfilePrepareFailed,
      CoreErrorFeedbackTokens.profileUpdateFailed,
      CoreErrorFeedbackTokens.routeCreateFailed,
      CoreErrorFeedbackTokens.ghostRouteCreateFailed,
      CoreErrorFeedbackTokens.routeUpdateFailed,
      CoreErrorFeedbackTokens.stopSaveFailed,
      CoreErrorFeedbackTokens.stopDeleteFailed,
      CoreErrorFeedbackTokens.tripStartFailed,
      CoreErrorFeedbackTokens.tripFinishFailed,
      CoreErrorFeedbackTokens.announcementSendFailed,
      CoreErrorFeedbackTokens.supportReportFailed,
      CoreErrorFeedbackTokens.joinFailed,
      CoreErrorFeedbackTokens.guestSessionCreateFailed,
      CoreErrorFeedbackTokens.passengerSettingsSaveFailed,
      CoreErrorFeedbackTokens.driverProfileSaveFailed,
      CoreErrorFeedbackTokens.consentUpdateFailed,
      CoreErrorFeedbackTokens.phoneVisibilityUpdateFailed,
      CoreErrorFeedbackTokens.accountDeleteFailed,
    ];

    for (final text in samples) {
      expect(text.contains(r'${error.code}'), isFalse);
      expect(text.contains(r'($errorCode)'), isFalse);
    }
  });

  test('error feedback tokens keep actionable retry guidance', () {
    expect(
      CoreErrorFeedbackTokens.emailSignInFailed,
      contains('Lütfen tekrar dene.'),
    );
    expect(
      CoreErrorFeedbackTokens.joinFailed,
      contains('Lütfen tekrar dene.'),
    );
    expect(
      CoreErrorFeedbackTokens.accountDeleteFailed,
      contains('Lütfen tekrar dene.'),
    );
  });
}
