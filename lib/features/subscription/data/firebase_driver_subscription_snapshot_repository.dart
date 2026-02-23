import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_subscription_snapshot.dart';
import '../domain/driver_subscription_snapshot_repository.dart';

class FirebaseDriverSubscriptionSnapshotRepository
    implements DriverSubscriptionSnapshotRepository {
  FirebaseDriverSubscriptionSnapshotRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<DriverSubscriptionSnapshot> loadByDriverId(String uid) async {
    try {
      final snapshot = await _firestore.collection('drivers').doc(uid).get();
      return parseDriverSubscriptionSnapshotFromDriverData(snapshot.data());
    } catch (_) {
      return const DriverSubscriptionSnapshot();
    }
  }
}
