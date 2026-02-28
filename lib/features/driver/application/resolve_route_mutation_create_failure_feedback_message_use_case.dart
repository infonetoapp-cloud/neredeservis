import '../../../ui/tokens/error_feedback_tokens.dart';
import 'plan_route_mutation_create_failure_feedback_use_case.dart';

class ResolveRouteMutationCreateFailureFeedbackMessageUseCase {
  const ResolveRouteMutationCreateFailureFeedbackMessageUseCase();

  String execute(RouteMutationCreateFailureFeedbackPlan plan) {
    switch (plan.key) {
      case RouteMutationCreateFailureFeedbackKey.unauthenticated:
        return CoreErrorFeedbackTokens.sessionMissingSignInAgain;
      case RouteMutationCreateFailureFeedbackKey.permissionDenied:
        return 'Bu islem icin yetkin yok. Sofor profili gerekli olabilir.';
      case RouteMutationCreateFailureFeedbackKey.invalidArgument:
        return 'Rota bilgileri gecersiz. Tum alanlari kontrol edip tekrar dene.';
      case RouteMutationCreateFailureFeedbackKey.driverProfilePrecondition:
        return 'Sofor profilini tamamlamadan rota islemi yapamazsin.';
      case RouteMutationCreateFailureFeedbackKey.srvCodeCollisionLimit:
        return 'Su an kod olusturulamiyor. Kisa sure sonra tekrar dene.';
      case RouteMutationCreateFailureFeedbackKey.routeCreateFailed:
        return CoreErrorFeedbackTokens.routeCreateFailed;
      case RouteMutationCreateFailureFeedbackKey.resourceExhausted:
        return 'Sunucu limiti dolu. Kisa sure sonra tekrar dene.';
      case RouteMutationCreateFailureFeedbackKey.retryableUnavailable:
        return 'Sunucuya ulasilamadi. Interneti kontrol edip tekrar dene.';
      case RouteMutationCreateFailureFeedbackKey.routeCreateFailedWithCode:
        final codeLabel = (plan.codeLabel ?? '').trim();
        final normalizedCodeLabel = codeLabel.isEmpty ? 'unknown' : codeLabel;
        return '${CoreErrorFeedbackTokens.routeCreateFailed} ($normalizedCodeLabel)';
    }
  }
}
