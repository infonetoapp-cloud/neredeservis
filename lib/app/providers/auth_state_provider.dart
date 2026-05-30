import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/data/auth_gateway.dart';
import '../../features/auth/data/identity_toolkit_auth_gateway.dart';
import '../../features/auth/domain/auth_session.dart';

final authStateGatewayProvider = Provider<AuthGateway>((ref) {
  return IdentityToolkitAuthGateway();
});

final authSessionStateProvider = StreamProvider<AuthSession?>((ref) {
  final gateway = ref.watch(authStateGatewayProvider);
  return gateway.authStateChanges();
});

final isSignedInProvider = Provider<bool>((ref) {
  final authState = ref.watch(authSessionStateProvider);
  final gateway = ref.watch(authStateGatewayProvider);
  return authState.valueOrNull != null || gateway.currentSession != null;
});
