import '../../domain/application/trip_action_sync_service.dart';
import '../../domain/data/local_queue_repository.dart';

enum DriverAnnouncementSyncOutcomeState {
  synced,
  pendingSync,
  failed,
  queueError,
}

class DriverAnnouncementSyncCommand {
  const DriverAnnouncementSyncCommand({
    required this.ownerUid,
    required this.routeId,
    required this.customText,
    required this.idempotencyKey,
  });

  final String ownerUid;
  final String routeId;
  final String customText;
  final String idempotencyKey;
}

class DriverAnnouncementSyncOutcome {
  const DriverAnnouncementSyncOutcome({
    required this.state,
    this.shareUrl,
    this.errorCode,
    this.errorMessage,
  });

  final DriverAnnouncementSyncOutcomeState state;
  final String? shareUrl;
  final String? errorCode;
  final String? errorMessage;
}

typedef DriverAnnouncementSyncExecutor = Future<TripActionExecutionResult>
    Function(
  DriverAnnouncementSyncCommand command,
);

class ExecuteDriverAnnouncementSyncUseCase {
  ExecuteDriverAnnouncementSyncUseCase({
    TripActionSyncService? tripActionSyncService,
    DriverAnnouncementSyncExecutor? executor,
  })  : _tripActionSyncService = tripActionSyncService,
        _executor = executor;

  final TripActionSyncService? _tripActionSyncService;
  final DriverAnnouncementSyncExecutor? _executor;

  Future<DriverAnnouncementSyncOutcome> execute(
    DriverAnnouncementSyncCommand command,
  ) async {
    try {
      final execution = await _executeRemote(command);
      switch (execution.state) {
        case TripActionSyncState.synced:
          final shareUrl =
              (execution.responseData?['shareUrl'] as String?)?.trim();
          return DriverAnnouncementSyncOutcome(
            state: DriverAnnouncementSyncOutcomeState.synced,
            shareUrl: (shareUrl == null || shareUrl.isEmpty) ? null : shareUrl,
          );
        case TripActionSyncState.pendingSync:
          return DriverAnnouncementSyncOutcome(
            state: DriverAnnouncementSyncOutcomeState.pendingSync,
            errorCode: execution.errorCode,
            errorMessage: execution.errorMessage,
          );
        case TripActionSyncState.failed:
          return DriverAnnouncementSyncOutcome(
            state: DriverAnnouncementSyncOutcomeState.failed,
            errorCode: execution.errorCode,
            errorMessage: execution.errorMessage,
          );
      }
    } catch (_) {
      return const DriverAnnouncementSyncOutcome(
        state: DriverAnnouncementSyncOutcomeState.queueError,
      );
    }
  }

  Future<TripActionExecutionResult> _executeRemote(
    DriverAnnouncementSyncCommand command,
  ) {
    if (_executor != null) {
      return _executor(command);
    }
    final service = _tripActionSyncService;
    if (service == null) {
      throw StateError('TripActionSyncService or executor must be provided.');
    }
    return service.executeOrQueue(
      ownerUid: command.ownerUid,
      actionType: TripQueuedActionType.announcement,
      callableName: 'sendDriverAnnouncement',
      payload: <String, dynamic>{
        'routeId': command.routeId,
        'templateKey': 'custom_text',
        'customText': command.customText,
        'idempotencyKey': command.idempotencyKey,
      },
      idempotencyKey: command.idempotencyKey,
    );
  }
}
