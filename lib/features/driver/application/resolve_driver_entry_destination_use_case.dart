import 'read_driver_profile_record_use_case.dart';

enum DriverEntryDestination {
  home,
  profileSetup,
}

class ResolveDriverEntryDestinationUseCase {
  const ResolveDriverEntryDestinationUseCase({
    required ReadDriverProfileRecordUseCase readDriverProfileRecordUseCase,
  }) : _readDriverProfileRecordUseCase = readDriverProfileRecordUseCase;

  final ReadDriverProfileRecordUseCase _readDriverProfileRecordUseCase;

  Future<DriverEntryDestination> execute(String? uid) async {
    final normalizedUid = uid?.trim();
    if (normalizedUid == null || normalizedUid.isEmpty) {
      return DriverEntryDestination.profileSetup;
    }

    try {
      final snapshot = await _readDriverProfileRecordUseCase.execute(
        normalizedUid,
      );
      if (_hasReadyDriverProfile(snapshot)) {
        return DriverEntryDestination.home;
      }
      return DriverEntryDestination.profileSetup;
    } catch (_) {
      return DriverEntryDestination.profileSetup;
    }
  }

  bool _hasReadyDriverProfile(DriverProfileRecordSnapshot? snapshot) {
    if (snapshot == null) {
      return false;
    }
    final name = snapshot.name.trim();
    final phone = snapshot.phone.trim();
    final plate = snapshot.plate.trim();
    return name.length >= 2 && phone.length >= 7 && plate.length >= 3;
  }
}
