import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../auth/data/firestore_user_role_repository.dart';
import '../../auth/domain/user_role.dart';
import '../../subscription/domain/driver_subscription_snapshot.dart';
import '../domain/app_settings_bootstrap_repository.dart';

class FirebaseAppSettingsBootstrapRepository
    implements AppSettingsBootstrapRepository {
  FirebaseAppSettingsBootstrapRepository({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  @override
  Future<String?> getCurrentUserId() async {
    return _auth.currentUser?.uid;
  }

  @override
  Future<UserRole> getUserRole(String uid) async {
    return FirestoreUserRoleRepository(firestore: _firestore).readRole(uid);
  }

  @override
  Future<DriverSettingsBootstrapRemoteData> loadDriverSettingsBootstrap(
    String uid,
  ) async {
    try {
      final snapshot = await _firestore.collection('drivers').doc(uid).get();
      final data = snapshot.data();
      final subscription = parseDriverSubscriptionSnapshotFromDriverData(data);
      return DriverSettingsBootstrapRemoteData(
        subscriptionStatus: subscription.status,
        trialDaysLeft: subscription.trialDaysLeft,
        showPhoneToPassengers: data?['showPhoneToPassengers'] == true,
      );
    } catch (_) {
      return const DriverSettingsBootstrapRemoteData();
    }
  }
}
