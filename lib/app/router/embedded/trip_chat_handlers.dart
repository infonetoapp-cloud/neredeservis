part of '../app_router.dart';

Future<void> _handleOpenTripChat(
  BuildContext context, {
  required String routeId,
  String? driverUid,
  String? passengerUid,
  String? counterpartName,
  String? counterpartSubtitle,
}) async {
  final callerUid = _authCredentialGateway.currentUser?.uid;
  if (callerUid == null) {
    _showInfo(context, CoreErrorFeedbackTokens.sessionMissingSignInAgain);
    return;
  }

  try {
    final result = await _openTripConversationUseCase.execute(
      OpenTripConversationCommand(
        routeId: routeId,
        driverUid: driverUid,
        passengerUid: passengerUid,
      ),
    );
    final conversationId = _nullableParam(result.conversationId);
    final resolvedRouteId = _nullableParam(result.routeId) ?? routeId;
    final resolvedDriverUid = _nullableParam(result.driverUid);
    final resolvedPassengerUid = _nullableParam(result.passengerUid);
    final payloadDriverName = _nullableParam(result.driverName) ?? 'Sofor';
    final payloadPassengerName =
        _nullableParam(result.passengerName) ?? 'Yolcu';
    final payloadDriverPlate = _nullableParam(result.driverPlate);

    if (conversationId == null) {
      if (context.mounted) {
        _showInfo(context, 'Sohbet baslatilamadi. Lutfen tekrar dene.');
      }
      return;
    }

    final isCallerDriver =
        resolvedDriverUid != null && resolvedDriverUid == callerUid;
    final resolvedCounterpartName = _nullableParam(counterpartName) ??
        (isCallerDriver ? payloadPassengerName : payloadDriverName);
    final resolvedCounterpartSubtitle = _nullableParam(counterpartSubtitle) ??
        (isCallerDriver
            ? (resolvedPassengerUid == null ? null : 'Yolcu')
            : payloadDriverPlate);

    if (!context.mounted) {
      return;
    }
    context.push(
      _buildTripChatUri(
        routeId: resolvedRouteId,
        conversationId: conversationId,
        counterpartName: resolvedCounterpartName,
        counterpartSubtitle: resolvedCounterpartSubtitle,
      ),
    );
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    _showInfo(
      context,
      _resolveTripChatOpenFailureFeedbackMessageUseCase.execute(
        errorCode: error.code,
      ),
    );
  }
}
