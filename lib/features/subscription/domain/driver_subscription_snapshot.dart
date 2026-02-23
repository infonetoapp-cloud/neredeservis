import '../presentation/paywall_copy_tr.dart';

class DriverSubscriptionSnapshot {
  const DriverSubscriptionSnapshot({
    this.status = SubscriptionUiStatus.mock,
    this.trialDaysLeft = 0,
  });

  final SubscriptionUiStatus status;
  final int trialDaysLeft;
}

DriverSubscriptionSnapshot parseDriverSubscriptionSnapshotFromDriverData(
  Map<String, dynamic>? data, {
  DateTime Function()? readNowUtc,
}) {
  final rawStatus = (data?['subscriptionStatus'] as String?)?.trim();
  final trialEndsAtRaw = (data?['trialEndsAt'] as String?)?.trim();
  final trialEndsAt = (trialEndsAtRaw == null || trialEndsAtRaw.isEmpty)
      ? null
      : DateTime.tryParse(trialEndsAtRaw)?.toUtc();
  final nowUtc = (readNowUtc ?? () => DateTime.now().toUtc())();
  final trialDaysLeft = _computeRemainingTrialDays(
    trialEndsAt,
    nowUtc: nowUtc,
  );
  final status = _toSubscriptionUiStatus(
    rawStatus: rawStatus,
    trialEndsAt: trialEndsAt,
    trialDaysLeft: trialDaysLeft,
    nowUtc: nowUtc,
  );
  return DriverSubscriptionSnapshot(
    status: status,
    trialDaysLeft: trialDaysLeft,
  );
}

SubscriptionUiStatus _toSubscriptionUiStatus({
  required String? rawStatus,
  required DateTime? trialEndsAt,
  required int trialDaysLeft,
  required DateTime nowUtc,
}) {
  final normalized = rawStatus?.toLowerCase();
  switch (normalized) {
    case 'active':
      return SubscriptionUiStatus.active;
    case 'expired':
      return SubscriptionUiStatus.trialExpired;
    case 'trial':
      if (trialEndsAt != null && !trialEndsAt.isAfter(nowUtc)) {
        return SubscriptionUiStatus.trialExpired;
      }
      if (trialDaysLeft <= 0) {
        return SubscriptionUiStatus.trialExpired;
      }
      return SubscriptionUiStatus.trialActive;
    case 'mock':
      return SubscriptionUiStatus.mock;
    default:
      return SubscriptionUiStatus.mock;
  }
}

int _computeRemainingTrialDays(
  DateTime? trialEndsAt, {
  required DateTime nowUtc,
}) {
  if (trialEndsAt == null) {
    return 0;
  }
  if (!trialEndsAt.isAfter(nowUtc)) {
    return 0;
  }
  final remainingHours = trialEndsAt.difference(nowUtc).inHours;
  final remainingDays = (remainingHours / 24).ceil();
  return remainingDays <= 0 ? 1 : remainingDays;
}
