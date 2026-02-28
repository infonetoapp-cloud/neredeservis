Future<void> runRouterDriverFinishTripConfirmationFlow<TUser,
    TActiveTripContext, TCommitOutcome>({
  required TUser? currentUser,
  required bool Function() isFinishing,
  required bool Function() isMounted,
  required void Function() onUserMissing,
  required void Function() onStartFinishing,
  required Future<bool> Function() confirmFinish,
  required void Function() onFinishCancelled,
  required Future<TActiveTripContext?> Function(TUser user)
      resolveActiveTripContext,
  required void Function() onActiveTripContextMissing,
  required Future<TCommitOutcome> Function(
    TUser user,
    TActiveTripContext activeTripContext,
  ) commitFinishTrip,
  required bool Function(TCommitOutcome outcome) isSyncedOutcome,
  required bool Function(TCommitOutcome outcome) isPendingSyncOutcome,
  required void Function(TActiveTripContext activeTripContext) onSynced,
  required void Function() onPendingSync,
  required void Function() onFailed,
}) async {
  if (isFinishing()) {
    return;
  }

  final user = currentUser;
  if (user == null) {
    onUserMissing();
    return;
  }

  onStartFinishing();

  final shouldCommit = await confirmFinish();
  if (!isMounted()) {
    return;
  }
  if (!shouldCommit) {
    onFinishCancelled();
    return;
  }

  final activeTripContext = await resolveActiveTripContext(user);
  if (!isMounted()) {
    return;
  }
  if (activeTripContext == null) {
    onActiveTripContextMissing();
    return;
  }

  final outcome = await commitFinishTrip(user, activeTripContext);
  if (!isMounted()) {
    return;
  }
  if (isSyncedOutcome(outcome)) {
    onSynced(activeTripContext);
    return;
  }
  if (isPendingSyncOutcome(outcome)) {
    onPendingSync();
    return;
  }
  onFailed();
}
