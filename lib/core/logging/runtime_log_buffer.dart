import 'dart:collection';

class RuntimeLogEntry {
  const RuntimeLogEntry({
    required this.timestampUtc,
    required this.level,
    required this.message,
  });

  final DateTime timestampUtc;
  final String level;
  final String message;
}

/// In-memory ring buffer for recent log lines.
///
/// Used by support-report diagnostics to build a "last 5 minutes" summary
/// without persisting PII-bearing raw payloads to disk.
class RuntimeLogBuffer {
  RuntimeLogBuffer._();

  static final RuntimeLogBuffer instance = RuntimeLogBuffer._();

  static const int _maxEntries = 400;
  static const int _maxSummaryLines = 20;
  final Queue<RuntimeLogEntry> _entries = Queue<RuntimeLogEntry>();

  void add({
    required String level,
    required String message,
    DateTime? timestampUtc,
  }) {
    final normalizedMessage = message.trim();
    if (normalizedMessage.isEmpty) {
      return;
    }
    _entries.addLast(
      RuntimeLogEntry(
        timestampUtc: (timestampUtc ?? DateTime.now().toUtc()).toUtc(),
        level: level.trim().toUpperCase(),
        message: normalizedMessage,
      ),
    );
    while (_entries.length > _maxEntries) {
      _entries.removeFirst();
    }
  }

  List<RuntimeLogEntry> recent({
    Duration window = const Duration(minutes: 5),
    DateTime? nowUtc,
  }) {
    final now = (nowUtc ?? DateTime.now().toUtc()).toUtc();
    final threshold = now.subtract(window);
    return _entries
        .where((entry) => !entry.timestampUtc.isBefore(threshold))
        .toList(growable: false);
  }

  String buildSummary({
    Duration window = const Duration(minutes: 5),
    DateTime? nowUtc,
  }) {
    final recentEntries = recent(window: window, nowUtc: nowUtc);
    if (recentEntries.isEmpty) {
      return 'Son 5 dk log özeti: kritik hata kaydi yok.';
    }

    final tail = recentEntries.length > _maxSummaryLines
        ? recentEntries.sublist(recentEntries.length - _maxSummaryLines)
        : recentEntries;

    final lines = tail.map((entry) {
      final hour = entry.timestampUtc.hour.toString().padLeft(2, '0');
      final minute = entry.timestampUtc.minute.toString().padLeft(2, '0');
      final second = entry.timestampUtc.second.toString().padLeft(2, '0');
      return '[$hour:$minute:$second][${entry.level}] ${entry.message}';
    }).toList(growable: false);

    return 'Son 5 dk log özeti (${tail.length} kayıt):\n${lines.join('\n')}';
  }
}
