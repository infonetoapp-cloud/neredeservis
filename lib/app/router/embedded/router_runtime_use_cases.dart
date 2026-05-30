part of '../app_router.dart';

final CreateDriverRouteUseCase _createDriverRouteUseCase =
    CreateDriverRouteUseCase(
  repository: BackendDriverRouteCreateRepository(),
);
final CommitCreateDriverRouteUseCase _commitCreateDriverRouteUseCase =
    CommitCreateDriverRouteUseCase(
  createDriverRouteUseCase: _createDriverRouteUseCase,
);
const PlanCreateDriverRouteFailureHandlingUseCase
    _planCreateDriverRouteFailureHandlingUseCase =
    PlanCreateDriverRouteFailureHandlingUseCase(
  planRouteMutationCreateFailureFeedbackUseCase:
      _planRouteMutationCreateFailureFeedbackUseCase,
  resolveRouteMutationCreateFailureFeedbackMessageUseCase:
      _resolveRouteMutationCreateFailureFeedbackMessageUseCase,
);
const PlanCreateDriverRoutePostCommitHandlingUseCase
    _planCreateDriverRoutePostCommitHandlingUseCase =
    PlanCreateDriverRoutePostCommitHandlingUseCase();
const PlanDriverRouteMutationReadinessUiOutcomeUseCase
    _planDriverRouteMutationReadinessUiOutcomeUseCase =
    PlanDriverRouteMutationReadinessUiOutcomeUseCase();
const ClassifyRouteMutationCreateFailureUseCase
    _classifyRouteMutationCreateFailureUseCase =
    ClassifyRouteMutationCreateFailureUseCase();
const PlanRouteMutationCreateFailureFeedbackUseCase
    _planRouteMutationCreateFailureFeedbackUseCase =
    PlanRouteMutationCreateFailureFeedbackUseCase(
  classifyRouteMutationCreateFailureUseCase:
      _classifyRouteMutationCreateFailureUseCase,
);
const ResolveRouteMutationCreateFailureFeedbackMessageUseCase
    _resolveRouteMutationCreateFailureFeedbackMessageUseCase =
    ResolveRouteMutationCreateFailureFeedbackMessageUseCase();
const PlanRouteMutationWriteFeedbackUseCase
    _planRouteMutationWriteFeedbackUseCase =
    PlanRouteMutationWriteFeedbackUseCase();
const ResolveRouteMutationWriteFeedbackMessageUseCase
    _resolveRouteMutationWriteFeedbackMessageUseCase =
    ResolveRouteMutationWriteFeedbackMessageUseCase();
