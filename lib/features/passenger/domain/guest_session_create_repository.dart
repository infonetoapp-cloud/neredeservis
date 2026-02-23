class CreateGuestSessionCommand {
  const CreateGuestSessionCommand({
    required this.srvCode,
    this.name,
  });

  final String srvCode;
  final String? name;
}

class CreateGuestSessionResult {
  const CreateGuestSessionResult({
    required this.routeId,
    this.routeName,
    required this.sessionId,
    required this.expiresAt,
  });

  final String routeId;
  final String? routeName;
  final String sessionId;
  final String expiresAt;
}

abstract class GuestSessionCreateRepository {
  Future<CreateGuestSessionResult> createGuestSession(
    CreateGuestSessionCommand command,
  );
}
