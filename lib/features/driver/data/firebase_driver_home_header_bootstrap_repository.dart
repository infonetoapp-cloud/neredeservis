import 'package:cloud_firestore/cloud_firestore.dart';

import '../../auth/data/firestore_user_role_repository.dart';
import '../../auth/domain/user_role.dart';
import '../domain/driver_home_header_bootstrap_repository.dart';

class FirebaseDriverHomeHeaderBootstrapRepository
    implements DriverHomeHeaderBootstrapRepository {
  FirebaseDriverHomeHeaderBootstrapRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<UserRole> getUserRole(String uid) async {
    return FirestoreUserRoleRepository(firestore: _firestore).readRole(uid);
  }

  @override
  Future<DriverHomeUserProfileRemoteData> loadUserProfile(String uid) async {
    try {
      final snapshot = await _firestore.collection('users').doc(uid).get();
      final data = snapshot.data();
      return DriverHomeUserProfileRemoteData(
        displayName: data?['displayName'] as String?,
        photoUrl: data?['photoUrl'] as String?,
      );
    } catch (_) {
      return const DriverHomeUserProfileRemoteData();
    }
  }

  @override
  Future<DriverHomeDriverProfileRemoteData> loadDriverProfile(
      String uid) async {
    try {
      final snapshot = await _firestore.collection('drivers').doc(uid).get();
      final data = snapshot.data();
      return DriverHomeDriverProfileRemoteData(
        name: data?['name'] as String?,
        photoUrl: data?['photoUrl'] as String?,
      );
    } catch (_) {
      return const DriverHomeDriverProfileRemoteData();
    }
  }
}
