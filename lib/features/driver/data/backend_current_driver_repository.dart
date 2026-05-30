import 'dart:async';

import '../../../services/repository_interfaces.dart';
import '../../auth/data/auth_credential_gateway.dart';
import '../../auth/data/current_auth_profile_snapshot_client.dart';
import '../../auth/data/identity_toolkit_auth_credential_gateway.dart';
import '../../domain/entities/driver_entity.dart';

class BackendCurrentDriverRepository implements DriverRepository {
  BackendCurrentDriverRepository({
    AuthCredentialGateway? authCredentialGateway,
    CurrentAuthProfileSnapshotClient? snapshotClient,
    Duration? pollInterval,
  })  : _authCredentialGateway =
            authCredentialGateway ?? IdentityToolkitAuthCredentialGateway(),
        _snapshotClient = snapshotClient ?? CurrentAuthProfileSnapshotClient(),
        _pollInterval = pollInterval ?? const Duration(seconds: 25);

  final AuthCredentialGateway _authCredentialGateway;
  final CurrentAuthProfileSnapshotClient _snapshotClient;
  final Duration _pollInterval;

  static final DateTime _epochUtc =
      DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);

  @override
  Stream<DriverEntity?> watchDriver(String driverId) async* {
    final currentUser = _authCredentialGateway.currentUser;
    if (currentUser == null ||
        currentUser.isAnonymous ||
        currentUser.uid != driverId) {
      yield null;
      return;
    }

    DriverEntity? lastSnapshot;
    while (true) {
      final nextSnapshot = await getDriver(driverId);
      if (!_isSameDriver(lastSnapshot, nextSnapshot)) {
        lastSnapshot = nextSnapshot;
        yield nextSnapshot;
      }
      await Future<void>.delayed(_pollInterval);
    }
  }

  @override
  Future<DriverEntity?> getDriver(String driverId) async {
    final currentUser = _authCredentialGateway.currentUser;
    if (currentUser == null ||
        currentUser.isAnonymous ||
        currentUser.uid != driverId) {
      return null;
    }

    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != driverId) {
        return null;
      }

      final driverProfile = snapshot.driverProfile;
      if (driverProfile == null) {
        return null;
      }

      final name = _firstNonEmpty(<String?>[
        driverProfile.name,
        snapshot.displayName,
      ]);
      final phone = _firstNonEmpty(<String?>[
        driverProfile.phone,
        snapshot.phone,
      ]);
      final plate = _normalized(driverProfile.plate);
      if (name == null || phone == null || plate == null) {
        return null;
      }

      final createdAt = _parseDate(driverProfile.createdAt) ?? _epochUtc;
      final updatedAt = _parseDate(driverProfile.updatedAt) ?? createdAt;

      return DriverEntity(
        driverId: snapshot.uid,
        name: name,
        phone: phone,
        plate: plate,
        showPhoneToPassengers: driverProfile.showPhoneToPassengers ?? false,
        companyId: _normalized(driverProfile.companyId),
        subscriptionStatus:
            driverSubscriptionStatusFromRaw(driverProfile.subscriptionStatus),
        trialStartDate: _parseDate(driverProfile.trialStartDate),
        trialEndsAt: _parseDate(driverProfile.trialEndsAt),
        lastPaywallShownAt: _parseDate(driverProfile.lastPaywallShownAt),
        activeDeviceToken: _normalized(driverProfile.activeDeviceToken),
        createdAt: createdAt,
        updatedAt: updatedAt,
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> upsertDriver(DriverEntity driver) {
    return Future<void>.error(
      UnsupportedError('BackendCurrentDriverRepository is read-only.'),
    );
  }
}

String? _firstNonEmpty(List<String?> values) {
  for (final value in values) {
    final normalized = _normalized(value);
    if (normalized != null) {
      return normalized;
    }
  }
  return null;
}

String? _normalized(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}

DateTime? _parseDate(String? rawValue) {
  final normalized = _normalized(rawValue);
  if (normalized == null) {
    return null;
  }
  return DateTime.tryParse(normalized)?.toUtc();
}

bool _isSameDriver(DriverEntity? left, DriverEntity? right) {
  if (left == null || right == null) {
    return left == right;
  }

  return left.driverId == right.driverId &&
      left.name == right.name &&
      left.phone == right.phone &&
      left.plate == right.plate &&
      left.showPhoneToPassengers == right.showPhoneToPassengers &&
      left.companyId == right.companyId &&
      left.subscriptionStatus == right.subscriptionStatus &&
      left.trialStartDate == right.trialStartDate &&
      left.trialEndsAt == right.trialEndsAt &&
      left.lastPaywallShownAt == right.lastPaywallShownAt &&
      left.activeDeviceToken == right.activeDeviceToken &&
      left.createdAt == right.createdAt &&
      left.updatedAt == right.updatedAt;
}
