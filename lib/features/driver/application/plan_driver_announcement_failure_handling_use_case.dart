import '../../../ui/tokens/error_feedback_tokens.dart';
import '../../subscription/presentation/paywall_copy_tr.dart';

class PlanDriverAnnouncementFailureHandlingCommand {
  const PlanDriverAnnouncementFailureHandlingCommand({
    required this.errorCode,
    required this.rawErrorMessage,
  });

  final String? errorCode;
  final String? rawErrorMessage;
}

class DriverAnnouncementFailureHandlingPlan {
  const DriverAnnouncementFailureHandlingPlan({
    required this.feedbackMessage,
    required this.shouldRedirectToPaywall,
  });

  final String feedbackMessage;
  final bool shouldRedirectToPaywall;
}

class PlanDriverAnnouncementFailureHandlingUseCase {
  const PlanDriverAnnouncementFailureHandlingUseCase();
  static const String _premiumInterceptFeedbackMessage =
      '${PaywallCopyTr.premiumInterceptBody} ${PaywallCopyTr.premiumInterceptCta}';

  DriverAnnouncementFailureHandlingPlan execute(
    PlanDriverAnnouncementFailureHandlingCommand command,
  ) {
    final isPremiumEntitlementError =
        _isPremiumEntitlementError(command.rawErrorMessage);

    switch (command.errorCode) {
      case 'permission-denied':
        if (isPremiumEntitlementError) {
          return const DriverAnnouncementFailureHandlingPlan(
            feedbackMessage: _premiumInterceptFeedbackMessage,
            shouldRedirectToPaywall: true,
          );
        }
        return const DriverAnnouncementFailureHandlingPlan(
          feedbackMessage: 'Duyuru gonderme yetkiniz yok.',
          shouldRedirectToPaywall: false,
        );
      case 'not-found':
        return const DriverAnnouncementFailureHandlingPlan(
          feedbackMessage: 'Route bulunamadi.',
          shouldRedirectToPaywall: false,
        );
      case 'failed-precondition':
        return const DriverAnnouncementFailureHandlingPlan(
          feedbackMessage: 'Bu route icin su anda duyuru gonderemezsiniz.',
          shouldRedirectToPaywall: false,
        );
      default:
        return const DriverAnnouncementFailureHandlingPlan(
          feedbackMessage: CoreErrorFeedbackTokens.announcementSendFailed,
          shouldRedirectToPaywall: false,
        );
    }
  }

  bool _isPremiumEntitlementError(String? rawErrorMessage) {
    final normalized = rawErrorMessage?.trim().toLowerCase() ?? '';
    if (normalized.isEmpty) {
      return false;
    }
    return normalized.contains('premium entitlement') ||
        normalized.contains('subscriptionstatus=');
  }
}
