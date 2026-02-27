import '../../../ui/tokens/error_feedback_tokens.dart';
import 'plan_route_mutation_write_feedback_use_case.dart';

class ResolveRouteMutationWriteFeedbackMessageUseCase {
  const ResolveRouteMutationWriteFeedbackMessageUseCase();

  String execute(RouteMutationWriteFeedbackPlan plan) {
    switch (plan.key) {
      case RouteMutationWriteFeedbackKey.routeUpdateSavedWithoutStopChanges:
        return 'Route guncellendi.';
      case RouteMutationWriteFeedbackKey.routeUpdateSavedWithStopChanges:
        return 'Route guncellendi. ${plan.inlineStopUpsertsCount ?? 0} durak kaydedildi.';
      case RouteMutationWriteFeedbackKey.routeUpdateFailed:
        return CoreErrorFeedbackTokens.routeUpdateFailed;
      case RouteMutationWriteFeedbackKey.stopSaved:
        final stopId = (plan.stopId ?? '').trim();
        final normalizedStopId = stopId.isEmpty ? '-' : stopId;
        return 'Durak kaydedildi. Stop ID: $normalizedStopId';
      case RouteMutationWriteFeedbackKey.stopSaveFailed:
        return CoreErrorFeedbackTokens.stopSaveFailed;
      case RouteMutationWriteFeedbackKey.stopDeleted:
        return 'Durak silindi.';
      case RouteMutationWriteFeedbackKey.stopDeleteFailed:
        return CoreErrorFeedbackTokens.stopDeleteFailed;
    }
  }
}
