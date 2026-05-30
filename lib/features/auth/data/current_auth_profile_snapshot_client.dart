import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/user_role.dart';

class CurrentAuthDriverProfileSnapshot {
  const CurrentAuthDriverProfileSnapshot({
    this.name,
    this.phone,
    this.plate,
    this.showPhoneToPassengers,
    this.photoUrl,
    this.photoPath,
    this.companyId,
    this.subscriptionStatus,
    this.trialStartDate,
    this.trialEndsAt,
    this.lastPaywallShownAt,
    this.activeDeviceToken,
    this.createdAt,
    this.updatedAt,
  });

  final String? name;
  final String? phone;
  final String? plate;
  final bool? showPhoneToPassengers;
  final String? photoUrl;
  final String? photoPath;
  final String? companyId;
  final String? subscriptionStatus;
  final String? trialStartDate;
  final String? trialEndsAt;
  final String? lastPaywallShownAt;
  final String? activeDeviceToken;
  final String? createdAt;
  final String? updatedAt;
}

class CurrentAuthConsentSnapshot {
  const CurrentAuthConsentSnapshot({
    this.privacyVersion,
    this.kvkkTextVersion,
    this.locationConsent,
    this.acceptedAt,
    this.platform,
  });

  final String? privacyVersion;
  final String? kvkkTextVersion;
  final bool? locationConsent;
  final String? acceptedAt;
  final String? platform;
}

class CurrentAuthProfileSnapshot {
  const CurrentAuthProfileSnapshot({
    required this.uid,
    required this.role,
    this.displayName,
    this.phone,
    this.photoUrl,
    this.photoPath,
    this.driverProfile,
    this.consent,
  });

  final String uid;
  final UserRole role;
  final String? displayName;
  final String? phone;
  final String? photoUrl;
  final String? photoPath;
  final CurrentAuthDriverProfileSnapshot? driverProfile;
  final CurrentAuthConsentSnapshot? consent;
}

class CurrentAuthProfileSnapshotClient {
  CurrentAuthProfileSnapshotClient({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  Future<CurrentAuthProfileSnapshot> readCurrent() async {
    final payload = await _apiClient.getJson('/api/auth/profile');
    final userPayload = _asRequiredMap(payload['user'], 'user');
    final uid = _readString(userPayload, 'uid');
    if (uid == null || uid.isEmpty) {
      throw StateError('/api/auth/profile returned empty uid.');
    }

    return CurrentAuthProfileSnapshot(
      uid: uid,
      role: userRoleFromRaw(_readString(userPayload, 'role')),
      displayName: _readString(userPayload, 'displayName'),
      phone: _readString(userPayload, 'phone'),
      photoUrl: _readString(userPayload, 'photoUrl'),
      photoPath: _readString(userPayload, 'photoPath'),
      driverProfile: _parseDriverProfile(payload['driverProfile']),
      consent: _parseConsent(payload['consent']),
    );
  }

  CurrentAuthDriverProfileSnapshot? _parseDriverProfile(Object? rawValue) {
    final record = _asOptionalMap(rawValue);
    if (record == null) {
      return null;
    }

    final snapshot = CurrentAuthDriverProfileSnapshot(
      name: _readString(record, 'name'),
      phone: _readString(record, 'phone'),
      plate: _readString(record, 'plate'),
      showPhoneToPassengers: _readBool(record, 'showPhoneToPassengers'),
      photoUrl: _readString(record, 'photoUrl'),
      photoPath: _readString(record, 'photoPath'),
      companyId: _readString(record, 'companyId'),
      subscriptionStatus: _readString(record, 'subscriptionStatus'),
      trialStartDate: _readString(record, 'trialStartDate'),
      trialEndsAt: _readString(record, 'trialEndsAt'),
      lastPaywallShownAt: _readString(record, 'lastPaywallShownAt'),
      activeDeviceToken: _readString(record, 'activeDeviceToken'),
      createdAt: _readString(record, 'createdAt'),
      updatedAt: _readString(record, 'updatedAt'),
    );

    final hasData = snapshot.name != null ||
        snapshot.phone != null ||
        snapshot.plate != null ||
        snapshot.showPhoneToPassengers != null ||
        snapshot.photoUrl != null ||
        snapshot.photoPath != null ||
        snapshot.companyId != null ||
        snapshot.subscriptionStatus != null ||
        snapshot.trialStartDate != null ||
        snapshot.trialEndsAt != null ||
        snapshot.lastPaywallShownAt != null ||
        snapshot.activeDeviceToken != null ||
        snapshot.createdAt != null ||
        snapshot.updatedAt != null;

    return hasData ? snapshot : null;
  }

  CurrentAuthConsentSnapshot? _parseConsent(Object? rawValue) {
    final record = _asOptionalMap(rawValue);
    if (record == null) {
      return null;
    }

    final snapshot = CurrentAuthConsentSnapshot(
      privacyVersion: _readString(record, 'privacyVersion'),
      kvkkTextVersion: _readString(record, 'kvkkTextVersion'),
      locationConsent: _readBool(record, 'locationConsent'),
      acceptedAt: _readString(record, 'acceptedAt'),
      platform: _readString(record, 'platform'),
    );

    final hasData = snapshot.privacyVersion != null ||
        snapshot.kvkkTextVersion != null ||
        snapshot.locationConsent != null ||
        snapshot.acceptedAt != null ||
        snapshot.platform != null;

    return hasData ? snapshot : null;
  }
}

Map<String, dynamic> _asRequiredMap(Object? value, String label) {
  final record = _asOptionalMap(value);
  if (record == null) {
    throw StateError('/api/auth/profile returned invalid $label payload.');
  }
  return record;
}

Map<String, dynamic>? _asOptionalMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map<Object?, Object?>) {
    return Map<String, dynamic>.from(value);
  }
  return null;
}

String? _readString(Map<String, dynamic> record, String key) {
  final value = record[key];
  if (value is! String) {
    return null;
  }
  final normalized = value.trim();
  return normalized.isEmpty ? null : normalized;
}

bool? _readBool(Map<String, dynamic> record, String key) {
  final value = record[key];
  return value is bool ? value : null;
}
