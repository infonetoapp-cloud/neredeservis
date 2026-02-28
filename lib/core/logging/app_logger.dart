import 'package:flutter/foundation.dart';

import '../security/pii_redactor.dart';
import 'runtime_log_buffer.dart';

enum LogLevel {
  debug,
  info,
  warning,
  error,
}

typedef LogSink = void Function(String message);

abstract class AppLogger {
  const AppLogger();

  void log(
    LogLevel level,
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?> context = const <String, Object?>{},
  });

  void debug(String message,
      {Map<String, Object?> context = const <String, Object?>{}}) {
    log(LogLevel.debug, message, context: context);
  }

  void info(String message,
      {Map<String, Object?> context = const <String, Object?>{}}) {
    log(LogLevel.info, message, context: context);
  }

  void warning(String message,
      {Map<String, Object?> context = const <String, Object?>{}}) {
    log(LogLevel.warning, message, context: context);
  }

  void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?> context = const <String, Object?>{},
  }) {
    log(
      LogLevel.error,
      message,
      error: error,
      stackTrace: stackTrace,
      context: context,
    );
  }
}

class DebugAppLogger extends AppLogger {
  DebugAppLogger({
    LogSink? sink,
  }) : _sink = sink ?? _defaultSink;

  final LogSink _sink;

  static void _defaultSink(String message) {
    debugPrint(message);
  }

  @override
  void log(
    LogLevel level,
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?> context = const <String, Object?>{},
  }) {
    final sanitizedMessage = PiiRedactor.redactText(message);
    final contextPayload =
        context.isEmpty ? '' : ' | context=${_normalizeContext(context)}';
    final errorPayload = error == null
        ? ''
        : ' | error=${PiiRedactor.redactText(error.toString())}';
    final stackPayload = stackTrace == null ? '' : ' | stack=$stackTrace';
    RuntimeLogBuffer.instance.add(
      level: level.name,
      message: '$sanitizedMessage$contextPayload$errorPayload',
    );
    _sink(
      '[${level.name.toUpperCase()}] '
      '$sanitizedMessage$contextPayload$errorPayload$stackPayload',
    );
  }

  Map<String, String> _normalizeContext(Map<String, Object?> raw) {
    final dynamicMap = raw.map(
      (key, value) => MapEntry(key, value),
    );
    final redacted = PiiRedactor.redactMap(dynamicMap);
    return redacted.map(
      (key, value) => MapEntry(key, value?.toString() ?? 'null'),
    );
  }
}
