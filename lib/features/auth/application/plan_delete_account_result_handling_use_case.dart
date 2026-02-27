enum DeleteAccountResultHandlingAction {
  showBlockedSubscriptionDialog,
  showSuccessInfo,
}

class PlanDeleteAccountResultHandlingCommand {
  const PlanDeleteAccountResultHandlingCommand({
    required this.status,
    required this.interceptorMessage,
    required this.manageSubscriptionLabel,
    required this.defaultBlockedSubscriptionMessage,
    required this.defaultManageSubscriptionLabel,
    required this.successMessage,
  });

  final String status;
  final String? interceptorMessage;
  final String? manageSubscriptionLabel;
  final String defaultBlockedSubscriptionMessage;
  final String defaultManageSubscriptionLabel;
  final String successMessage;
}

class DeleteAccountResultHandlingPlan {
  const DeleteAccountResultHandlingPlan({
    required this.action,
    required this.feedbackMessage,
    this.manageSubscriptionLabel,
  });

  final DeleteAccountResultHandlingAction action;
  final String feedbackMessage;
  final String? manageSubscriptionLabel;
}

class PlanDeleteAccountResultHandlingUseCase {
  const PlanDeleteAccountResultHandlingUseCase();

  DeleteAccountResultHandlingPlan execute(
    PlanDeleteAccountResultHandlingCommand command,
  ) {
    if (command.status == 'blocked_subscription') {
      final interceptorMessage = command.interceptorMessage?.trim();
      final manageLabel = command.manageSubscriptionLabel?.trim();
      return DeleteAccountResultHandlingPlan(
        action: DeleteAccountResultHandlingAction.showBlockedSubscriptionDialog,
        feedbackMessage: (interceptorMessage?.isNotEmpty ?? false)
            ? interceptorMessage!
            : command.defaultBlockedSubscriptionMessage,
        manageSubscriptionLabel: (manageLabel?.isNotEmpty ?? false)
            ? manageLabel!
            : command.defaultManageSubscriptionLabel,
      );
    }

    return DeleteAccountResultHandlingPlan(
      action: DeleteAccountResultHandlingAction.showSuccessInfo,
      feedbackMessage: command.successMessage,
    );
  }
}