const PlanRouteMutationWriteFailureHandlingUseCase
    _planRouteMutationWriteFailureHandlingUseCase =
    PlanRouteMutationWriteFailureHandlingUseCase(
  planRouteMutationWriteFeedbackUseCase: _planRouteMutationWriteFeedbackUseCase,
  resolveRouteMutationWriteFeedbackMessageUseCase:
      _resolveRouteMutationWriteFeedbackMessageUseCase,
);
const PlanRouteMutationWriteSuccessHandlingUseCase
    _planRouteMutationWriteSuccessHandlingUseCase =
    PlanRouteMutationWriteSuccessHandlingUseCase(
  planRouteMutationWriteFeedbackUseCase: _planRouteMutationWriteFeedbackUseCase,
  resolveRouteMutationWriteFeedbackMessageUseCase:
      _resolveRouteMutationWriteFeedbackMessageUseCase,
);
final UpdateDriverRouteUseCase _updateDriverRouteUseCase =
    UpdateDriverRouteUseCase(
  repository: BackendDriverRouteUpdateRepository(),
);
final CommitUpdateDriverRouteUseCase _commitUpdateDriverRouteUseCase =
    CommitUpdateDriverRouteUseCase(
  updateDriverRouteUseCase: _updateDriverRouteUseCase,
);
final UpsertDriverStopUseCase _upsertDriverStopUseCase =
    UpsertDriverStopUseCase(
  repository: BackendDriverStopMutationRepository(),
);
final CommitUpsertDriverStopUseCase _commitUpsertDriverStopUseCase =
    CommitUpsertDriverStopUseCase(
  upsertDriverStopUseCase: _upsertDriverStopUseCase,
);
final DeleteDriverStopUseCase _deleteDriverStopUseCase =
    DeleteDriverStopUseCase(
  repository: BackendDriverStopMutationRepository(),
);
final CommitDeleteDriverStopUseCase _commitDeleteDriverStopUseCase =
    CommitDeleteDriverStopUseCase(
  deleteDriverStopUseCase: _deleteDriverStopUseCase,
);
final SubmitPassengerSkipTodayUseCase _submitPassengerSkipTodayUseCase =
    SubmitPassengerSkipTodayUseCase(
  repository: BackendPassengerSkipTodayRepository(),
);
final UpdatePassengerSettingsUseCase _updatePassengerSettingsUseCase =
    UpdatePassengerSettingsUseCase(
  repository: BackendPassengerSettingsUpdateRepository(),
);
final LeavePassengerRouteUseCase _leavePassengerRouteUseCase =
    LeavePassengerRouteUseCase(
  repository: BackendPassengerRouteLeaveRepository(),
);
final JoinPassengerRouteBySrvCodeUseCase _joinPassengerRouteBySrvCodeUseCase =
    JoinPassengerRouteBySrvCodeUseCase(
  repository: BackendPassengerRouteJoinRepository(),
);
final CommitPassengerJoinBySrvCodeUseCase _commitPassengerJoinBySrvCodeUseCase =
    CommitPassengerJoinBySrvCodeUseCase(
  joinPassengerRouteBySrvCodeUseCase: _joinPassengerRouteBySrvCodeUseCase,
);
final CreateGuestSessionUseCase _createGuestSessionUseCase =
    CreateGuestSessionUseCase(
  repository: BackendGuestSessionCreateRepository(),
);
final CommitCreateGuestSessionUseCase _commitCreateGuestSessionUseCase =
    CommitCreateGuestSessionUseCase(
  createGuestSessionUseCase: _createGuestSessionUseCase,
);
const ResolveJoinBySrvCodeFailureFeedbackMessageUseCase
    _resolveJoinBySrvCodeFailureFeedbackMessageUseCase =
    ResolveJoinBySrvCodeFailureFeedbackMessageUseCase();
const ResolvePassengerJoinFailureRouteReasonUseCase
    _resolvePassengerJoinFailureRouteReasonUseCase =
    ResolvePassengerJoinFailureRouteReasonUseCase();
const ResolveGuestJoinFailureRouteReasonUseCase
    _resolveGuestJoinFailureRouteReasonUseCase =
    ResolveGuestJoinFailureRouteReasonUseCase();
const ResolveGuestSessionCreateFailureFeedbackMessageUseCase
    _resolveGuestSessionCreateFailureFeedbackMessageUseCase =
    ResolveGuestSessionCreateFailureFeedbackMessageUseCase();
const PlanPassengerJoinFailureHandlingUseCase
    _planPassengerJoinFailureHandlingUseCase =
    PlanPassengerJoinFailureHandlingUseCase(
  resolveJoinBySrvCodeFailureFeedbackMessageUseCase:
      _resolveJoinBySrvCodeFailureFeedbackMessageUseCase,
  resolvePassengerJoinFailureRouteReasonUseCase:
      _resolvePassengerJoinFailureRouteReasonUseCase,
);
const PlanGuestSessionCreateFailureHandlingUseCase
    _planGuestSessionCreateFailureHandlingUseCase =
    PlanGuestSessionCreateFailureHandlingUseCase(
  resolveGuestJoinFailureRouteReasonUseCase:
      _resolveGuestJoinFailureRouteReasonUseCase,
  resolveGuestSessionCreateFailureFeedbackMessageUseCase:
      _resolveGuestSessionCreateFailureFeedbackMessageUseCase,
);
const PlanPassengerRouteLeaveOutcomeHandlingUseCase
    _planPassengerRouteLeaveOutcomeHandlingUseCase =
    PlanPassengerRouteLeaveOutcomeHandlingUseCase();
