class DeleteUserDataCommand {
  const DeleteUserDataCommand({
    required this.dryRun,
  });

  final bool dryRun;
}

class DeleteUserDataResult {
  const DeleteUserDataResult({
    required this.status,
    this.interceptorMessage,
    this.manageSubscriptionLabel,
    this.manageSubscriptionUrls,
  });

  final String status;
  final String? interceptorMessage;
  final String? manageSubscriptionLabel;
  final Map<String, dynamic>? manageSubscriptionUrls;
}

abstract class DeleteUserDataRepository {
  Future<DeleteUserDataResult> deleteUserData(DeleteUserDataCommand command);
}
