import 'dart:async';

import '../domain/user_role.dart';
import 'auth_credential_gateway.dart';
import 'current_auth_profile_snapshot_client.dart';
import 'identity_toolkit_auth_credential_gateway.dart';
import 'user_role_repository.dart';

class BackendUserRoleRepository implements UserRoleRepository {
  BackendUserRoleRepository({
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

  @override
  Future<UserRole> readRole(String uid) async {
    final currentUser = _authCredentialGateway.currentUser;
    if (currentUser == null ||
        currentUser.isAnonymous ||
        currentUser.uid != uid) {
      return UserRole.unknown;
    }

    try {
      final snapshot = await _snapshotClient.readCurrent();
      return snapshot.role;
    } catch (_) {
      return UserRole.unknown;
    }
  }

  @override
  Stream<UserRole?> watchRole(String uid) async* {
    final currentUser = _authCredentialGateway.currentUser;
    if (currentUser == null ||
        currentUser.isAnonymous ||
        currentUser.uid != uid) {
      yield UserRole.unknown;
      return;
    }

    UserRole? lastRole;
    while (true) {
      final nextRole = await readRole(uid);
      if (nextRole != lastRole) {
        lastRole = nextRole;
        yield nextRole;
      }
      await Future<void>.delayed(_pollInterval);
    }
  }
}