const ResolvePassengerActionFailureFeedbackMessageUseCase
    _resolvePassengerActionFailureFeedbackMessageUseCase =
    ResolvePassengerActionFailureFeedbackMessageUseCase();
const ResolvePassengerSkipTodayFailureFeedbackMessageUseCase
    _resolvePassengerSkipTodayFailureFeedbackMessageUseCase =
    ResolvePassengerSkipTodayFailureFeedbackMessageUseCase();
final ReadPrimaryPassengerMembershipUseCase
    _readPrimaryPassengerMembershipUseCase =
    ReadPrimaryPassengerMembershipUseCase(
  repository: BackendPassengerPrimaryMembershipLookupRepository(),
);
final ObservePassengerTrackingSnapshotsUseCase
    _observePassengerTrackingSnapshotsUseCase =
    ObservePassengerTrackingSnapshotsUseCase(
  repository: BackendPassengerTrackingSnapshotRepository(),
);
final UpsertDriverProfileUseCase _upsertDriverProfileUseCase =
    UpsertDriverProfileUseCase(
  repository: BackendDriverProfileUpsertRepository(),
);
final ReadDriverProfileRecordUseCase _readDriverProfileRecordUseCase =
    ReadDriverProfileRecordUseCase(
  repository: BackendCurrentDriverRepository(),
);
const PrepareDriverPhoneVisibilityToggleUpsertCommandUseCase
    _prepareDriverPhoneVisibilityToggleUpsertCommandUseCase =
    PrepareDriverPhoneVisibilityToggleUpsertCommandUseCase();
final ResolveDriverEntryDestinationUseCase
    _resolveDriverEntryDestinationUseCase =
    ResolveDriverEntryDestinationUseCase(
  readDriverProfileRecordUseCase: _readDriverProfileRecordUseCase,
);
final DeleteUserDataUseCase _deleteUserDataUseCase = DeleteUserDataUseCase(
  repository: BackendDeleteUserDataRepository(),
);
final UpsertConsentUseCase _upsertConsentUseCase = UpsertConsentUseCase(
  client: UpsertConsentClient(),
);
final UpdateUserProfileUseCase _updateUserProfileUseCase =
    UpdateUserProfileUseCase(
  client: UpdateUserProfileClient(),
);
final OpenTripConversationUseCase _openTripConversationUseCase =
    OpenTripConversationUseCase(
  repository: BackendTripConversationRepository(),
);
const ResolveTripChatOpenFailureFeedbackMessageUseCase
    _resolveTripChatOpenFailureFeedbackMessageUseCase =
    ResolveTripChatOpenFailureFeedbackMessageUseCase();
final StartDriverTripUseCase _startDriverTripUseCase = StartDriverTripUseCase(
  repository: BackendDriverTripStartRepository(),
);
final ObserveDriverFinishTripStreamsUseCase
    _observeDriverFinishTripStreamsUseCase =
    ObserveDriverFinishTripStreamsUseCase(
  repository: BackendDriverFinishTripStreamRepository(),
);
final ResolveDriverActiveTripContextUseCase
    _resolveDriverActiveTripContextUseCase =
    ResolveDriverActiveTripContextUseCase(
  repository: BackendDriverActiveTripContextLookupRepository(),
);
const ResolveDriverFinishTripCommitFeedbackMessageUseCase
    _resolveDriverFinishTripCommitFeedbackMessageUseCase =
    ResolveDriverFinishTripCommitFeedbackMessageUseCase();
const ResolveDriverFinishTripMappedFailureFeedbackMessageUseCase
    _resolveDriverFinishTripMappedFailureFeedbackMessageUseCase =
    ResolveDriverFinishTripMappedFailureFeedbackMessageUseCase();
