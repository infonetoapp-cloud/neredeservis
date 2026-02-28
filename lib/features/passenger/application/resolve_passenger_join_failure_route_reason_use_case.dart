class ResolvePassengerJoinFailureRouteReasonUseCase {
  const ResolvePassengerJoinFailureRouteReasonUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'not-found' => 'srv_not_found',
      'failed-precondition' => 'join_closed',
      'resource-exhausted' => 'rate_limited',
      'permission-denied' => 'permission_denied',
      'unauthenticated' => 'session_expired',
      'unavailable' || 'deadline-exceeded' => 'network',
      _ => 'unknown',
    };
  }
}
