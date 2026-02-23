import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/driver_profile_setup_bootstrap_repository.dart';

class FirebaseDriverProfileSetupBootstrapRepository
    implements DriverProfileSetupBootstrapRepository {
  FirebaseDriverProfileSetupBootstrapRepository({
    FirebaseFirestore? firestore,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  @override
  Future<DriverProfileSetupRemoteData> loadRemoteData(String uid) async {
    try {
      final futures = await Future.wait<dynamic>(<Future<dynamic>>[
        _firestore.collection('users').doc(uid).get(),
        _firestore.collection('drivers').doc(uid).get(),
      ]);

      final userSnapshot = futures[0] as DocumentSnapshot<Map<String, dynamic>>;
      final driverSnapshot =
          futures[1] as DocumentSnapshot<Map<String, dynamic>>;
      final userData = userSnapshot.data();
      final driverData = driverSnapshot.data();
      final showPhoneRaw = driverData?['showPhoneToPassengers'];

      return DriverProfileSetupRemoteData(
        userDisplayName: userData?['displayName'] as String?,
        userPhone: userData?['phone'] as String?,
        userPhotoUrl: userData?['photoUrl'] as String?,
        userPhotoPath: userData?['photoPath'] as String?,
        driverName: driverData?['name'] as String?,
        driverPhone: driverData?['phone'] as String?,
        driverPlate: driverData?['plate'] as String?,
        driverPhotoUrl: driverData?['photoUrl'] as String?,
        driverPhotoPath: driverData?['photoPath'] as String?,
        driverShowPhoneToPassengers: showPhoneRaw is bool ? showPhoneRaw : null,
      );
    } catch (_) {
      return const DriverProfileSetupRemoteData();
    }
  }
}
