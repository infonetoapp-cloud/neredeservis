abstract class DriverActiveTripTransitionVersionRepository {
  Future<int> readCurrentTransitionVersion(String routeId);
}
