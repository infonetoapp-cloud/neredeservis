import '../../l10n/tr_localization_keys.dart';
import '../../l10n/tr_localizations.dart';

abstract final class CoreFormValidationTokens {
  static const srvCodeRequiredKey = TrLocalizationKeys.formSrvCodeRequired;
  static const srvCodeRequired = TrLocalizations.formSrvCodeRequired;
  static const srvCodeFormatKey = TrLocalizationKeys.formSrvCodeFormat;
  static const srvCodeFormat = TrLocalizations.formSrvCodeFormat;

  static const fullNameMin2Key = TrLocalizationKeys.formFullNameMin2;
  static const fullNameMin2 = TrLocalizations.formFullNameMin2;
  static const phoneMin7Key = TrLocalizationKeys.formPhoneMin7;
  static const phoneMin7 = TrLocalizations.formPhoneMin7;
  static const plateMin3Key = TrLocalizationKeys.formPlateMin3;
  static const plateMin3 = TrLocalizations.formPlateMin3;

  static const boardingAreaRequiredKey =
      TrLocalizationKeys.formBoardingAreaRequired;
  static const boardingAreaRequired = TrLocalizations.formBoardingAreaRequired;
  static const notificationTimeFormatKey =
      TrLocalizationKeys.formNotificationTimeFormat;
  static const notificationTimeFormat =
      TrLocalizations.formNotificationTimeFormat;
  static const timeFormatKey = TrLocalizationKeys.formTimeFormat;
  static const timeFormat = TrLocalizations.formTimeFormat;

  static const routeIdRequiredKey = TrLocalizationKeys.formRouteIdRequired;
  static const routeIdRequired = TrLocalizations.formRouteIdRequired;
  static const routeIdRequiredForDeleteKey =
      TrLocalizationKeys.formRouteIdRequiredForDelete;
  static const routeIdRequiredForDelete =
      TrLocalizations.formRouteIdRequiredForDelete;
  static const stopIdRequiredForDeleteKey =
      TrLocalizationKeys.formStopIdRequiredForDelete;
  static const stopIdRequiredForDelete =
      TrLocalizations.formStopIdRequiredForDelete;

  static const routeNameMin2Key = TrLocalizationKeys.formRouteNameMin2;
  static const routeNameMin2 = TrLocalizations.formRouteNameMin2;
  static const startAddressMin3Key = TrLocalizationKeys.formStartAddressMin3;
  static const startAddressMin3 = TrLocalizations.formStartAddressMin3;
  static const endAddressMin3Key = TrLocalizationKeys.formEndAddressMin3;
  static const endAddressMin3 = TrLocalizations.formEndAddressMin3;
  static const startEndAddressMin3Key =
      TrLocalizationKeys.formStartEndAddressMin3;
  static const startEndAddressMin3 = TrLocalizations.formStartEndAddressMin3;

  static const coordinatesNumericKey =
      TrLocalizationKeys.formCoordinatesNumeric;
  static const coordinatesNumeric = TrLocalizations.formCoordinatesNumeric;
  static const coordinatesRangeKey = TrLocalizationKeys.formCoordinatesRange;
  static const coordinatesRange = TrLocalizations.formCoordinatesRange;
  static const virtualStopCoordinatesNumericKey =
      TrLocalizationKeys.formVirtualStopCoordinatesNumeric;
  static const virtualStopCoordinatesNumeric =
      TrLocalizations.formVirtualStopCoordinatesNumeric;
  static const virtualStopCoordinatesRangeKey =
      TrLocalizationKeys.formVirtualStopCoordinatesRange;
  static const virtualStopCoordinatesRange =
      TrLocalizations.formVirtualStopCoordinatesRange;

  static const stopNameMin2Key = TrLocalizationKeys.formStopNameMin2;
  static const stopNameMin2 = TrLocalizations.formStopNameMin2;
  static const stopOrderRangeKey = TrLocalizationKeys.formStopOrderRange;
  static const stopOrderRange = TrLocalizations.formStopOrderRange;

  static const vacationUntilIso8601Key =
      TrLocalizationKeys.formVacationUntilIso8601;
  static const vacationUntilIso8601 = TrLocalizations.formVacationUntilIso8601;
  static const atLeastOneFieldRequiredKey =
      TrLocalizationKeys.formAtLeastOneFieldRequired;
  static const atLeastOneFieldRequired =
      TrLocalizations.formAtLeastOneFieldRequired;

  static const ghostFinishRecordingFirstKey =
      TrLocalizationKeys.formGhostFinishRecordingFirst;
  static const ghostFinishRecordingFirst =
      TrLocalizations.formGhostFinishRecordingFirst;
  static const ghostNeedsMinPointsKey =
      TrLocalizationKeys.formGhostNeedsMinPoints;
  static const ghostNeedsMinPoints = TrLocalizations.formGhostNeedsMinPoints;
  static const ghostNeedsSuggestionsApprovalKey =
      TrLocalizationKeys.formGhostNeedsSuggestionsApproval;
  static const ghostNeedsSuggestionsApproval =
      TrLocalizations.formGhostNeedsSuggestionsApproval;

  static String pointCoordinatesPair(String fieldLabel) {
    return TrLocalizations.text(
      TrLocalizationKeys.formPointCoordinatesPair,
      params: <String, String>{'field_label': fieldLabel},
    );
  }

  static String pointCoordinatesNumeric(String fieldLabel) {
    return TrLocalizations.text(
      TrLocalizationKeys.formPointCoordinatesNumeric,
      params: <String, String>{'field_label': fieldLabel},
    );
  }

  static String pointCoordinatesRange(String fieldLabel) {
    return TrLocalizations.text(
      TrLocalizationKeys.formPointCoordinatesRange,
      params: <String, String>{'field_label': fieldLabel},
    );
  }
}
