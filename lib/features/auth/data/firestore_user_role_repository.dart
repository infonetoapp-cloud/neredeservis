import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/user_role.dart';
import 'user_role_repository.dart';

class FirestoreUserRoleRepository implements UserRoleRepository {
  FirestoreUserRoleRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Stream<UserRole?> watchRole(String uid) {
    return _firestore.collection('users').doc(uid).snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return null;
      }
      return userRoleFromRaw(data['role'] as String?);
    });
  }
}
