import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/application/auth_role_bootstrap_service.dart';
import '../../features/auth/data/auth_gateway.dart';
import '../../features/auth/data/backend_user_role_repository.dart';
import '../../features/auth/data/bootstrap_user_profile_client.dart';
import '../../features/auth/data/current_auth_profile_snapshot_client.dart';
import '../../features/auth/data/identity_toolkit_auth_gateway.dart';
import '../../features/auth/data/update_user_profile_client.dart';
import '../../features/auth/data/user_role_repository.dart';
import '../../features/auth/domain/auth_session.dart';
import '../../features/auth/domain/user_role.dart';
import 'auth_state_provider.dart';

final authGatewayProvider = Provider<AuthGateway>((ref) {
  return IdentityToolkitAuthGateway();
});

final userRoleRepositoryProvider = Provider<UserRoleRepository>((ref) {
  return BackendUserRoleRepository(
    snapshotClient: ref.watch(currentAuthProfileSnapshotClientProvider),
  );
});

final bootstrapUserProfileClientProvider =
    Provider<BootstrapUserProfileClient>((ref) {
  return BootstrapUserProfileClient();
});

final currentAuthProfileSnapshotClientProvider =
    Provider<CurrentAuthProfileSnapshotClient>((ref) {
  return CurrentAuthProfileSnapshotClient();
});

final updateUserProfileClientProvider =
    Provider<UpdateUserProfileClient>((ref) {
  return UpdateUserProfileClient();
});

final authRoleBootstrapServiceProvider =
    Provider<AuthRoleBootstrapService>((ref) {
  final authGateway = ref.watch(authGatewayProvider);
  final bootstrapClient = ref.watch(bootstrapUserProfileClientProvider);
  final updateUserProfileClient = ref.watch(updateUserProfileClientProvider);
  final userRoleRepository = ref.watch(userRoleRepositoryProvider);

  return AuthRoleBootstrapService(
    authGateway: authGateway,
    bootstrapClient: bootstrapClient,
    updateUserProfileClient: updateUserProfileClient,
    userRoleRepository: userRoleRepository,
  );
});

final currentUserRoleProvider = StreamProvider<UserRole>((ref) {
  final service = ref.watch(authRoleBootstrapServiceProvider);
  return service.watchCurrentRole();
});

final currentUserConsentGrantedProvider = StreamProvider<bool>((ref) {
  final session = ref.watch(authSessionStateProvider).valueOrNull;
  if (session == null || session.isAnonymous) {
    return Stream<bool>.value(true);
  }
  final snapshotClient = ref.watch(currentAuthProfileSnapshotClientProvider);
  return _watchCurrentUserConsentGranted(session, snapshotClient);
});

Stream<bool> _watchCurrentUserConsentGranted(
  AuthSession user,
  CurrentAuthProfileSnapshotClient snapshotClient,
) async* {
  bool? lastValue;
  while (true) {
    var nextValue = false;
    try {
      final snapshot = await snapshotClient.readCurrent();
      nextValue =
          snapshot.uid == user.uid && snapshot.consent?.locationConsent == true;
    } catch (_) {
      nextValue = false;
    }

    if (lastValue != nextValue) {
      lastValue = nextValue;
      yield nextValue;
    }
    await Future<void>.delayed(const Duration(seconds: 30));
  }
}
