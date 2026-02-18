import 'dart:math' as math;

class IdempotencyKeyHelper {
  IdempotencyKeyHelper({
    math.Random? random,
  }) : _random = random ?? math.Random.secure();

  static const String _randomAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  static const int _randomLength = 10;
  static final RegExp _allowedPartRegex = RegExp(r'^[a-z0-9_]+$');
  static final RegExp _keyRegex = RegExp(
    r'^[a-z0-9_]+-[a-z0-9_]+-[a-z0-9]+-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$',
  );

  final math.Random _random;

  String generate({
    required String action,
    required String subject,
    DateTime? nowUtc,
  }) {
    final actionPart = _sanitizePart(action, fallback: 'action');
    final subjectPart = _sanitizePart(subject, fallback: 'subject');
    final timestampPart = (nowUtc ?? DateTime.now().toUtc())
        .millisecondsSinceEpoch
        .toRadixString(36);
    final randomPart = _randomToken();
    return '$actionPart-$subjectPart-$timestampPart-$randomPart';
  }

  bool isValid(String key) {
    return _keyRegex.hasMatch(key);
  }

  String buildTripRequestDocId({
    required String uid,
    required String idempotencyKey,
  }) {
    final uidPart = _sanitizePart(uid, fallback: 'uid');
    return '${uidPart}_$idempotencyKey';
  }

  String _sanitizePart(
    String input, {
    required String fallback,
  }) {
    final lowered = input.trim().toLowerCase();
    final normalized = lowered.replaceAll(RegExp(r'[^a-z0-9]+'), '_');
    final compact = normalized.replaceAll(RegExp(r'_+'), '_');
    final trimmed = compact.replaceAll(RegExp(r'^_|_$'), '');
    if (trimmed.isEmpty) {
      return fallback;
    }
    if (_allowedPartRegex.hasMatch(trimmed)) {
      return trimmed;
    }
    return fallback;
  }

  String _randomToken() {
    final buffer = StringBuffer();
    for (var i = 0; i < _randomLength; i++) {
      final index = _random.nextInt(_randomAlphabet.length);
      buffer.write(_randomAlphabet[index]);
    }
    return buffer.toString();
  }
}
