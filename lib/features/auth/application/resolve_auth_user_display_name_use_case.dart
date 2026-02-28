class ResolveAuthUserDisplayNameCommand {
  const ResolveAuthUserDisplayNameCommand({
    required this.displayName,
    required this.email,
    required this.isAnonymous,
  });

  final String? displayName;
  final String? email;
  final bool isAnonymous;
}

class ResolveAuthUserDisplayNameUseCase {
  const ResolveAuthUserDisplayNameUseCase();

  String execute(ResolveAuthUserDisplayNameCommand command) {
    final normalizedDisplayName = command.displayName?.trim();
    if (normalizedDisplayName != null && normalizedDisplayName.length >= 2) {
      return normalizedDisplayName;
    }

    final normalizedEmail = command.email?.trim();
    if (normalizedEmail != null && normalizedEmail.isNotEmpty) {
      final prefix = normalizedEmail.split('@').first.trim();
      if (prefix.length >= 2) {
        return prefix;
      }
    }

    return command.isAnonymous ? 'Misafir' : 'Kullanici';
  }
}