final ReadDriverActiveTripTransitionVersionUseCase
    _readDriverActiveTripTransitionVersionUseCase =
    ReadDriverActiveTripTransitionVersionUseCase(
  repository: BackendDriverActiveTripTransitionVersionRepository(),
);
final CommitStartDriverTripUseCase _commitStartDriverTripUseCase =
    CommitStartDriverTripUseCase(
  readTransitionVersionUseCase: _readDriverActiveTripTransitionVersionUseCase,
  startDriverTripUseCase: _startDriverTripUseCase,
);
const ResolveStartDriverTripFailureFeedbackMessageUseCase
    _resolveStartDriverTripFailureFeedbackMessageUseCase =
    ResolveStartDriverTripFailureFeedbackMessageUseCase();
final BootstrapUserProfileClient _bootstrapUserProfileClient =
    BootstrapUserProfileClient();
final BootstrapCurrentAuthProfileSessionUseCase
    _bootstrapCurrentAuthProfileSessionUseCase =
    BootstrapCurrentAuthProfileSessionUseCase(
  authCredentialGateway: _authCredentialGateway,
  bootstrapUserProfileClient: _bootstrapUserProfileClient,
  driverPushTokenRegistrationService: _driverPushTokenRegistrationService,
);
final PromoteCurrentAuthUserToDriverRoleWithRetryUseCase
    _promoteCurrentAuthUserToDriverRoleWithRetryUseCase =
    PromoteCurrentAuthUserToDriverRoleWithRetryUseCase(
  authCredentialGateway: _authCredentialGateway,
  bootstrapCurrentAuthProfileSessionUseCase:
      _bootstrapCurrentAuthProfileSessionUseCase,
);
final ReadUserRoleUseCase _readUserRoleUseCase = ReadUserRoleUseCase(
  repository: BackendUserRoleRepository(),
);
const PlanDeleteAccountResultHandlingUseCase
    _planDeleteAccountResultHandlingUseCase =
    PlanDeleteAccountResultHandlingUseCase();
const PlanProfileUpdateFeedbackHandlingUseCase
    _planProfileUpdateFeedbackHandlingUseCase =
    PlanProfileUpdateFeedbackHandlingUseCase();
const ResolveAccountProfileOperationFeedbackMessageUseCase
    _resolveAccountProfileOperationFeedbackMessageUseCase =
    ResolveAccountProfileOperationFeedbackMessageUseCase();
const ResolveAnonymousSignInFailureFeedbackMessageUseCase
    _resolveAnonymousSignInFailureFeedbackMessageUseCase =
    ResolveAnonymousSignInFailureFeedbackMessageUseCase();
const ResolveAuthUserDisplayNameUseCase _resolveAuthUserDisplayNameUseCase =
    ResolveAuthUserDisplayNameUseCase();
const ResolveDeleteAccountFailureFeedbackMessageUseCase
    _resolveDeleteAccountFailureFeedbackMessageUseCase =
    ResolveDeleteAccountFailureFeedbackMessageUseCase();
const ResolveEmailRegisterFailureFeedbackMessageUseCase
    _resolveEmailRegisterFailureFeedbackMessageUseCase =
    ResolveEmailRegisterFailureFeedbackMessageUseCase();
const ResolveEmailSignInFailureFeedbackMessageUseCase
    _resolveEmailSignInFailureFeedbackMessageUseCase =
    ResolveEmailSignInFailureFeedbackMessageUseCase();
const ResolvePasswordResetEmailFailureFeedbackMessageUseCase
    _resolvePasswordResetEmailFailureFeedbackMessageUseCase =
    ResolvePasswordResetEmailFailureFeedbackMessageUseCase();
const ResolveProfileCheckFailureFeedbackMessageUseCase
    _resolveProfileCheckFailureFeedbackMessageUseCase =
    ResolveProfileCheckFailureFeedbackMessageUseCase();
const ResolveProfilePrepareFailureFeedbackMessageUseCase
    _resolveProfilePrepareFailureFeedbackMessageUseCase =
    ResolveProfilePrepareFailureFeedbackMessageUseCase();
