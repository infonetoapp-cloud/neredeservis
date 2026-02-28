import '../../../ui/tokens/error_feedback_tokens.dart';

enum DriverRouteMutationReadinessUiNavigationKind {
  none,
  pushAuthWithDriverNextRole,
  goRoleSelect,
  goDriverProfileSetup,
}

enum _DriverRouteMutationReadinessUiOutcomeKind {
  allow,
  unauthenticated,
  profileCheckFailed,
  driverRoleRequired,
  driverProfileSetupRequired,
}

class PlanDriverRouteMutationReadinessUiOutcomeCommand {
  const PlanDriverRouteMutationReadinessUiOutcomeCommand._({
    required _DriverRouteMutationReadinessUiOutcomeKind kind,
  }) : _kind = kind;

  const PlanDriverRouteMutationReadinessUiOutcomeCommand.allow()
      : this._(kind: _DriverRouteMutationReadinessUiOutcomeKind.allow);

  const PlanDriverRouteMutationReadinessUiOutcomeCommand.unauthenticated()
      : this._(
            kind: _DriverRouteMutationReadinessUiOutcomeKind.unauthenticated);

  const PlanDriverRouteMutationReadinessUiOutcomeCommand.profileCheckFailed()
      : this._(
            kind:
                _DriverRouteMutationReadinessUiOutcomeKind.profileCheckFailed);

  const PlanDriverRouteMutationReadinessUiOutcomeCommand.driverRoleRequired()
      : this._(
            kind:
                _DriverRouteMutationReadinessUiOutcomeKind.driverRoleRequired);

  const PlanDriverRouteMutationReadinessUiOutcomeCommand.driverProfileSetupRequired()
      : this._(
          kind: _DriverRouteMutationReadinessUiOutcomeKind
              .driverProfileSetupRequired,
        );

  final _DriverRouteMutationReadinessUiOutcomeKind _kind;
}

class DriverRouteMutationReadinessUiOutcomePlan {
  const DriverRouteMutationReadinessUiOutcomePlan({
    required this.allowsRouteMutation,
    required this.navigationKind,
    required this.feedbackMessage,
  });

  final bool allowsRouteMutation;
  final DriverRouteMutationReadinessUiNavigationKind navigationKind;
  final String? feedbackMessage;
}

class PlanDriverRouteMutationReadinessUiOutcomeUseCase {
  const PlanDriverRouteMutationReadinessUiOutcomeUseCase();

  DriverRouteMutationReadinessUiOutcomePlan execute(
    PlanDriverRouteMutationReadinessUiOutcomeCommand command,
  ) {
    switch (command._kind) {
      case _DriverRouteMutationReadinessUiOutcomeKind.allow:
        return const DriverRouteMutationReadinessUiOutcomePlan(
          allowsRouteMutation: true,
          navigationKind: DriverRouteMutationReadinessUiNavigationKind.none,
          feedbackMessage: null,
        );
      case _DriverRouteMutationReadinessUiOutcomeKind.unauthenticated:
        return const DriverRouteMutationReadinessUiOutcomePlan(
          allowsRouteMutation: false,
          navigationKind: DriverRouteMutationReadinessUiNavigationKind
              .pushAuthWithDriverNextRole,
          feedbackMessage: 'Rota olusturmak icin once giris yapman gerekiyor.',
        );
      case _DriverRouteMutationReadinessUiOutcomeKind.profileCheckFailed:
        return const DriverRouteMutationReadinessUiOutcomePlan(
          allowsRouteMutation: false,
          navigationKind: DriverRouteMutationReadinessUiNavigationKind.none,
          feedbackMessage: CoreErrorFeedbackTokens.profileCheckFailed,
        );
      case _DriverRouteMutationReadinessUiOutcomeKind.driverRoleRequired:
        return const DriverRouteMutationReadinessUiOutcomePlan(
          allowsRouteMutation: false,
          navigationKind:
              DriverRouteMutationReadinessUiNavigationKind.goRoleSelect,
          feedbackMessage: 'Rota islemleri icin sofor moduna gecmelisin.',
        );
      case _DriverRouteMutationReadinessUiOutcomeKind
            .driverProfileSetupRequired:
        return const DriverRouteMutationReadinessUiOutcomePlan(
          allowsRouteMutation: false,
          navigationKind:
              DriverRouteMutationReadinessUiNavigationKind.goDriverProfileSetup,
          feedbackMessage:
              'Rota islemleri icin once sofor profilini tamamlamalisin.',
        );
    }
  }
}
