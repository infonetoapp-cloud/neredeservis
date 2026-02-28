const String minRequiredAppVersion = String.fromEnvironment(
  'MIN_REQUIRED_APP_VERSION',
  defaultValue: '',
);

bool shouldForceUpdateVersion({
  required String currentVersion,
  required String minVersion,
}) {
  final normalizedMin = minVersion.trim();
  if (normalizedMin.isEmpty) {
    return false;
  }
  return compareSemanticVersions(currentVersion, normalizedMin) < 0;
}

int compareSemanticVersions(String left, String right) {
  final leftParts = _parseVersionParts(left);
  final rightParts = _parseVersionParts(right);
  final maxLength =
      leftParts.length > rightParts.length ? leftParts.length : rightParts.length;
  for (var index = 0; index < maxLength; index++) {
    final leftValue = index < leftParts.length ? leftParts[index] : 0;
    final rightValue = index < rightParts.length ? rightParts[index] : 0;
    if (leftValue == rightValue) {
      continue;
    }
    return leftValue < rightValue ? -1 : 1;
  }
  return 0;
}

List<int> _parseVersionParts(String raw) {
  final normalized = raw.trim();
  if (normalized.isEmpty) {
    return const <int>[0];
  }
  final withoutSuffix = normalized.split('+').first.split('-').first;
  final tokens = withoutSuffix.split('.');
  if (tokens.isEmpty) {
    return const <int>[0];
  }
  return tokens
      .map((token) => int.tryParse(token.trim()) ?? 0)
      .toList(growable: false);
}
