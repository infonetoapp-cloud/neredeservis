Uri resolveBackendApiUri(
  String path, {
  Map<String, dynamic>? queryParameters,
}) {
  const rawBaseUrl = String.fromEnvironment(
    'BACKEND_API_BASE_URL',
    defaultValue: 'https://api.neredeservis.app',
  );

  final baseUri = Uri.parse(rawBaseUrl.trim());
  final normalizedPath = path.startsWith('/') ? path : '/$path';
  final resolvedPath = _combinePaths(baseUri.path, normalizedPath);
  final normalizedQuery = <String, String>{};

  for (final entry in (queryParameters ?? const <String, dynamic>{}).entries) {
    final value = entry.value;
    if (value == null) {
      continue;
    }
    final normalizedValue = value.toString().trim();
    if (normalizedValue.isEmpty) {
      continue;
    }
    normalizedQuery[entry.key] = normalizedValue;
  }

  return baseUri.replace(
    path: resolvedPath,
    queryParameters: normalizedQuery.isEmpty ? null : normalizedQuery,
  );
}

String _combinePaths(String basePath, String nextPath) {
  final normalizedBase = basePath.endsWith('/')
      ? basePath.substring(0, basePath.length - 1)
      : basePath;
  final normalizedNext = nextPath.startsWith('/') ? nextPath : '/$nextPath';
  return '${normalizedBase.isEmpty ? '' : normalizedBase}$normalizedNext';
}
