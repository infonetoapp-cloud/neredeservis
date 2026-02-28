import '../../../ui/tokens/error_feedback_tokens.dart';

enum ProfileUpdateFeedbackHandlingAction {
  showInfoOnly,
  showInfoAndRethrow,
}

class PlanProfileUpdateFeedbackHandlingCommand {
  const PlanProfileUpdateFeedbackHandlingCommand({
    required this.succeeded,
    required this.successMessage,
  });

  final bool succeeded;
  final String successMessage;
}

class ProfileUpdateFeedbackHandlingPlan {
  const ProfileUpdateFeedbackHandlingPlan({
    required this.action,
    required this.feedbackMessage,
  });

  final ProfileUpdateFeedbackHandlingAction action;
  final String feedbackMessage;
}

class PlanProfileUpdateFeedbackHandlingUseCase {
  const PlanProfileUpdateFeedbackHandlingUseCase();

  ProfileUpdateFeedbackHandlingPlan execute(
    PlanProfileUpdateFeedbackHandlingCommand command,
  ) {
    if (command.succeeded) {
      return ProfileUpdateFeedbackHandlingPlan(
        action: ProfileUpdateFeedbackHandlingAction.showInfoOnly,
        feedbackMessage: command.successMessage,
      );
    }

    return const ProfileUpdateFeedbackHandlingPlan(
      action: ProfileUpdateFeedbackHandlingAction.showInfoAndRethrow,
      feedbackMessage: CoreErrorFeedbackTokens.profileUpdateFailed,
    );
  }
}
