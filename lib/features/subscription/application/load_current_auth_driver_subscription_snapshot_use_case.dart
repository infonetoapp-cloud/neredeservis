import '../../auth/application/read_user_role_use_case.dart';
import '../../auth/data/auth_credential_gateway.dart';
import '../../auth/domain/user_role.dart';
import '../domain/driver_subscription_snapshot.dart';
import 'load_driver_subscription_snapshot_use_case.dart';

class LoadCurrentAuthDriverSubscriptionSnapshotUseCase {
  const LoadCurrentAuthDriverSubscriptionSnapshotUseCase({
    required AuthCredentialGateway authCredentialGateway,
    required ReadUserRoleUseCase readUserRoleUseCase,
    required LoadDriverSubscriptionSnapshotUseCase
        loadDriverSubscriptionSnapshotUseCase,
  })  : _authCredentialGateway = authCredentialGateway,
        _readUserRoleUseCase = readUserRoleUseCase,
        _loadDriverSubscriptionSnapshotUseCase =
            loadDriverSubscriptionSnapshotUseCase;

  final AuthCredentialGateway _authCredentialGateway;
  final ReadUserRoleUseCase _readUserRoleUseCase;
  final LoadDriverSubscriptionSnapshotUseCase
      _loadDriverSubscriptionSnapshotUseCase;

  Future<DriverSubscriptionSnapshot> execute() async {
    final user = _authCredentialGateway.currentUser;
    if (user == null || user.isAnonymous) {
      return const DriverSubscriptionSnapshot();
    }

    final role = await _readUserRoleUseCase.execute(user.uid);
    if (role != UserRole.driver) {
      return const DriverSubscriptionSnapshot();
    }

    return _loadDriverSubscriptionSnapshotUseCase.execute(user.uid);
  }
}
