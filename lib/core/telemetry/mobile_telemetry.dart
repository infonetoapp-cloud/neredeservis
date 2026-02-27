import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../logging/runtime_log_buffer.dart';
import '../security/pii_redactor.dart';

@immutable
class TelemetryRecord {
  const TelemetryRecord({
    required this.timestampUtc,
    required this.eventName,
    required this.category,
    required this.attributes,
    required this.analyticsEnabled,
    required this.environment,
  });

  final DateTime timestampUtc;
  final String eventName;
  final String category;
  final Map<String, Object?> attributes;
  final bool analyticsEnabled;
  final String environment;
}

typedef TelemetryRecordSink = void Function(TelemetryRecord record);
typedef TelemetryBreadcrumbSink = Future<void> Function(Breadcrumb breadcrumb);

class MobileTelemetry {
  MobileTelemetry._();

  static final MobileTelemetry instance = MobileTelemetry._();

  bool _analyticsEnabled = false;
  bool _breadcrumbEnabled = false;
  String _environment = 'unknown';
  DateTime Function() _nowUtc = () => DateTime.now().toUtc();
  TelemetryRecordSink? _recordSink;
  TelemetryBreadcrumbSink _breadcrumbSink = _defaultBreadcrumbSink;

  void configure({
    required bool analyticsEnabled,
    required bool breadcrumbEnabled,
    required String environment,
  }) {
    _analyticsEnabled = analyticsEnabled;
    _breadcrumbEnabled = breadcrumbEnabled;
    _environment = environment.trim().isEmpty ? 'unknown' : environment.trim();
  }

  TelemetryRecord track({
    required String eventName,
    required String category,
    Map<String, Object?> attributes = const <String, Object?>{},
    bool addBreadcrumb = false,
  }) {
    final sanitized = _sanitizeAttributes(attributes);
    final record = TelemetryRecord(
      timestampUtc: _nowUtc(),
      eventName: eventName.trim(),
      category: category.trim().isEmpty ? 'app' : category.trim(),
      attributes: sanitized,
      analyticsEnabled: _analyticsEnabled,
      environment: _environment,
    );
    _recordSink?.call(record);

    RuntimeLogBuffer.instance.add(
      level: 'INFO',
      message:
          'telemetry event=${record.eventName} category=${record.category} '
          'env=${record.environment} analytics='
          '${record.analyticsEnabled ? 'on' : 'off'} attrs=${record.attributes}',
    );

    if (addBreadcrumb && _breadcrumbEnabled) {
      final breadcrumbData = record.attributes.map(
        (key, value) => MapEntry<String, dynamic>(key, value),
      );
      final breadcrumb = Breadcrumb(
        category: record.category,
        type: 'info',
        level: SentryLevel.info,
        message: record.eventName,
        timestamp: record.timestampUtc,
        data: breadcrumbData,
      );
      unawaited(_safeAddBreadcrumb(breadcrumb));
    }

    return record;
  }

  TelemetryRecord trackPerf({
    required String eventName,
    required int durationMs,
    Map<String, Object?> attributes = const <String, Object?>{},
    bool addBreadcrumb = false,
  }) {
    final merged = <String, Object?>{
      ...attributes,
      'durationMs': durationMs,
    };
    return track(
      eventName: eventName,
      category: 'perf',
      attributes: merged,
      addBreadcrumb: addBreadcrumb,
    );
  }

  Future<T> traceDuration<T>({
    required String eventName,
    required Future<T> Function() run,
    Map<String, Object?> attributes = const <String, Object?>{},
    bool addBreadcrumbOnSuccess = false,
    bool addBreadcrumbOnError = true,
  }) async {
    final stopwatch = Stopwatch()..start();
    try {
      final result = await run();
      trackPerf(
        eventName: eventName,
        durationMs: stopwatch.elapsedMilliseconds,
        attributes: <String, Object?>{
          ...attributes,
          'outcome': 'success',
        },
        addBreadcrumb: addBreadcrumbOnSuccess,
      );
      return result;
    } catch (error) {
      trackPerf(
        eventName: eventName,
        durationMs: stopwatch.elapsedMilliseconds,
        attributes: <String, Object?>{
          ...attributes,
          'outcome': 'error',
          'errorType': error.runtimeType.toString(),
        },
        addBreadcrumb: addBreadcrumbOnError,
      );
      rethrow;
    }
  }

  @visibleForTesting
  void setTestHooks({
    TelemetryRecordSink? recordSink,
    TelemetryBreadcrumbSink? breadcrumbSink,
    DateTime Function()? nowUtc,
  }) {
    _recordSink = recordSink;
    _breadcrumbSink = breadcrumbSink ?? _defaultBreadcrumbSink;
    _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());
  }

  @visibleForTesting
  void resetForTests() {
    _recordSink = null;
    _breadcrumbSink = _defaultBreadcrumbSink;
    _nowUtc = () => DateTime.now().toUtc();
    _analyticsEnabled = false;
    _breadcrumbEnabled = false;
    _environment = 'unknown';
  }

  Map<String, Object?> _sanitizeAttributes(Map<String, Object?> raw) {
    if (raw.isEmpty) {
      return const <String, Object?>{};
    }
    final dynamicMap = raw.map<String, dynamic>(
      (key, value) => MapEntry(key, value),
    );
    final redacted = PiiRedactor.redactMap(dynamicMap);
    return redacted.map(
      (key, value) => MapEntry(key, _normalizeValue(value)),
    );
  }

  Object? _normalizeValue(Object? value) {
    if (value == null || value is bool || value is num || value is String) {
      return value;
    }
    if (value is DateTime) {
      return value.toUtc().toIso8601String();
    }
    if (value is Map) {
      final normalized = <String, Object?>{};
      value.forEach((dynamic key, dynamic item) {
        normalized[key.toString()] = _normalizeValue(item);
      });
      return normalized;
    }
    if (value is Iterable) {
      return value
          .map<Object?>((dynamic item) => _normalizeValue(item))
          .toList(growable: false);
    }
    return value.toString();
  }

  static Future<void> _defaultBreadcrumbSink(Breadcrumb breadcrumb) async {
    await Sentry.addBreadcrumb(breadcrumb);
  }

  Future<void> _safeAddBreadcrumb(Breadcrumb breadcrumb) async {
    try {
      await _breadcrumbSink(breadcrumb);
    } catch (_) {
      // Breadcrumb emission must never break the user flow.
    }
  }
}
