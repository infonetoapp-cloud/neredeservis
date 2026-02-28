import '../domain/passenger_primary_membership_lookup_repository.dart';

class PassengerPrimaryMembershipSnapshot {
  const PassengerPrimaryMembershipSnapshot({
    required this.routeId,
    required this.routeName,
  });

  final String routeId;
  final String? routeName;
}

class ReadPrimaryPassengerMembershipUseCase {
  ReadPrimaryPassengerMembershipUseCase({
    required PassengerPrimaryMembershipLookupRepository repository,
  }) : _repository = repository;

  final PassengerPrimaryMembershipLookupRepository _repository;

  Future<PassengerPrimaryMembershipSnapshot?> execute(String uid) async {
    final result = await _repository.lookupPrimaryMembership(uid);
    if (result == null) {
      return null;
    }
    return PassengerPrimaryMembershipSnapshot(
      routeId: result.routeId,
      routeName: result.routeName,
    );
  }
}
