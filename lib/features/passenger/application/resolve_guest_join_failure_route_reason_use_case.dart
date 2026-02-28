class ResolveGuestJoinFailureRouteReasonUseCase {
  const ResolveGuestJoinFailureRouteReasonUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'not-found' => 'srv_not_found',
      'permission-denied' => 'join_closed',
      'unauthenticated' => 'session_expired',
      'unavailable' || 'deadline-exceeded' => 'network',
      _ => 'unknown',
    };
  }
}