final EnsureAuthProfileRoleUseCase _ensureAuthProfileRoleUseCase =
    EnsureAuthProfileRoleUseCase(
  readUserRoleUseCase: _readUserRoleUseCase,
  bootstrapCurrentAuthProfileSessionUseCase:
      _bootstrapCurrentAuthProfileSessionUseCase,
);
final EnsureCurrentAuthUserDriverRoleWithRetryUseCase
    _ensureCurrentAuthUserDriverRoleWithRetryUseCase =
    EnsureCurrentAuthUserDriverRoleWithRetryUseCase(
  readUserRoleUseCase: _readUserRoleUseCase,
  promoteCurrentAuthUserToDriverRoleWithRetryUseCase:
      _promoteCurrentAuthUserToDriverRoleWithRetryUseCase,
);
final EnsureCurrentAuthUserDriverCorridorEntryDestinationUseCase
    _ensureCurrentAuthUserDriverCorridorEntryDestinationUseCase =
    EnsureCurrentAuthUserDriverCorridorEntryDestinationUseCase(
  ensureCurrentAuthUserDriverRoleWithRetryUseCase:
      _ensureCurrentAuthUserDriverRoleWithRetryUseCase,
  resolveDriverEntryDestinationUseCase: _resolveDriverEntryDestinationUseCase,
);
final EnsureCurrentAuthUserDriverRouteMutationReadinessUseCase
    _ensureCurrentAuthUserDriverRouteMutationReadinessUseCase =
    EnsureCurrentAuthUserDriverRouteMutationReadinessUseCase(
  readUserRoleUseCase: _readUserRoleUseCase,
  promoteCurrentAuthUserToDriverRoleWithRetryUseCase:
      _promoteCurrentAuthUserToDriverRoleWithRetryUseCase,
  resolveDriverEntryDestinationUseCase: _resolveDriverEntryDestinationUseCase,
);
final ResolveCurrentAuthDriverRouteMutationReadinessUiOutcomeCommandUseCase
    _resolveCurrentAuthDriverRouteMutationReadinessUiOutcomeCommandUseCase =
    ResolveCurrentAuthDriverRouteMutationReadinessUiOutcomeCommandUseCase(
  authCredentialGateway: _authCredentialGateway,
  resolveAuthUserDisplayNameUseCase: _resolveAuthUserDisplayNameUseCase,
  ensureCurrentAuthUserDriverRouteMutationReadinessUseCase:
      _ensureCurrentAuthUserDriverRouteMutationReadinessUseCase,
);
final ShouldPromptLocationPermissionForUserUseCase
    _shouldPromptLocationPermissionForUserUseCase =
    ShouldPromptLocationPermissionForUserUseCase(
  readUserRoleUseCase: _readUserRoleUseCase,
  locationPermissionGate: _locationPermissionGate,
);
final LoadAppSettingsBootstrapUseCase _loadAppSettingsBootstrapUseCase =
    LoadAppSettingsBootstrapUseCase(
  repository: BackendAppSettingsBootstrapRepository(),
);
final LoadDriverProfileSetupBootstrapUseCase
    _loadDriverProfileSetupBootstrapUseCase =
    LoadDriverProfileSetupBootstrapUseCase(
  repository: BackendDriverProfileSetupBootstrapRepository(),
);
final LoadProfileEditBootstrapUseCase _loadProfileEditBootstrapUseCase =
    LoadProfileEditBootstrapUseCase(
  repository: BackendProfileEditBootstrapRepository(),
);
final LoadDriverHomeHeaderBootstrapUseCase
    _loadDriverHomeHeaderBootstrapUseCase =
    LoadDriverHomeHeaderBootstrapUseCase(
  repository: BackendDriverHomeHeaderBootstrapRepository(),
);
final LoadDriverSubscriptionSnapshotUseCase
    _loadDriverSubscriptionSnapshotUseCase =
    LoadDriverSubscriptionSnapshotUseCase(
  repository: BackendDriverSubscriptionSnapshotRepository(),
);
final LoadCurrentAuthDriverSubscriptionSnapshotUseCase
    _loadCurrentAuthDriverSubscriptionSnapshotUseCase =
    LoadCurrentAuthDriverSubscriptionSnapshotUseCase(
  authCredentialGateway: _authCredentialGateway,
  readUserRoleUseCase: _readUserRoleUseCase,
  loadDriverSubscriptionSnapshotUseCase: _loadDriverSubscriptionSnapshotUseCase,
);
final LoadDriverHomeRouteSectionUseCase _loadDriverHomeRouteSectionUseCase =
    LoadDriverHomeRouteSectionUseCase(
  repository: BackendDriverHomeRouteSectionRepository(),
);
final LoadDriverTripCompletedBootstrapRawUseCase
    _loadDriverTripCompletedBootstrapRawUseCase =
    LoadDriverTripCompletedBootstrapRawUseCase(
  repository: BackendDriverTripCompletedBootstrapRepository(),
);
final ComposeDriverTripCompletedBootstrapUseCase
    _composeDriverTripCompletedBootstrapUseCase =
    ComposeDriverTripCompletedBootstrapUseCase();
