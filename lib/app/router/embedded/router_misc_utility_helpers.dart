part of '../app_router.dart';

String _buildTripActionIdempotencyKey({
  required String action,
  required String subject,
  DateTime? nowUtc,
}) {
  final sanitizedAction = _sanitizeIdempotencyPart(action);
  final sanitizedSubject = _sanitizeIdempotencyPart(subject);
  final timestampPart = (nowUtc ?? DateTime.now().toUtc())
      .millisecondsSinceEpoch
      .toRadixString(36);
  final randomPart = _randomIdempotencyToken(10);
  return '$sanitizedAction-$sanitizedSubject-$timestampPart-$randomPart';
}

String _sanitizeIdempotencyPart(String raw, {int maxLength = 24}) {
  final normalized = raw
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
      .replaceAll(RegExp(r'_+'), '_')
      .replaceAll(RegExp(r'^_|_$'), '');
  if (normalized.isEmpty) {
    return 'item';
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return normalized.substring(0, maxLength);
}

String _randomIdempotencyToken(int length) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  final buffer = StringBuffer();
  for (var index = 0; index < length; index++) {
    final alphabetIndex = _idempotencyRandom.nextInt(alphabet.length);
    buffer.write(alphabet[alphabetIndex]);
  }
  return buffer.toString();
}

String _resolveDisplayName(User? user) {
  if (user == null) {
    return 'Kullanici';
  }
  final displayName = user.displayName?.trim();
  if (displayName != null && displayName.length >= 2) {
    return displayName;
  }
  final email = user.email?.trim();
  if (email != null && email.isNotEmpty) {
    final prefix = email.split('@').first.trim();
    if (prefix.length >= 2) {
      return prefix;
    }
  }
  return user.isAnonymous ? 'Misafir' : 'Kullanici';
}

Future<bool> _tryOpenExternalUri(Uri uri) async {
  try {
    return await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );
  } catch (_) {
    return false;
  }
}

void _popRouteOrGo(
  BuildContext context, {
  required String fallbackPath,
}) {
  final navigator = Navigator.of(context);
  if (navigator.canPop()) {
    navigator.pop();
    return;
  }
  context.go(fallbackPath);
}

void _showInfo(BuildContext context, String message) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) {
    return;
  }
  messenger.clearSnackBars();
  messenger.showSnackBar(
    SnackBar(
      content: Text(message),
      behavior: SnackBarBehavior.floating,
      duration: const Duration(milliseconds: 1800),
    ),
  );
}

String _platformValue() {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    return 'ios';
  }
  return 'android';
}

String _devicePlatformKey() {
  return switch (defaultTargetPlatform) {
    TargetPlatform.android => 'android',
    TargetPlatform.iOS => 'ios',
    TargetPlatform.macOS => 'macos',
    TargetPlatform.windows => 'windows',
    TargetPlatform.linux => 'linux',
    TargetPlatform.fuchsia => 'fuchsia',
  };
}

String? _nullableToken(String? value) {
  final token = value?.trim();
  if (token == null || token.isEmpty) {
    return null;
  }
  return token;
}
