class PassengerPrimaryMembershipLookupResult {
  const PassengerPrimaryMembershipLookupResult({
    required this.routeId,
    required this.routeName,
  });

  final String routeId;
  final String? routeName;
}

abstract class PassengerPrimaryMembershipLookupRepository {
  Future<PassengerPrimaryMembershipLookupResult?> lookupPrimaryMembership(
    String passengerUid,
  );
}
