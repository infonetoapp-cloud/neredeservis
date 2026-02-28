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
      case RouteMutationWriteFeedbackKey.routeUpdateTokenMismatch:
        return 'Rota baska bir cihazda degisti. Sayfayi yenileyip tekrar dene.';
      case RouteMutationWriteFeedbackKey.routeUpdateStructureLocked:
        return 'Aktif sefer varken rota yapisi degistirilemez.';
      case RouteMutationWriteFeedbackKey.routeUpdateUpgradeRequired:
        return 'Uygulamayi guncellemeden bu islem yapilamaz.';
      case RouteMutationWriteFeedbackKey.stopSaved:
        final stopId = (plan.stopId ?? '').trim();
        final normalizedStopId = stopId.isEmpty ? '-' : stopId;
        return 'Durak kaydedildi. Stop ID: $normalizedStopId';
      case RouteMutationWriteFeedbackKey.stopSaveFailed:
        return CoreErrorFeedbackTokens.stopSaveFailed;
      case RouteMutationWriteFeedbackKey.stopSaveTokenMismatch:
        return 'Durak listesi degisti. Yenileyip tekrar dene.';
      case RouteMutationWriteFeedbackKey.stopSaveStructureLocked:
        return 'Aktif seferde durak yapisi degistirilemez.';
      case RouteMutationWriteFeedbackKey.stopSaveStateInvalid:
        return 'Durak durumu gecerli degil. Listeyi yenileyip tekrar dene.';
      case RouteMutationWriteFeedbackKey.stopSaveReorderStateInvalid:
        return 'Durak sirasi degisti. Listeyi yenileyip tekrar dene.';
      case RouteMutationWriteFeedbackKey.stopSaveUpgradeRequired:
        return 'Uygulamayi guncellemeden durak kaydedemezsin.';
      case RouteMutationWriteFeedbackKey.stopDeleted:
        return 'Durak silindi.';
      case RouteMutationWriteFeedbackKey.stopDeleteFailed:
        return CoreErrorFeedbackTokens.stopDeleteFailed;
      case RouteMutationWriteFeedbackKey.stopDeleteTokenMismatch:
        return 'Durak listesi degisti. Yenileyip tekrar dene.';
      case RouteMutationWriteFeedbackKey.stopDeleteStructureLocked:
        return 'Aktif seferde durak silinemez.';
      case RouteMutationWriteFeedbackKey.stopDeleteUpgradeRequired:
        return 'Uygulamayi guncellemeden durak silemezsin.';
    }
  }
}
