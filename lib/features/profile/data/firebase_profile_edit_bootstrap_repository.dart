import 'package:cloud_firestore/cloud_firestore.dart';

import '../../auth/data/firestore_user_role_repository.dart';
import '../../auth/domain/user_role.dart';
import '../domain/profile_edit_bootstrap_repository.dart';

class FirebaseProfileEditBootstrapRepository
    implements ProfileEditBootstrapRepository {
  FirebaseProfileEditBootstrapRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<UserRole> getUserRole(String uid) async {
    return FirestoreUserRoleRepository(firestore: _firestore).readRole(uid);
  }

  @override
  Future<ProfileEditUserRemoteData> loadUserProfile(String uid) async {
    try {
      final snapshot = await _firestore.collection('users').doc(uid).get();
      final data = snapshot.data();
      return ProfileEditUserRemoteData(
        displayName: data?['displayName'] as String?,
        phone: data?['phone'] as String?,
        photoUrl: data?['photoUrl'] as String?,
        photoPath: data?['photoPath'] as String?,
      );
    } catch (_) {
      return const ProfileEditUserRemoteData();
    }
  }

  @override
  Future<ProfileEditDriverRemoteData> loadDriverProfile(String uid) async {
    try {
      final snapshot = await _firestore.collection('drivers').doc(uid).get();
      final data = snapshot.data();
      return ProfileEditDriverRemoteData(
        name: data?['name'] as String?,
        phone: data?['phone'] as String?,
        photoUrl: data?['photoUrl'] as String?,
        photoPath: data?['photoPath'] as String?,
      );
    } catch (_) {
      return const ProfileEditDriverRemoteData();
    }
  }
}