final LoadDriverTripHistoryRawUseCase _loadDriverTripHistoryRawUseCase =
    LoadDriverTripHistoryRawUseCase(
  repository: BackendDriverTripHistoryRepository(),
);
final ComposeDriverTripHistoryItemSeedsUseCase
    _composeDriverTripHistoryItemSeedsUseCase =
    ComposeDriverTripHistoryItemSeedsUseCase();
final LoadPassengerTripHistoryRawUseCase _loadPassengerTripHistoryRawUseCase =
    LoadPassengerTripHistoryRawUseCase(
  repository: BackendPassengerTripHistoryRepository(),
);
final ComposePassengerTripHistoryItemSeedsUseCase
    _composePassengerTripHistoryItemSeedsUseCase =
    ComposePassengerTripHistoryItemSeedsUseCase();
final LoadDriverMyTripsRawUseCase _loadDriverMyTripsRawUseCase =
    LoadDriverMyTripsRawUseCase(
  repository: BackendDriverMyTripsRepository(),
);
final LoadDriverTripDetailBootstrapRawUseCase
    _loadDriverTripDetailBootstrapRawUseCase =
    LoadDriverTripDetailBootstrapRawUseCase(
  repository: BackendDriverTripDetailBootstrapRepository(),
);
final ClassifyDriverMyTripsRawUseCase _classifyDriverMyTripsRawUseCase =
    ClassifyDriverMyTripsRawUseCase(
  resolveReferenceAtUtc: _resolveTripHistoryReferenceAtUtc,
);
final ComposeDriverMyTripsCardSeedsUseCase
    _composeDriverMyTripsCardSeedsUseCase =
    ComposeDriverMyTripsCardSeedsUseCase();
final SelectPrimaryDriverRouteCandidateUseCase
    _selectPrimaryDriverRouteCandidateUseCase =
    SelectPrimaryDriverRouteCandidateUseCase(
  repository: BackendDriverHomeRouteSectionRepository(),
);
final ExecuteDriverFinishTripSyncUseCase _executeDriverFinishTripSyncUseCase =
    ExecuteDriverFinishTripSyncUseCase(
  tripActionSyncService: _tripActionSyncService,
);
const PlanDriverFinishTripCommitHandlingUseCase
    _planDriverFinishTripCommitHandlingUseCase =
    PlanDriverFinishTripCommitHandlingUseCase();
final ExecuteDriverAnnouncementSyncUseCase
    _executeDriverAnnouncementSyncUseCase =
    ExecuteDriverAnnouncementSyncUseCase(
  tripActionSyncService: _tripActionSyncService,
);
const PlanDriverAnnouncementFailureHandlingUseCase
    _planDriverAnnouncementFailureHandlingUseCase =
    PlanDriverAnnouncementFailureHandlingUseCase();
const PlanDriverAnnouncementHandlingUseCase
    _planDriverAnnouncementHandlingUseCase =
    PlanDriverAnnouncementHandlingUseCase();
