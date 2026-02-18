import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/application/auth_role_bootstrap_service.dart';
import '../../features/auth/data/auth_gateway.dart';
import '../../features/auth/data/bootstrap_user_profile_client.dart';
import '../../features/auth/data/firebase_auth_gateway.dart';
import '../../features/auth/data/firestore_user_role_repository.dart';
import '../../features/auth/data/update_user_profile_client.dart';
import '../../features/auth/data/user_role_repository.dart';
import '../../features/auth/domain/user_role.dart';
import 'auth_state_provider.dart';

final authGatewayProvider = Provider<AuthGateway>((ref) {
  return FirebaseAuthGateway();
});

final userRoleRepositoryProvider = Provider<UserRoleRepository>((ref) {
  return FirestoreUserRoleRepository();
});

final bootstrapUserProfileClientProvider =
    Provider<BootstrapUserProfileClient>((ref) {
  return BootstrapUserProfileClient();
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
  final user = ref.watch(firebaseAuthStateProvider).valueOrNull;
  if (user == null) {
    return Stream<bool>.value(true);
  }

  return FirebaseFirestore.instance
      .collection('consents')
      .doc(user.uid)
      .snapshots()
      .map((snapshot) {
    final data = snapshot.data();
    if (data == null) {
      return false;
    }
    return data['locationConsent'] == true;
  });
});
